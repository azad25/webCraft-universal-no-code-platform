"""
Billing domain service
"""

from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
from decimal import Decimal

from src.common.exceptions import NotFoundError, ValidationError, AuthorizationError
from .models import Subscription, Invoice, PaymentMethod, BillingAddress, UsageRecord
from .schemas import (
    SubscriptionCreate, SubscriptionUpdate, PaymentMethodCreate, 
    BillingAddressCreate, UsageRecordCreate
)


class BillingService:
    """Billing service"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Subscription management
    def get_subscription(self, user_id: uuid.UUID) -> Optional[Subscription]:
        """Get user's active subscription"""
        return self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status.in_(["active", "trialing", "past_due"])
        ).first()
    
    def create_subscription(self, user_id: uuid.UUID, data: SubscriptionCreate) -> Subscription:
        """Create a new subscription"""
        # Check if user already has active subscription
        existing = self.get_subscription(user_id)
        if existing:
            raise ValidationError("User already has an active subscription")
        
        # Get plan details (would fetch from plans service in production)
        plan_details = self._get_plan_details(data.plan_id)
        
        # Calculate dates
        start_date = datetime.utcnow()
        if data.trial_days:
            trial_end = start_date + timedelta(days=data.trial_days)
            period_start = trial_end
        else:
            trial_end = None
            period_start = start_date
        
        if plan_details["billing_cycle"] == "monthly":
            period_end = period_start + timedelta(days=30)
        else:  # yearly
            period_end = period_start + timedelta(days=365)
        
        subscription = Subscription(
            user_id=user_id,
            plan_id=data.plan_id,
            plan_name=plan_details["name"],
            status="trialing" if data.trial_days else "active",
            amount=Decimal(str(plan_details["amount"])),
            currency=plan_details["currency"],
            billing_cycle=plan_details["billing_cycle"],
            current_period_start=period_start.isoformat(),
            current_period_end=period_end.isoformat(),
            trial_end=trial_end.isoformat() if trial_end else None
        )
        
        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(subscription)
        
        return subscription
    
    def update_subscription(self, user_id: uuid.UUID, data: SubscriptionUpdate) -> Subscription:
        """Update subscription"""
        subscription = self.get_subscription(user_id)
        if not subscription:
            raise NotFoundError("No active subscription found")
        
        if data.plan_id and data.plan_id != subscription.plan_id:
            # Plan change
            plan_details = self._get_plan_details(data.plan_id)
            subscription.plan_id = data.plan_id
            subscription.plan_name = plan_details["name"]
            subscription.amount = Decimal(str(plan_details["amount"]))
            subscription.billing_cycle = plan_details["billing_cycle"]
        
        subscription.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(subscription)
        
        return subscription
    
    def cancel_subscription(self, user_id: uuid.UUID, immediate: bool = False) -> Subscription:
        """Cancel subscription"""
        subscription = self.get_subscription(user_id)
        if not subscription:
            raise NotFoundError("No active subscription found")
        
        if immediate:
            subscription.status = "canceled"
            subscription.canceled_at = datetime.utcnow().isoformat()
        else:
            # Cancel at period end
            subscription.status = "cancel_at_period_end"
        
        subscription.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(subscription)
        
        return subscription
    
    # Invoice management
    def list_invoices(self, user_id: uuid.UUID, page: int = 1, per_page: int = 20) -> tuple[List[Invoice], int]:
        """List user's invoices"""
        subscription = self.get_subscription(user_id)
        if not subscription:
            return [], 0
        
        query = self.db.query(Invoice).filter(Invoice.subscription_id == subscription.id)
        total = query.count()
        
        invoices = query.order_by(Invoice.invoice_date.desc()).offset(
            (page - 1) * per_page
        ).limit(per_page).all()
        
        return invoices, total
    
    def get_invoice(self, user_id: uuid.UUID, invoice_id: uuid.UUID) -> Invoice:
        """Get specific invoice"""
        subscription = self.get_subscription(user_id)
        if not subscription:
            raise NotFoundError("No active subscription found")
        
        invoice = self.db.query(Invoice).filter(
            Invoice.id == invoice_id,
            Invoice.subscription_id == subscription.id
        ).first()
        
        if not invoice:
            raise NotFoundError("Invoice not found")
        
        return invoice
    
    def get_upcoming_invoice(self, user_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """Get upcoming invoice preview"""
        subscription = self.get_subscription(user_id)
        if not subscription:
            return None
        
        # Calculate upcoming invoice (would use Stripe in production)
        return {
            "amount_due": float(subscription.amount),
            "currency": subscription.currency,
            "period_start": subscription.current_period_end,
            "period_end": (datetime.fromisoformat(subscription.current_period_end) + 
                          timedelta(days=30 if subscription.billing_cycle == "monthly" else 365)).isoformat(),
            "line_items": [
                {
                    "description": f"{subscription.plan_name} - {subscription.billing_cycle}",
                    "amount": float(subscription.amount)
                }
            ]
        }
    
    # Payment methods
    def list_payment_methods(self, user_id: uuid.UUID) -> List[PaymentMethod]:
        """List user's payment methods"""
        return self.db.query(PaymentMethod).filter(
            PaymentMethod.user_id == user_id
        ).all()
    
    def add_payment_method(self, user_id: uuid.UUID, data: PaymentMethodCreate) -> PaymentMethod:
        """Add payment method"""
        # If this is set as default, unset others
        if data.is_default:
            self.db.query(PaymentMethod).filter(
                PaymentMethod.user_id == user_id
            ).update({"is_default": False})
        
        payment_method = PaymentMethod(
            user_id=user_id,
            payment_type=data.payment_type,
            is_default=data.is_default,
            stripe_payment_method_id=data.stripe_payment_method_id
        )
        
        # If this is the first payment method, make it default
        existing_count = self.db.query(PaymentMethod).filter(
            PaymentMethod.user_id == user_id
        ).count()
        
        if existing_count == 0:
            payment_method.is_default = True
        
        self.db.add(payment_method)
        self.db.commit()
        self.db.refresh(payment_method)
        
        return payment_method
    
    def delete_payment_method(self, user_id: uuid.UUID, payment_method_id: uuid.UUID) -> bool:
        """Delete payment method"""
        payment_method = self.db.query(PaymentMethod).filter(
            PaymentMethod.id == payment_method_id,
            PaymentMethod.user_id == user_id
        ).first()
        
        if not payment_method:
            raise NotFoundError("Payment method not found")
        
        self.db.delete(payment_method)
        self.db.commit()
        
        return True
    
    # Billing address
    def get_billing_address(self, user_id: uuid.UUID) -> Optional[BillingAddress]:
        """Get user's billing address"""
        return self.db.query(BillingAddress).filter(
            BillingAddress.user_id == user_id
        ).first()
    
    def update_billing_address(self, user_id: uuid.UUID, data: BillingAddressCreate) -> BillingAddress:
        """Update billing address"""
        address = self.get_billing_address(user_id)
        
        if address:
            # Update existing
            for field, value in data.model_dump().items():
                setattr(address, field, value)
            address.updated_at = datetime.utcnow()
        else:
            # Create new
            address = BillingAddress(
                user_id=user_id,
                **data.model_dump()
            )
            self.db.add(address)
        
        self.db.commit()
        self.db.refresh(address)
        
        return address
    
    # Usage tracking
    def record_usage(self, user_id: uuid.UUID, data: UsageRecordCreate) -> UsageRecord:
        """Record usage"""
        subscription = self.get_subscription(user_id)
        if not subscription:
            raise ValidationError("No active subscription found")
        
        usage_record = UsageRecord(
            subscription_id=subscription.id,
            metric_name=data.metric_name,
            quantity=data.quantity,
            timestamp=data.timestamp or datetime.utcnow().isoformat(),
            record_metadata=data.metadata
        )
        
        self.db.add(usage_record)
        self.db.commit()
        self.db.refresh(usage_record)
        
        return usage_record
    
    def get_usage_stats(self, user_id: uuid.UUID, period_days: int = 30) -> Dict[str, Any]:
        """Get usage statistics"""
        subscription = self.get_subscription(user_id)
        if not subscription:
            return {"metrics": {}}
        
        # Calculate period
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=period_days)
        
        # Get usage records
        usage_records = self.db.query(UsageRecord).filter(
            UsageRecord.subscription_id == subscription.id,
            UsageRecord.timestamp >= start_date.isoformat(),
            UsageRecord.timestamp <= end_date.isoformat()
        ).all()
        
        # Aggregate by metric
        metrics = {}
        for record in usage_records:
            if record.metric_name not in metrics:
                metrics[record.metric_name] = {
                    "current": 0,
                    "limit": self._get_metric_limit(subscription.plan_id, record.metric_name),
                    "unit": self._get_metric_unit(record.metric_name)
                }
            metrics[record.metric_name]["current"] += record.quantity
        
        # Calculate percentages
        for metric_name, data in metrics.items():
            if data["limit"] > 0:
                data["percentage"] = (data["current"] / data["limit"]) * 100
            else:
                data["percentage"] = 0
        
        return {
            "period_start": start_date.isoformat(),
            "period_end": end_date.isoformat(),
            "metrics": metrics
        }
    
    def get_billing_overview(self, user_id: uuid.UUID) -> Dict[str, Any]:
        """Get billing overview"""
        subscription = self.get_subscription(user_id)
        payment_methods = self.list_payment_methods(user_id)
        billing_address = self.get_billing_address(user_id)
        upcoming_invoice = self.get_upcoming_invoice(user_id)
        usage_stats = self.get_usage_stats(user_id)
        
        return {
            "subscription": subscription,
            "current_usage": {metric: data["current"] for metric, data in usage_stats["metrics"].items()},
            "next_invoice": upcoming_invoice,
            "payment_method": next((pm for pm in payment_methods if pm.is_default), None),
            "billing_address": billing_address
        }
    
    # Helper methods
    def _get_plan_details(self, plan_id: str) -> Dict[str, Any]:
        """Get plan details (would fetch from plans service in production)"""
        plans = {
            "starter": {
                "name": "Starter Plan",
                "amount": 9.99,
                "currency": "USD",
                "billing_cycle": "monthly"
            },
            "pro": {
                "name": "Pro Plan", 
                "amount": 29.99,
                "currency": "USD",
                "billing_cycle": "monthly"
            },
            "enterprise": {
                "name": "Enterprise Plan",
                "amount": 99.99,
                "currency": "USD",
                "billing_cycle": "monthly"
            }
        }
        
        if plan_id not in plans:
            raise ValidationError(f"Invalid plan ID: {plan_id}")
        
        return plans[plan_id]
    
    def _get_metric_limit(self, plan_id: str, metric_name: str) -> int:
        """Get metric limit for plan"""
        limits = {
            "starter": {"api_calls": 10000, "storage_gb": 5, "apps": 3},
            "pro": {"api_calls": 100000, "storage_gb": 50, "apps": 10},
            "enterprise": {"api_calls": 1000000, "storage_gb": 500, "apps": 100}
        }
        
        return limits.get(plan_id, {}).get(metric_name, 0)
    
    def _get_metric_unit(self, metric_name: str) -> str:
        """Get metric unit"""
        units = {
            "api_calls": "calls",
            "storage_gb": "GB",
            "apps": "apps",
            "bandwidth_gb": "GB"
        }
        
        return units.get(metric_name, "units")