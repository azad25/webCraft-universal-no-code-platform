"""
E-commerce API Routes
Product management, orders, inventory, and checkout
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
import uuid

from core.database import get_db, App, User
from core.auth import get_current_user

router = APIRouter()


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


# In-memory storage
products_store: Dict[str, Dict] = {}
orders_store: Dict[str, Dict] = {}
categories_store: Dict[str, Dict] = {}
customers_store: Dict[str, Dict] = {}


@router.get("/apps/{app_id}/ecommerce/stats")
async def get_ecommerce_stats(
    app_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get e-commerce statistics"""
    app_products = [p for p in products_store.values() if p.get("app_id") == str(app_id)]
    app_orders = [o for o in orders_store.values() if o.get("app_id") == str(app_id)]
    
    total_revenue = sum(o.get("total", 0) for o in app_orders if o.get("status") != "cancelled")
    
    return {
        "total_products": len(app_products),
        "active_products": len([p for p in app_products if p.get("status") == "active"]),
        "total_orders": len(app_orders),
        "pending_orders": len([o for o in app_orders if o.get("status") == "pending"]),
        "total_revenue": total_revenue,
        "total_customers": len(set(o.get("customer_email") for o in app_orders)),
        "average_order_value": total_revenue / len(app_orders) if app_orders else 0
    }


# Products
@router.post("/apps/{app_id}/ecommerce/products")
async def create_product(
    app_id: uuid.UUID = Path(...),
    product: ProductCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new product"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    product_id = str(uuid.uuid4())
    slug = product.name.lower().replace(" ", "-")
    
    product_data = {
        "id": product_id,
        "app_id": str(app_id),
        "name": product.name,
        "slug": slug,
        "description": product.description,
        "price": product.price,
        "compare_price": product.compare_price,
        "sku": product.sku,
        "inventory": product.inventory,
        "category": product.category,
        "status": product.status.value,
        "images": product.images,
        "track_inventory": product.track_inventory,
        "weight": product.weight,
        "tags": product.tags,
        "variants": [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    products_store[product_id] = product_data
    return product_data


@router.get("/apps/{app_id}/ecommerce/products")
async def list_products(
    app_id: uuid.UUID = Path(...),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List products"""
    products = [p for p in products_store.values() if p.get("app_id") == str(app_id)]
    
    if status:
        products = [p for p in products if p.get("status") == status]
    if category:
        products = [p for p in products if p.get("category") == category]
    if search:
        search_lower = search.lower()
        products = [p for p in products if search_lower in p.get("name", "").lower() or search_lower in p.get("sku", "").lower()]
    
    products.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {
        "products": products[offset:offset + limit],
        "total": len(products)
    }


@router.get("/apps/{app_id}/ecommerce/products/{product_id}")
async def get_product(
    app_id: uuid.UUID = Path(...),
    product_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get product details"""
    product = products_store.get(product_id)
    if not product or product.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/apps/{app_id}/ecommerce/products/{product_id}")
async def update_product(
    app_id: uuid.UUID = Path(...),
    product_id: str = Path(...),
    product: ProductCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a product"""
    existing = products_store.get(product_id)
    if not existing or existing.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing.update({
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "compare_price": product.compare_price,
        "sku": product.sku,
        "inventory": product.inventory,
        "category": product.category,
        "status": product.status.value,
        "images": product.images,
        "track_inventory": product.track_inventory,
        "updated_at": datetime.utcnow().isoformat()
    })
    
    return existing


@router.delete("/apps/{app_id}/ecommerce/products/{product_id}")
async def delete_product(
    app_id: uuid.UUID = Path(...),
    product_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a product"""
    product = products_store.get(product_id)
    if not product or product.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Product not found")
    
    del products_store[product_id]
    return {"deleted": True}


# Categories
@router.post("/apps/{app_id}/ecommerce/categories")
async def create_category(
    app_id: uuid.UUID = Path(...),
    category: CategoryCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a category"""
    category_id = str(uuid.uuid4())
    slug = category.name.lower().replace(" ", "-")
    
    category_data = {
        "id": category_id,
        "app_id": str(app_id),
        "name": category.name,
        "slug": slug,
        "description": category.description,
        "parent_id": category.parent_id,
        "product_count": 0,
        "created_at": datetime.utcnow().isoformat()
    }
    
    categories_store[category_id] = category_data
    return category_data


@router.get("/apps/{app_id}/ecommerce/categories")
async def list_categories(
    app_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List categories"""
    categories = [c for c in categories_store.values() if c.get("app_id") == str(app_id)]
    
    # Count products per category
    for cat in categories:
        cat["product_count"] = len([
            p for p in products_store.values()
            if p.get("app_id") == str(app_id) and p.get("category") == cat["id"]
        ])
    
    return {"categories": categories, "total": len(categories)}


# Orders
@router.get("/apps/{app_id}/ecommerce/orders")
async def list_orders(
    app_id: uuid.UUID = Path(...),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List orders"""
    orders = [o for o in orders_store.values() if o.get("app_id") == str(app_id)]
    
    if status:
        orders = [o for o in orders if o.get("status") == status]
    
    orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {"orders": orders[:limit], "total": len(orders)}


@router.get("/apps/{app_id}/ecommerce/orders/{order_id}")
async def get_order(
    app_id: uuid.UUID = Path(...),
    order_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get order details"""
    order = orders_store.get(order_id)
    if not order or order.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/apps/{app_id}/ecommerce/orders/{order_id}/status")
async def update_order_status(
    app_id: uuid.UUID = Path(...),
    order_id: str = Path(...),
    status: OrderStatus = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update order status"""
    order = orders_store.get(order_id)
    if not order or order.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Order not found")
    
    order["status"] = status.value
    order["updated_at"] = datetime.utcnow().isoformat()
    
    return order


# Inventory
@router.put("/apps/{app_id}/ecommerce/products/{product_id}/inventory")
async def update_inventory(
    app_id: uuid.UUID = Path(...),
    product_id: str = Path(...),
    quantity: int = Query(...),
    adjustment_type: str = Query("set"),  # set, add, subtract
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update product inventory"""
    product = products_store.get(product_id)
    if not product or product.get("app_id") != str(app_id):
        raise HTTPException(status_code=404, detail="Product not found")
    
    if adjustment_type == "set":
        product["inventory"] = quantity
    elif adjustment_type == "add":
        product["inventory"] = product.get("inventory", 0) + quantity
    elif adjustment_type == "subtract":
        product["inventory"] = max(0, product.get("inventory", 0) - quantity)
    
    product["updated_at"] = datetime.utcnow().isoformat()
    
    return {"product_id": product_id, "inventory": product["inventory"]}


# Public storefront endpoints
@router.get("/storefront/{app_id}/products")
async def storefront_products(
    app_id: uuid.UUID = Path(...),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db)
):
    """Public endpoint for storefront products"""
    products = [
        p for p in products_store.values()
        if p.get("app_id") == str(app_id) and p.get("status") == "active"
    ]
    
    if category:
        products = [p for p in products if p.get("category") == category]
    if search:
        search_lower = search.lower()
        products = [p for p in products if search_lower in p.get("name", "").lower()]
    
    # Remove sensitive fields
    public_products = []
    for p in products[:limit]:
        public_products.append({
            "id": p["id"],
            "name": p["name"],
            "slug": p["slug"],
            "description": p["description"],
            "price": p["price"],
            "compare_price": p.get("compare_price"),
            "images": p.get("images", []),
            "in_stock": p.get("inventory", 0) > 0
        })
    
    return {"products": public_products}
