"""
Payment API Routes
Subscription management, billing, and payment processing
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import stripe

from core.database import get_db, User
from core.auth import get_current_user, get_current_active_user
from services.payment_service import PaymentService

router = APIRouter()

# Pydantic models
class CreateSubscriptionRequest(BaseModel):
    plan: str = Field(..., description="Subscription plan: pro, enterprise")
    payment_method_id: str = Field(..., description="Stripe payment method ID")

class UpdatePaymentMethodRequest(BaseModel):
    payment_method_id: str = Field(..., description="New Stripe payment method ID")

class PlanResponse(BaseModel):
    name: str
    price: int
    features: Dict[str, Any]
    stripe_price_id: Optional[str] = None

class SubscriptionResponse(BaseModel):
    success: bool
    subscription_id: Optional[str] = None
    client_secret: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None
    error: Optional[str] = None

class UsageStatsResponse(BaseModel):
    plan: Dict[str, Any]
    usage: Dict[str, Any]
    limits: Dict[str, Any]
    usage_percentage: Dict[str, float]

class BillingHistoryResponse(BaseModel):
    success: bool
    invoices: list[Dict[str, Any]]
    payment_methods: list[Dict[str, Any]]
    error: Optional[str] = None


@router.get("/plans")
async def get_plans():
    """
    Get available subscription plans
    
    Returns all available subscription plans with features and pricing.
    """
    
    payment_service = PaymentService(None)  # No DB needed for static data
    plans = await payment_service.get_available_plans()
    
    return plans


@router.post("/create-subscription", response_model=SubscriptionResponse)
async def create_subscription(
    request: CreateSubscriptionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new subscription
    
    Creates a subscription for the specified plan and payment method.
    Returns client secret for payment confirmation if required.
    """
    
    payment_service = PaymentService(db)
    
    result = await payment_service.create_subscription(
        user=current_user,
        plan=request.plan,
        payment_method_id=request.payment_method_id
    )
    
    return SubscriptionResponse(**result)


@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Cancel current subscription
    
    Cancels the user's subscription at the end of the current billing period.
    """
    
    payment_service = PaymentService(db)
    result = await payment_service.cancel_subscription(current_user)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/reactivate-subscription")
async def reactivate_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Reactivate cancelled subscription
    
    Reactivates a subscription that was set to cancel at period end.
    """
    
    payment_service = PaymentService(db)
    result = await payment_service.reactivate_subscription(current_user)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/update-payment-method")
