"""E-commerce domain service"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
import uuid


# In-memory storage (would be database in production)
products_store: Dict[str, Dict] = {}
orders_store: Dict[str, Dict] = {}
categories_store: Dict[str, Dict] = {}


class EcommerceService:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_stats(self, app_id: str) -> Dict[str, Any]:
        app_products = [p for p in products_store.values() if p.get("app_id") == app_id]
        app_orders = [o for o in orders_store.values() if o.get("app_id") == app_id]
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
    
    async def create_product(self, app_id: str, product_data: Dict[str, Any]) -> Dict[str, Any]:
        product_id = str(uuid.uuid4())
        slug = product_data["name"].lower().replace(" ", "-")
        
        product = {
            "id": product_id,
            "app_id": app_id,
            "slug": slug,
            "variants": [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            **product_data
        }
        products_store[product_id] = product
        return product
    
    async def list_products(
        self, app_id: str, status: Optional[str] = None,
        category: Optional[str] = None, search: Optional[str] = None,
        limit: int = 50, offset: int = 0
    ) -> Dict[str, Any]:
        products = [p for p in products_store.values() if p.get("app_id") == app_id]
        
        if status:
            products = [p for p in products if p.get("status") == status]
        if category:
            products = [p for p in products if p.get("category") == category]
        if search:
            search_lower = search.lower()
            products = [p for p in products if search_lower in p.get("name", "").lower() or search_lower in p.get("sku", "").lower()]
        
        products.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return {"products": products[offset:offset + limit], "total": len(products)}
    
    async def get_product(self, app_id: str, product_id: str) -> Optional[Dict[str, Any]]:
        product = products_store.get(product_id)
        if product and product.get("app_id") == app_id:
            return product
        return None
    
    async def update_product(self, app_id: str, product_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        product = products_store.get(product_id)
        if not product or product.get("app_id") != app_id:
            return None
        
        for key, value in updates.items():
            if value is not None:
                product[key] = value
        product["updated_at"] = datetime.utcnow().isoformat()
        products_store[product_id] = product
        return product
    
    async def delete_product(self, app_id: str, product_id: str) -> bool:
        product = products_store.get(product_id)
        if product and product.get("app_id") == app_id:
            del products_store[product_id]
            return True
        return False
    
    async def create_category(self, app_id: str, category_data: Dict[str, Any]) -> Dict[str, Any]:
        category_id = str(uuid.uuid4())
        slug = category_data["name"].lower().replace(" ", "-")
        
        category = {
            "id": category_id,
            "app_id": app_id,
            "slug": slug,
            "product_count": 0,
            "created_at": datetime.utcnow().isoformat(),
            **category_data
        }
        categories_store[category_id] = category
        return category
    
    async def list_categories(self, app_id: str) -> Dict[str, Any]:
        categories = [c for c in categories_store.values() if c.get("app_id") == app_id]
        for cat in categories:
            cat["product_count"] = len([
                p for p in products_store.values()
                if p.get("app_id") == app_id and p.get("category") == cat["id"]
            ])
        return {"categories": categories, "total": len(categories)}
    
    async def list_orders(
        self, app_id: str, status: Optional[str] = None, limit: int = 50
    ) -> Dict[str, Any]:
        orders = [o for o in orders_store.values() if o.get("app_id") == app_id]
        if status:
            orders = [o for o in orders if o.get("status") == status]
        orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return {"orders": orders[:limit], "total": len(orders)}
    
    async def get_order(self, app_id: str, order_id: str) -> Optional[Dict[str, Any]]:
        order = orders_store.get(order_id)
        if order and order.get("app_id") == app_id:
            return order
        return None
    
    async def update_order_status(self, app_id: str, order_id: str, status: str) -> Optional[Dict[str, Any]]:
        order = orders_store.get(order_id)
        if not order or order.get("app_id") != app_id:
            return None
        order["status"] = status
        order["updated_at"] = datetime.utcnow().isoformat()
        return order
    
    async def update_inventory(
        self, app_id: str, product_id: str, quantity: int, adjustment_type: str = "set"
    ) -> Optional[Dict[str, Any]]:
        product = products_store.get(product_id)
        if not product or product.get("app_id") != app_id:
            return None
        
        if adjustment_type == "set":
            product["inventory"] = quantity
        elif adjustment_type == "add":
            product["inventory"] = product.get("inventory", 0) + quantity
        elif adjustment_type == "subtract":
            product["inventory"] = max(0, product.get("inventory", 0) - quantity)
        
        product["updated_at"] = datetime.utcnow().isoformat()
        return {"product_id": product_id, "inventory": product["inventory"]}
    
    async def get_storefront_products(
        self, app_id: str, category: Optional[str] = None,
        search: Optional[str] = None, limit: int = 20
    ) -> Dict[str, Any]:
        products = [
            p for p in products_store.values()
            if p.get("app_id") == app_id and p.get("status") == "active"
        ]
        
        if category:
            products = [p for p in products if p.get("category") == category]
        if search:
            search_lower = search.lower()
            products = [p for p in products if search_lower in p.get("name", "").lower()]
        
        public_products = [{
            "id": p["id"], "name": p["name"], "slug": p["slug"],
            "description": p["description"], "price": p["price"],
            "compare_price": p.get("compare_price"),
            "images": p.get("images", []),
            "in_stock": p.get("inventory", 0) > 0
        } for p in products[:limit]]
        
        return {"products": public_products}
