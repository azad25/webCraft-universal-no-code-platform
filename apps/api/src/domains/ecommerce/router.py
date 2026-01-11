"""E-commerce domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.apps.models import App
from src.domains.auth.schemas import UserResponse
from .service import EcommerceService
from .schemas import ProductCreate, ProductUpdate, CategoryCreate, OrderStatus

router = APIRouter()


async def get_app_or_404(app_id: uuid.UUID, user_id: str, db: Session) -> App:
    app = db.query(App).filter(App.id == app_id, App.owner_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


@router.get("/apps/{app_id}/ecommerce/stats")
async def get_ecommerce_stats(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get e-commerce statistics"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = EcommerceService(db)
    return await service.get_stats(str(app_id))


@router.post("/apps/{app_id}/ecommerce/products")
async def create_product(
    app_id: uuid.UUID = Path(...),
    product: ProductCreate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new product"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = EcommerceService(db)
    return await service.create_product(str(app_id), product.dict())


@router.get("/apps/{app_id}/ecommerce/products")
async def list_products(
    app_id: uuid.UUID = Path(...),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List products"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = EcommerceService(db)
    return await service.list_products(str(app_id), status, category, search, limit, offset)


@router.get("/apps/{app_id}/ecommerce/products/{product_id}")
async def get_product(
    app_id: uuid.UUID = Path(...),
    product_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get product details"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = EcommerceService(db)
    product = await service.get_product(str(app_id), product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/apps/{app_id}/ecommerce/products/{product_id}")
async def update_product(
    app_id: uuid.UUID = Path(...),
    product_id: str = Path(...),
    product: ProductUpdate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a product"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = EcommerceService(db)
    updated = await service.update_product(str(app_id), product_id, product.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated


@router.delete("/apps/{app_id}/ecommerce/products/{product_id}")
async def delete_product(
    app_id: uuid.UUID = Path(...),
    product_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a product"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = EcommerceService(db)
    if not await service.delete_product(str(app_id), product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    return {"deleted": True}


@router.post("/apps/{app_id}/ecommerce/categories")
async def create_category(
    app_id: uuid.UUID = Path(...),
    category: CategoryCreate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a category"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = EcommerceService(db)
    return await service.create_category(str(app_id), category.dict())


@router.get("/apps/{app_id}/ecommerce/categories")
async def list_categories(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List categories"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = EcommerceService(db)
    return await service.list_categories(str(app_id))


@router.get("/apps/{app_id}/ecommerce/orders")
async def list_orders(
    app_id: uuid.UUID = Path(...),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List orders"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = EcommerceService(db)
    return await service.list_orders(str(app_id), status, limit)


@router.get("/apps/{app_id}/ecommerce/orders/{order_id}")
async def get_order(
    app_id: uuid.UUID = Path(...),
    order_id: str = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get order details"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = EcommerceService(db)
    order = await service.get_order(str(app_id), order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/apps/{app_id}/ecommerce/orders/{order_id}/status")
async def update_order_status(
    app_id: uuid.UUID = Path(...),
    order_id: str = Path(...),
    status: OrderStatus = Query(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update order status"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = EcommerceService(db)
    order = await service.update_order_status(str(app_id), order_id, status.value)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/apps/{app_id}/ecommerce/products/{product_id}/inventory")
async def update_inventory(
    app_id: uuid.UUID = Path(...),
    product_id: str = Path(...),
    quantity: int = Query(...),
    adjustment_type: str = Query("set"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update product inventory"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = EcommerceService(db)
    result = await service.update_inventory(str(app_id), product_id, quantity, adjustment_type)
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return result


@router.get("/storefront/{app_id}/products")
async def storefront_products(
    app_id: uuid.UUID = Path(...),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db)
):
    """Public endpoint for storefront products"""
    service = EcommerceService(db)
    return await service.get_storefront_products(str(app_id), category, search, limit)