async def update_payment_method(
    request: UpdatePaymentMethodRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update default payment method
    
    Updates the default payment method for the user's subscription.
    """
    
    payment_service = PaymentService(db)
    result = await payment_service.update_payment_method(
        user=current_user,
        payment_method_id=request.payment_method_id
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/billing-history", response_model=BillingHistoryResponse)
async def get_billing_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get billing history
    
    Returns invoices and payment methods for the current user.
    """
    
    payment_service = PaymentService(db)
    result = await payment_service.get_billing_history(current_user)
    
    return BillingHistoryResponse(**result)


@router.get("/usage", response_model=UsageStatsResponse)
async def get_usage_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get usage statistics
    
    Returns current usage statistics compared to plan limits.
    """
    
    payment_service = PaymentService(db)
    stats = await payment_service.get_usage_stats(current_user)
    
    return UsageStatsResponse(**stats)


@router.get("/subscription-status")
async def get_subscription_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current subscription status
    
    Returns detailed information about the user's current subscription.
    """
    
    payment_service = PaymentService(db)
    
    # Get current subscription from Stripe if exists
    subscription_info = {
        "tier": current_user.subscription_tier,
        "is_premium": current_user.is_premium,
        "expires_at": current_user.subscription_expires.isoformat() if current_user.subscription_expires else None,
        "status": "active" if current_user.is_premium else "free"
    }
    
    if hasattr(current_user, 'stripe_subscription_id') and current_user.stripe_subscription_id:
        try:
            stripe_subscription = stripe.Subscription.retrieve(current_user.stripe_subscription_id)
            subscription_info.update({
                "stripe_status": stripe_subscription.status,
                "current_period_end": stripe_subscription.current_period_end,
                "cancel_at_period_end": stripe_subscription.cancel_at_period_end,
                "canceled_at": stripe_subscription.canceled_at
            })
        except stripe.error.StripeError:
            pass
    
    return subscription_info


@router.post("/create-setup-intent")
async def create_setup_intent(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create setup intent for payment method
    
    Creates a Stripe setup intent for securely collecting payment method details.
    """
    
    payment_service = PaymentService(db)
    
    # Ensure customer exists
    if not hasattr(current_user, 'stripe_customer_id') or not current_user.stripe_customer_id:
        customer_result = await payment_service.create_customer(current_user)
        if not customer_result["success"]:
            raise HTTPException(status_code=400, detail=customer_result["error"])
    
    try:
        setup_intent = stripe.SetupIntent.create(
            customer=current_user.stripe_customer_id,
            payment_method_types=["card"],
            usage="off_session"
        )
        
        return {
            "client_secret": setup_intent.client_secret,
            "setup_intent_id": setup_intent.id
        }
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db)
):
    """
    Handle Stripe webhooks
    
    Processes Stripe webhook events for subscription updates, payments, etc.
    """
    
    payload = await request.body()
    
    payment_service = PaymentService(db)
    result = await payment_service.handle_webhook(
        payload=payload.decode('utf-8'),
        sig_header=stripe_signature
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {"received": True}


@router.get("/feature-access/{feature}")
async def check_feature_access(
    feature: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Check access to specific feature
    
    Returns whether the user has access to the specified feature based on their plan.
    """
    
    payment_service = PaymentService(db)
    has_access = await payment_service.check_feature_access(current_user, feature)
    
    return {
        "feature": feature,
        "has_access": has_access,
        "current_plan": current_user.subscription_tier,
        "is_premium": current_user.is_premium
    }


@router.get("/pricing-calculator")
async def pricing_calculator(
    apps: int = 1,
    storage_gb: int = 1,
    bandwidth_gb: int = 10,
    ai_requests: int = 50
):
    """
    Calculate pricing based on usage requirements
    
    Returns recommended plan based on usage requirements.
    """
    
    payment_service = PaymentService(None)
    plans = await payment_service.get_available_plans()
    
    recommendations = []
    
    for plan_id, plan in plans["plans"].items():
        features = plan["features"]
        
        # Check if plan meets requirements
        meets_requirements = True
        reasons = []
        
        if isinstance(features.get("apps"), int) and apps > features["apps"]:
            meets_requirements = False
            reasons.append(f"Needs {apps} apps, plan allows {features['apps']}")
        
        if storage_gb > features["storage_gb"]:
            meets_requirements = False
            reasons.append(f"Needs {storage_gb}GB storage, plan allows {features['storage_gb']}GB")
        
        if bandwidth_gb > features["bandwidth_gb"]:
            meets_requirements = False
            reasons.append(f"Needs {bandwidth_gb}GB bandwidth, plan allows {features['bandwidth_gb']}GB")
        
        if ai_requests > features["ai_requests_per_month"]:
            meets_requirements = False
            reasons.append(f"Needs {ai_requests} AI requests, plan allows {features['ai_requests_per_month']}")
        
        recommendations.append({
            "plan": plan_id,
            "name": plan["name"],
            "price": plan["price"],
            "meets_requirements": meets_requirements,
            "reasons": reasons if not meets_requirements else ["Meets all requirements"]
        })
    
    # Sort by price, with suitable plans first
    recommendations.sort(key=lambda x: (not x["meets_requirements"], x["price"]))
    
    return {
        "requirements": {
            "apps": apps,
            "storage_gb": storage_gb,
            "bandwidth_gb": bandwidth_gb,
            "ai_requests": ai_requests
        },
        "recommendations": recommendations,
        "suggested_plan": recommendations[0]["plan"] if recommendations else "free"
    }