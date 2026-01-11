"""
Billing domain models
"""

from sqlalchemy import Column, String, Boolean, Text, Integer, ForeignKey, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from src.common.base_model import BaseModel


class Subscription(BaseModel):
    """Subscription model for V2"""
    __tablename__ = "subscriptions"
    
    plan_id = Column(String(100), nullable=False)
    plan_name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)  # active, canceled, past_due, etc.
    
    # Pricing
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    billing_cycle = Column(String(20), nullable=False)  # monthly, yearly
    
    # Dates
    current_period_start = Column(String(50), nullable=False)
    current_period_end = Column(String(50), nullable=False)
    trial_end = Column(String(50), nullable=True)
    canceled_at = Column(String(50), nullable=True)
    
    # Stripe integration
    stripe_subscription_id = Column(String(255), nullable=True)
    stripe_customer_id = Column(String(255), nullable=True)
    
    # User
    user_id = Column(UUID(as_uuid=True), nullable=False)  # Reference to V1 users table
    
    # Relationships
    invoices = relationship("Invoice", back_populates="subscription", cascade="all, delete-orphan")
    usage_records = relationship("UsageRecord", back_populates="subscription", cascade="all, delete-orphan")


class Invoice(BaseModel):
    """Invoice model for V2"""
    __tablename__ = "invoices"
    
    invoice_number = Column(String(100), nullable=False, unique=True)
    status = Column(String(50), nullable=False)  # draft, open, paid, void, uncollectible
    
    # Amounts
    subtotal = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0)
    total_amount = Column(Numeric(10, 2), nullable=False)
    amount_paid = Column(Numeric(10, 2), default=0)
    amount_due = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD")
    
    # Dates
    invoice_date = Column(String(50), nullable=False)
    due_date = Column(String(50), nullable=False)
    paid_at = Column(String(50), nullable=True)
    
    # Stripe integration
    stripe_invoice_id = Column(String(255), nullable=True)
    stripe_payment_intent_id = Column(String(255), nullable=True)
    
    # Relationships
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=False)
    subscription = relationship("Subscription", back_populates="invoices")
    line_items = relationship("InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceLineItem(BaseModel):
    """Invoice line item model for V2"""
    __tablename__ = "invoice_line_items"
    
    description = Column(String(500), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    
    # Relationships
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    invoice = relationship("Invoice", back_populates="line_items")


class PaymentMethod(BaseModel):
    """Payment method model for V2"""
    __tablename__ = "payment_methods"
    
    payment_type = Column(String(50), nullable=False)  # card, bank_account, etc.
    is_default = Column(Boolean, default=False)
    
    # Card details (encrypted/tokenized)
    card_brand = Column(String(50), nullable=True)
    card_last4 = Column(String(4), nullable=True)
    card_exp_month = Column(Integer, nullable=True)
    card_exp_year = Column(Integer, nullable=True)
    
    # Stripe integration
    stripe_payment_method_id = Column(String(255), nullable=True)
    stripe_customer_id = Column(String(255), nullable=True)
    
    # User
    user_id = Column(UUID(as_uuid=True), nullable=False)


class UsageRecord(BaseModel):
    """Usage tracking model for V2"""
    __tablename__ = "usage_records"
    
    metric_name = Column(String(100), nullable=False)  # api_calls, storage_gb, etc.
    quantity = Column(Integer, nullable=False)
    timestamp = Column(String(50), nullable=False)
    
    # Metadata
    record_metadata = Column(JSONB, default={})
    
    # Relationships
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=False)
    subscription = relationship("Subscription", back_populates="usage_records")


class BillingAddress(BaseModel):
    """Billing address model for V2"""
    __tablename__ = "billing_addresses"
    
    line1 = Column(String(255), nullable=False)
    line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(2), nullable=False)  # ISO country code
    
    # User
    user_id = Column(UUID(as_uuid=True), nullable=False)


class TaxRate(BaseModel):
    """Tax rate model for V2"""
    __tablename__ = "tax_rates"
    
    display_name = Column(String(100), nullable=False)
    percentage = Column(Numeric(5, 4), nullable=False)  # e.g., 0.0825 for 8.25%
    jurisdiction = Column(String(100), nullable=False)
    
    # Geographic scope
    country = Column(String(2), nullable=True)
    state = Column(String(100), nullable=True)
    
    # Stripe integration
    stripe_tax_rate_id = Column(String(255), nullable=True)
    
    is_active = Column(Boolean, default=True)
