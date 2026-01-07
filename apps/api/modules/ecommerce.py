"""
E-commerce Module - Full e-commerce functionality
"""

from typing import Dict, List, Any
from core.module_system import BaseModule, ModuleMetadata, ModuleType
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import uuid


class Product(BaseModel):
    id: str = None
    name: str
    description: str = ""
    price: float
    compare_price: float = None
    sku: str = ""
    inventory: int = 0
    images: List[str] = []
    categories: List[str] = []
    variants: List[Dict] = []
    metadata: Dict = {}


class Order(BaseModel):
    id: str = None
    customer_id: str
    items: List[Dict]
    subtotal: float
    tax: float = 0
    shipping: float = 0
    total: float
    status: str = "pending"
    shipping_address: Dict = {}
    billing_address: Dict = {}


class EcommerceModule(BaseModule):
    """Complete e-commerce solution"""
    
    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            id="core.ecommerce",
            name="E-commerce Suite",
            version="1.0.0",
            type=ModuleType.ECOMMERCE,
            description="Full e-commerce with products, orders, inventory",
            author="WebCraft",
            dependencies=[],
            is_premium=True,
            price=29.99,
            tags=["shop", "products", "orders", "inventory"]
        )
    
    async def initialize(self) -> bool:
        self._products: Dict[str, Product] = {}
        self._orders: Dict[str, Order] = {}
        self._carts: Dict[str, List[Dict]] = {}
        self._initialized = True
        return True
    
    async def shutdown(self) -> bool:
        self._initialized = False
        return True
    
    async def create_product(self, product: Product) -> Product:
        product.id = str(uuid.uuid4())
        self._products[product.id] = product
        await self.trigger_hook("product.created", product)
        return product
    
    async def get_products(self, filters: Dict = None) -> List[Product]:
        products = list(self._products.values())
        if filters:
            if "category" in filters:
                products = [p for p in products if filters["category"] in p.categories]
        return products
    
    async def create_order(self, order: Order) -> Order:
        order.id = str(uuid.uuid4())
        self._orders[order.id] = order
        await self.trigger_hook("order.created", order)
        return order
    
    async def update_order_status(self, order_id: str, status: str) -> Order:
        if order_id in self._orders:
            self._orders[order_id].status = status
            await self.trigger_hook("order.updated", self._orders[order_id])
        return self._orders.get(order_id)
    
    async def add_to_cart(self, cart_id: str, product_id: str, quantity: int):
        if cart_id not in self._carts:
            self._carts[cart_id] = []
        self._carts[cart_id].append({"product_id": product_id, "quantity": quantity})
        return self._carts[cart_id]
    
    def get_routes(self) -> List[APIRouter]:
        router = APIRouter(prefix="/ecommerce", tags=["E-commerce"])
        
        @router.get("/products")
        async def list_products(category: str = None):
            filters = {"category": category} if category else None
            return {"products": await self.get_products(filters)}
        
        @router.post("/products")
        async def create_product(product: Product):
            return await self.create_product(product)
        
        @router.post("/orders")
        async def create_order(order: Order):
            return await self.create_order(order)
        
        @router.post("/cart/{cart_id}/add")
        async def add_to_cart(cart_id: str, product_id: str, quantity: int = 1):
            return await self.add_to_cart(cart_id, product_id, quantity)
        
        return [router]
    
    def get_frontend_components(self) -> Dict[str, Any]:
        return {
            "ProductCard": {"props": ["product", "onAddToCart"]},
            "ProductGrid": {"props": ["products", "columns"]},
            "Cart": {"props": ["items", "onCheckout"]},
            "Checkout": {"props": ["cart", "onComplete"]},
            "OrderHistory": {"props": ["orders"]}
        }
