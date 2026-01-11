"""Payment domain router"""
from fastapi import APIRouter, Depends, HTTPException, Request, Header, Query
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.schemas import UserResponse
from .service import PaymentService
from .schemas import CreateSubscriptionRequest, UpdatePaymentMethodRequest

router = APIRouter(prefix="/billing")


@router.get("/plans")
async def get_plans(db: Session = Depends(get_db)):
    """Get available subscription plans"""
    service = PaymentService(db)
    return await service.get_available_plans()


@router.post("/create-subscription")
async def create_subscription(
    request: CreateSubscriptionRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new subscription"""
    service = PaymentService(db)
    result = await service.create_subscription(current_user, request.plan, request.payment_method_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel current subscription"""
    service = PaymentService(db)
    result = await service.cancel_subscription(current_user)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@router.post("/reactivate-subscription")
async def reactivate_subscription(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reactivate cancelled subscription"""
    service = PaymentService(db)
    result = await service.reactivate_subscription(current_user)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@router.post("/update-payment-method")
async def update_payment_method(
    request: UpdatePaymentMethodRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update default payment method"""
    service = PaymentService(db)
    result = await service.update_payment_method(current_user, request.payment_method_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@router.get("/billing-history")
async def get_billing_history(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get billing history"""
    service = PaymentService(db)
    return await service.get_billing_history(current_user)


@router.get("/usage")
async def get_usage_stats(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get usage statistics"""
    service = PaymentService(db)
    return await service.get_usage_stats(current_user)


@router.get("/subscription-status")
async def get_subscription_status(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current subscription status"""
    service = PaymentService(db)
    return await service.get_subscription_status(current_user)


@router.post("/create-setup-intent")
async def create_setup_intent(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create setup intent for payment method"""
    service = PaymentService(db)
    return await service.create_setup_intent(current_user)


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db)
):
    """Handle Stripe webhooks"""
    payload = await request.body()
    service = PaymentService(db)
    result = await service.handle_webhook(payload.decode('utf-8'), stripe_signature)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return {"received": True}


@router.get("/feature-access/{feature}")
async def check_feature_access(
    feature: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check access to specific feature"""
    service = PaymentService(db)
    has_access = await service.check_feature_access(current_user, feature)
    return {
        "feature": feature,
        "has_access": has_access,
        "current_plan": getattr(current_user, 'subscription_tier', 'free'),
        "is_premium": getattr(current_user, 'is_premium', False)
    }


@router.get("/pricing-calculator")
async def pricing_calculator(
    apps: int = Query(1),
    storage_gb: int = Query(1),
    bandwidth_gb: int = Query(10),
    ai_requests: int = Query(50),
    db: Session = Depends(get_db)
):
    """Calculate pricing based on usage requirements"""
    service = PaymentService(db)
    return await service.calculate_pricing(apps, storage_gb, bandwidth_gb, ai_requests)
