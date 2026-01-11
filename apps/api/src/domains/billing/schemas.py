"""
Billing domain schemas
"""

from pydantic import Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid
from decimal import Decimal

from src.common.base_schema import BaseSchema, PaginatedResponse


# Request schemas
class SubscriptionCreate(BaseSchema):
    plan_id: str = Field(..., description="Plan identifier")
    payment_method_id: Optional[str] = None
    trial_days: Optional[int] = None


class SubscriptionUpdate(BaseSchema):
    plan_id: Optional[str] = None
    payment_method_id: Optional[str] = None


class PaymentMethodCreate(BaseSchema):
    payment_type: str = Field(..., description="Payment method type")
    stripe_payment_method_id: Optional[str] = None
    is_default: bool = False


class BillingAddressCreate(BaseSchema):
    line1: str = Field(..., min_length=1, max_length=255)
    line2: Optional[str] = None
    city: str = Field(..., min_length=1, max_length=100)
    state: Optional[str] = None
    postal_code: str = Field(..., min_length=1, max_length=20)
    country: str = Field(..., min_length=2, max_length=2)


class UsageRecordCreate(BaseSchema):
    metric_name: str = Field(..., description="Usage metric name")
    quantity: int = Field(..., ge=0)
    timestamp: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# Response schemas
class SubscriptionResponse(BaseSchema):
    id: uuid.UUID
    plan_id: str
    plan_name: str
    status: str
    amount: Decimal
    currency: str
    billing_cycle: str
    current_period_start: str
    current_period_end: str
    trial_end: Optional[str] = None
    canceled_at: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class InvoiceResponse(BaseSchema):
    id: uuid.UUID
    invoice_number: str
    status: str
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    amount_paid: Decimal
    amount_due: Decimal
    currency: str
    invoice_date: str
    due_date: str
    paid_at: Optional[str] = None
    created_at: Optional[datetime] = None


class InvoiceLineItemResponse(BaseSchema):
    id: uuid.UUID
    description: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class PaymentMethodResponse(BaseSchema):
    id: uuid.UUID
    payment_type: str
    is_default: bool
    card_brand: Optional[str] = None
    card_last4: Optional[str] = None
    card_exp_month: Optional[int] = None
    card_exp_year: Optional[int] = None
    created_at: Optional[datetime] = None


class BillingAddressResponse(BaseSchema):
    id: uuid.UUID
    line1: str
    line2: Optional[str] = None
    city: str
    state: Optional[str] = None
    postal_code: str
    country: str
    created_at: Optional[datetime] = None


class UsageRecordResponse(BaseSchema):
    id: uuid.UUID
    metric_name: str
    quantity: int
    timestamp: str
    metadata: Dict[str, Any]
    created_at: Optional[datetime] = None


class BillingOverviewResponse(BaseSchema):
    subscription: Optional[SubscriptionResponse] = None
    current_usage: Dict[str, int]
    next_invoice: Optional[InvoiceResponse] = None
    payment_method: Optional[PaymentMethodResponse] = None
    billing_address: Optional[BillingAddressResponse] = None


class InvoiceListResponse(PaginatedResponse[InvoiceResponse]):
    """Paginated list of invoices"""
    pass


class UsageStatsResponse(BaseSchema):
    period_start: str
    period_end: str
    metrics: Dict[str, Dict[str, Any]]  # metric_name -> {current, limit, percentage}