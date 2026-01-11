"""
Billing API routes - V2
Complete billing and subscription management
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.auth.models import User
from .service import BillingService
from .schemas import (
    SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse,
    PaymentMethodCreate, PaymentMethodResponse,
    BillingAddressCreate, BillingAddressResponse,
    UsageRecordCreate, UsageRecordResponse,
    InvoiceResponse, InvoiceListResponse,
    BillingOverviewResponse, UsageStatsResponse
)

router = APIRouter()


@router.get("/overview", response_model=BillingOverviewResponse)
async def get_billing_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get billing overview"""
    service = BillingService(db)
    overview = service.get_billing_overview(current_user.id)
    return overview


@router.get("/subscription", response_model=Optional[SubscriptionResponse])
async def get_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current subscription"""
    service = BillingService(db)
    subscription = service.get_subscription(current_user.id)
    return subscription


@router.post("/subscription", response_model=SubscriptionResponse)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new subscription"""
    service = BillingService(db)
    
    try:
        subscription = service.create_subscription(current_user.id, subscription_data)
        return subscription
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/subscription", response_model=SubscriptionResponse)
async def update_subscription(
    subscription_data: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update subscription"""
    service = BillingService(db)
    
    try:
        subscription = service.update_subscription(current_user.id, subscription_data)
        return subscription
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/subscription/cancel")
async def cancel_subscription(
    immediate: bool = Query(False, description="Cancel immediately or at period end"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel subscription"""
    service = BillingService(db)
    
    try:
        subscription = service.cancel_subscription(current_user.id, immediate)
        return {
            "message": "Subscription canceled successfully",
            "status": subscription.status,
            "canceled_at": subscription.canceled_at
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/invoices", response_model=InvoiceListResponse)
async def list_invoices(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List invoices"""
    service = BillingService(db)
    invoices, total = service.list_invoices(current_user.id, page, per_page)
    
    return InvoiceListResponse(
        items=invoices,
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific invoice"""
    service = BillingService(db)
    
    try:
        invoice = service.get_invoice(current_user.id, invoice_id)
        return invoice
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/invoices/upcoming")
async def get_upcoming_invoice(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get upcoming invoice preview"""
    service = BillingService(db)
    upcoming = service.get_upcoming_invoice(current_user.id)
    
    if not upcoming:
        raise HTTPException(status_code=404, detail="No upcoming invoice found")
    
    return upcoming


@router.get("/payment-methods", response_model=List[PaymentMethodResponse])
async def list_payment_methods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List payment methods"""
    service = BillingService(db)
    payment_methods = service.list_payment_methods(current_user.id)
    return payment_methods


@router.post("/payment-methods", response_model=PaymentMethodResponse)
async def add_payment_method(
    payment_method_data: PaymentMethodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add payment method"""
    service = BillingService(db)
    
    try:
        payment_method = service.add_payment_method(current_user.id, payment_method_data)
        return payment_method
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/payment-methods/{payment_method_id}")
async def delete_payment_method(
    payment_method_id: uuid.UUID = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete payment method"""
    service = BillingService(db)
    
    try:
        service.delete_payment_method(current_user.id, payment_method_id)
        return {"message": "Payment method deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/billing-address", response_model=Optional[BillingAddressResponse])
async def get_billing_address(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get billing address"""
    service = BillingService(db)
    address = service.get_billing_address(current_user.id)
    return address


@router.put("/billing-address", response_model=BillingAddressResponse)
async def update_billing_address(
    address_data: BillingAddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update billing address"""
    service = BillingService(db)
    address = service.update_billing_address(current_user.id, address_data)
    return address


@router.post("/usage", response_model=UsageRecordResponse)
async def record_usage(
    usage_data: UsageRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record usage"""
    service = BillingService(db)
    
    try:
        usage_record = service.record_usage(current_user.id, usage_data)
        return usage_record
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/usage/stats", response_model=UsageStatsResponse)
async def get_usage_stats(
    period_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get usage statistics"""
    service = BillingService(db)
    stats = service.get_usage_stats(current_user.id, period_days)
    return stats