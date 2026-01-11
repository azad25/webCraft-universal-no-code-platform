"""E-commerce domain schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class ProductStatus(str, Enum):
    ACTIVE = "active"
    DRAFT = "draft"
    ARCHIVED = "archived"


class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    compare_price: Optional[float] = None
    sku: str
    inventory: int = 0
    category: str = ""
    status: ProductStatus = ProductStatus.DRAFT
    images: List[str] = []
    track_inventory: bool = True
    weight: Optional[float] = None
    tags: List[str] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    compare_price: Optional[float] = None
    sku: Optional[str] = None
    inventory: Optional[int] = None
    category: Optional[str] = None
    status: Optional[ProductStatus] = None
    images: Optional[List[str]] = None
    track_inventory: Optional[bool] = None
    weight: Optional[float] = None
    tags: Optional[List[str]] = None


class ProductVariantCreate(BaseModel):
    name: str
    sku: str
    price: float
    inventory: int = 0
    options: Dict[str, str] = {}


class CategoryCreate(BaseModel):
    name: str
    description: str = ""
    parent_id: Optional[str] = None


class ProductResponse(BaseModel):
    id: str
    app_id: str
    name: str
    slug: str
    description: str
    price: float
    compare_price: Optional[float]
    sku: str
    inventory: int
    category: str
    status: str
    images: List[str]
    track_inventory: bool
    weight: Optional[float]
    tags: List[str]
    variants: List[Dict[str, Any]]
    created_at: str
    updated_at: str


class CategoryResponse(BaseModel):
    id: str
    app_id: str
    name: str
    slug: str
    description: str
    parent_id: Optional[str]
    product_count: int
    created_at: str


class OrderResponse(BaseModel):
    id: str
    app_id: str
    customer_email: str
    items: List[Dict[str, Any]]
    subtotal: float
    tax: float
    shipping: float
    total: float
    status: str
    shipping_address: Dict[str, Any]
    created_at: str
    updated_at: str


class EcommerceStats(BaseModel):
    total_products: int
    active_products: int
    total_orders: int
    pending_orders: int
    total_revenue: float
    total_customers: int
    average_order_value: float
