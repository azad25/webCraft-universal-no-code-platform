"""
Payment Service for WebCraft Platform
Handles subscriptions, payments, and billing integration with Stripe
"""

import stripe
import os
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import json

from core.database import User, App

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class PaymentService:
    """Service for handling payments and subscriptions"""
    
    def __init__(self, db: Session):
        self.db = db
        
        # Subscription plans
        self.plans = {
            "free": {
                "name": "Free",
                "price": 0,
                "features": {
                    "apps": 3,
                    "pages_per_app": 10,
                    "storage_gb": 1,
                    "bandwidth_gb": 10,
                    "custom_domain": False,
                    "ai_requests_per_month": 50,
                    "api_calls_per_month": 1000,
                    "support": "community"
                }
            },
            "pro": {
                "name": "Pro",
                "price": 29,
                "stripe_price_id": os.getenv("STRIPE_PRO_PRICE_ID"),
                "features": {
                    "apps": 25,
                    "pages_per_app": 100,
                    "storage_gb": 50,
                    "bandwidth_gb": 500,
                    "custom_domain": True,
                    "ai_requests_per_month": 1000,
                    "api_calls_per_month": 50000,
                    "support": "email",
                    "advanced_widgets": True,
                    "white_label": False
                }
            },
            "enterprise": {
                "name": "Enterprise",
                "price": 99,
                "stripe_price_id": os.getenv("STRIPE_ENTERPRISE_PRICE_ID"),
                "features": {
                    "apps": "unlimited",
                    "pages_per_app": "unlimited",
                    "storage_gb": 500,
                    "bandwidth_gb": 5000,
                    "custom_domain": True,
                    "ai_requests_per_month": 10000,
                    "api_calls_per_month": "unlimited",
                    "support": "priority",
                    "advanced_widgets": True,
                    "white_label": True,
                    "sso": True,
                    "dedicated_support": True
                }
            }
        }
    
    async def create_customer(self, user: User) -> Dict[str, Any]:
        """Create a Stripe customer for the user"""
        
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.full_name,
                metadata={
                    "user_id": str(user.id),
                    "username": user.username
                }
            )
            
            # Store customer ID in user record
            user.stripe_customer_id = customer.id
            self.db.commit()
            
            return {
                "success": True,
                "customer_id": customer.id,
                "customer": customer
            }
        
        except stripe.error.StripeError as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def create_subscription(
        self,
        user: User,
        plan: str,
        payment_method_id: str
    ) -> Dict[str, Any]:
        """Create a subscription for the user"""
        
        if plan not in self.plans:
            return {"success": False, "error": "Invalid plan"}
        
        plan_config = self.plans[plan]
        
        if plan == "free":
            # Handle free plan upgrade
            user.subscription_tier = "free"
            user.is_premium = False
            self.db.commit()
            
            return {
                "success": True,
                "plan": "free",
                "message": "Switched to free plan"
            }
        
        try:
            # Ensure customer exists
            if not hasattr(user, 'stripe_customer_id') or not user.stripe_customer_id:
                customer_result = await self.create_customer(user)
                if not customer_result["success"]:
                    return customer_result
            
            # Attach payment method to customer
            stripe.PaymentMethod.attach(
                payment_method_id,
                customer=user.stripe_customer_id
            )
            
            # Set as default payment method
            stripe.Customer.modify(
                user.stripe_customer_id,
                invoice_settings={
                    "default_payment_method": payment_method_id
                }
            )
            
            # Create subscription
            subscription = stripe.Subscription.create(
                customer=user.stripe_customer_id,
                items=[{
                    "price": plan_config["stripe_price_id"]
                }],
                payment_behavior="default_incomplete",
                payment_settings={
                    "save_default_payment_method": "on_subscription"
                },
                expand=["latest_invoice.payment_intent"],
                metadata={
                    "user_id": str(user.id),
                    "plan": plan
                }
            )
            
            # Update user subscription
            user.subscription_tier = plan
            user.is_premium = plan in ["pro", "enterprise"]
            user.subscription_expires = datetime.utcnow() + timedelta(days=30)
            user.stripe_subscription_id = subscription.id
            self.db.commit()
            
            return {
                "success": True,
                "subscription_id": subscription.id,
                "client_secret": subscription.latest_invoice.payment_intent.client_secret,
                "plan": plan,
                "status": subscription.status
            }
        
        except stripe.error.StripeError as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def cancel_subscription(self, user: User) -> Dict[str, Any]:
        """Cancel user's subscription"""
        
        if not hasattr(user, 'stripe_subscription_id') or not user.stripe_subscription_id:
            return {"success": False, "error": "No active subscription"}
        
        try:
            # Cancel at period end to allow access until billing cycle ends
            subscription = stripe.Subscription.modify(
                user.stripe_subscription_id,
                cancel_at_period_end=True
            )
            
            return {
                "success": True,
                "subscription_id": subscription.id,
                "cancel_at": subscription.cancel_at,
                "message": "Subscription will cancel at the end of the billing period"
            }
        
        except stripe.error.StripeError as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def reactivate_subscription(self, user: User) -> Dict[str, Any]:
        """Reactivate a cancelled subscription"""
        
        if not hasattr(user, 'stripe_subscription_id') or not user.stripe_subscription_id:
            return {"success": False, "error": "No subscription to reactivate"}
        
        try:
            subscription = stripe.Subscription.modify(
                user.stripe_subscription_id,
                cancel_at_period_end=False
            )
            
            return {
                "success": True,
                "subscription_id": subscription.id,
                "status": subscription.status,
                "message": "Subscription reactivated"
            }
        
        except stripe.error.StripeError as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def update_payment_method(
        self,
        user: User,
        payment_method_id: str
    ) -> Dict[str, Any]:
        """Update the default payment method for a user"""
        
        if not hasattr(user, 'stripe_customer_id') or not user.stripe_customer_id:
            return {"success": False, "error": "No customer record"}
        
        try:
            # Attach new payment method
            stripe.PaymentMethod.attach(
                payment_method_id,
                customer=user.stripe_customer_id
            )
            
            # Set as default
            stripe.Customer.modify(
                user.stripe_customer_id,
                invoice_settings={
                    "default_payment_method": payment_method_id
                }
            )
            
            return {
                "success": True,
                "payment_method_id": payment_method_id,
                "message": "Payment method updated"
            }
        
        except stripe.error.StripeError as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_billing_history(self, user: User) -> Dict[str, Any]:
        """Get billing history for a user"""
        
        if not hasattr(user, 'stripe_customer_id') or not user.stripe_customer_id:
            return {"success": False, "error": "No customer record"}
        
        try:
            # Get invoices
            invoices = stripe.Invoice.list(
                customer=user.stripe_customer_id,
                limit=50
            )
            
            # Get payment methods
            payment_methods = stripe.PaymentMethod.list(
                customer=user.stripe_customer_id,
                type="card"
            )
            
            return {
                "success": True,
                "invoices": [
                    {
                        "id": invoice.id,
                        "amount": invoice.amount_paid / 100,  # Convert from cents
                        "currency": invoice.currency,
                        "status": invoice.status,
                        "date": datetime.fromtimestamp(invoice.created).isoformat(),
                        "invoice_url": invoice.hosted_invoice_url,
                        "pdf_url": invoice.invoice_pdf
                    }
                    for invoice in invoices.data
                ],
                "payment_methods": [
                    {
                        "id": pm.id,
                        "type": pm.type,
                        "card": {
                            "brand": pm.card.brand,
                            "last4": pm.card.last4,
                            "exp_month": pm.card.exp_month,
                            "exp_year": pm.card.exp_year
                        } if pm.card else None
                    }
                    for pm in payment_methods.data
                ]
            }
        
        except stripe.error.StripeError as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def handle_webhook(self, payload: str, sig_header: str) -> Dict[str, Any]:
        """Handle Stripe webhook events"""
        
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError:
            return {"success": False, "error": "Invalid payload"}
        except stripe.error.SignatureVerificationError:
            return {"success": False, "error": "Invalid signature"}
        
        # Handle the event
        if event["type"] == "customer.subscription.updated":
            await self._handle_subscription_updated(event["data"]["object"])
        elif event["type"] == "customer.subscription.deleted":
            await self._handle_subscription_deleted(event["data"]["object"])
        elif event["type"] == "invoice.payment_succeeded":
            await self._handle_payment_succeeded(event["data"]["object"])
        elif event["type"] == "invoice.payment_failed":
            await self._handle_payment_failed(event["data"]["object"])
        
        return {"success": True, "event_type": event["type"]}
    
    async def _handle_subscription_updated(self, subscription: Dict[str, Any]):
        """Handle subscription update webhook"""
        
        user_id = subscription["metadata"].get("user_id")
        if not user_id:
            return
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        
        # Update user subscription status
        if subscription["status"] == "active":
            plan = subscription["metadata"].get("plan", "pro")
            user.subscription_tier = plan
            user.is_premium = plan in ["pro", "enterprise"]
            user.subscription_expires = datetime.fromtimestamp(
                subscription["current_period_end"]
            )
        elif subscription["status"] in ["canceled", "unpaid"]:
            user.subscription_tier = "free"
            user.is_premium = False
            user.subscription_expires = None
        
        self.db.commit()
    
    async def _handle_subscription_deleted(self, subscription: Dict[str, Any]):
        """Handle subscription deletion webhook"""
        
        user_id = subscription["metadata"].get("user_id")
        if not user_id:
            return
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        
        # Downgrade to free plan
        user.subscription_tier = "free"
        user.is_premium = False
        user.subscription_expires = None
        user.stripe_subscription_id = None
        
        self.db.commit()
    
    async def _handle_payment_succeeded(self, invoice: Dict[str, Any]):
        """Handle successful payment webhook"""
        
        customer_id = invoice["customer"]
        user = self.db.query(User).filter(User.stripe_customer_id == customer_id).first()
        
        if user:
            # Update subscription expiry
            if invoice.get("subscription"):
                subscription = stripe.Subscription.retrieve(invoice["subscription"])
                user.subscription_expires = datetime.fromtimestamp(
                    subscription["current_period_end"]
                )
                self.db.commit()
    
    async def _handle_payment_failed(self, invoice: Dict[str, Any]):
        """Handle failed payment webhook"""
        
        customer_id = invoice["customer"]
        user = self.db.query(User).filter(User.stripe_customer_id == customer_id).first()
        
        if user:
            # Send notification about failed payment
            # This would integrate with email service
            pass
    
    async def get_usage_stats(self, user: User) -> Dict[str, Any]:
        """Get usage statistics for the user's current plan"""
        
        plan = self.plans.get(user.subscription_tier, self.plans["free"])
        
        # Get current usage (this would query actual usage from database)
        current_usage = {
            "apps": self.db.query(App).filter(App.owner_id == user.id).count(),
            "storage_used_gb": 0.5,  # Mock data
            "bandwidth_used_gb": 2.3,  # Mock data
            "ai_requests_used": 25,  # Mock data
            "api_calls_used": 450  # Mock data
        }
        
        return {
            "plan": {
                "name": plan["name"],
                "tier": user.subscription_tier,
                "price": plan["price"],
                "features": plan["features"]
            },
            "usage": current_usage,
            "limits": plan["features"],
            "usage_percentage": {
                "apps": (current_usage["apps"] / plan["features"]["apps"] * 100) 
                       if isinstance(plan["features"]["apps"], int) else 0,
                "storage": (current_usage["storage_used_gb"] / plan["features"]["storage_gb"] * 100),
                "bandwidth": (current_usage["bandwidth_used_gb"] / plan["features"]["bandwidth_gb"] * 100),
                "ai_requests": (current_usage["ai_requests_used"] / plan["features"]["ai_requests_per_month"] * 100)
            }
        }
    
    async def check_feature_access(self, user: User, feature: str) -> bool:
        """Check if user has access to a specific feature"""
        
        plan = self.plans.get(user.subscription_tier, self.plans["free"])
        features = plan["features"]
        
        # Check specific features
        if feature == "custom_domain":
            return features.get("custom_domain", False)
        elif feature == "advanced_widgets":
            return features.get("advanced_widgets", False)
        elif feature == "white_label":
            return features.get("white_label", False)
        elif feature == "sso":
            return features.get("sso", False)
        
        return False
    
    async def get_available_plans(self) -> Dict[str, Any]:
        """Get all available subscription plans"""
        
        return {
            "plans": self.plans,
            "currency": "USD",
            "billing_cycle": "monthly"
        }