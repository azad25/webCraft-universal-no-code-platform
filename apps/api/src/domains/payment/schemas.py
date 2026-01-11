"""Payment domain schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


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
    invoices: List[Dict[str, Any]]
    payment_methods: List[Dict[str, Any]]
    error: Optional[str] = None


class SubscriptionStatus(BaseModel):
    tier: str
    is_premium: bool
    expires_at: Optional[str]
    status: str
    stripe_status: Optional[str] = None
    current_period_end: Optional[int] = None
    cancel_at_period_end: Optional[bool] = None


class SetupIntentResponse(BaseModel):
    client_secret: str
    setup_intent_id: str


class FeatureAccessResponse(BaseModel):
    feature: str
    has_access: bool
    current_plan: str
    is_premium: bool


class PricingRecommendation(BaseModel):
    plan: str
    name: str
    price: int
    meets_requirements: bool
    reasons: List[str]
