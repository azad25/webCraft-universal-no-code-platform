"""Payment domain service"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session


PLANS = {
    "free": {
        "name": "Free",
        "price": 0,
        "features": {
            "apps": 2,
            "storage_gb": 1,
            "bandwidth_gb": 10,
            "ai_requests_per_month": 50,
            "custom_domain": False,
            "analytics": "basic",
            "support": "community"
        }
    },
    "pro": {
        "name": "Pro",
        "price": 29,
        "stripe_price_id": "price_pro_monthly",
        "features": {
            "apps": 10,
            "storage_gb": 50,
            "bandwidth_gb": 500,
            "ai_requests_per_month": 1000,
            "custom_domain": True,
            "analytics": "advanced",
            "support": "email"
        }
    },
    "enterprise": {
        "name": "Enterprise",
        "price": 99,
        "stripe_price_id": "price_enterprise_monthly",
        "features": {
            "apps": "unlimited",
            "storage_gb": 500,
            "bandwidth_gb": 5000,
            "ai_requests_per_month": 10000,
            "custom_domain": True,
            "analytics": "full",
            "support": "priority"
        }
    }
}


class PaymentService:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_available_plans(self) -> Dict[str, Any]:
        return {"plans": PLANS}
    
    async def create_subscription(
        self, user, plan: str, payment_method_id: str
    ) -> Dict[str, Any]:
        if plan not in PLANS:
            return {"success": False, "error": "Invalid plan"}
        
        return {
            "success": True,
            "subscription_id": "sub_xxx",
            "plan": plan,
            "status": "active"
        }
    
    async def cancel_subscription(self, user) -> Dict[str, Any]:
        return {"success": True, "message": "Subscription will be cancelled at period end"}
    
    async def reactivate_subscription(self, user) -> Dict[str, Any]:
        return {"success": True, "message": "Subscription reactivated"}
    
    async def update_payment_method(self, user, payment_method_id: str) -> Dict[str, Any]:
        return {"success": True, "message": "Payment method updated"}
    
    async def get_billing_history(self, user) -> Dict[str, Any]:
        return {
            "success": True,
            "invoices": [],
            "payment_methods": []
        }
    
    async def get_usage_stats(self, user) -> Dict[str, Any]:
        tier = getattr(user, 'subscription_tier', 'free')
        plan = PLANS.get(tier, PLANS["free"])
        
        return {
            "plan": {"name": plan["name"], "tier": tier},
            "usage": {"apps": 1, "storage_gb": 0.1, "bandwidth_gb": 0.5, "ai_requests": 10},
            "limits": plan["features"],
            "usage_percentage": {"apps": 50.0, "storage": 10.0, "bandwidth": 5.0, "ai_requests": 20.0}
        }
    
    async def get_subscription_status(self, user) -> Dict[str, Any]:
        return {
            "tier": getattr(user, 'subscription_tier', 'free'),
            "is_premium": getattr(user, 'is_premium', False),
            "expires_at": None,
            "status": "active" if getattr(user, 'is_premium', False) else "free"
        }
    
    async def create_setup_intent(self, user) -> Dict[str, Any]:
        return {
            "client_secret": "seti_xxx_secret_xxx",
            "setup_intent_id": "seti_xxx"
        }
    
    async def handle_webhook(self, payload: str, sig_header: str) -> Dict[str, Any]:
        return {"success": True}
    
    async def check_feature_access(self, user, feature: str) -> bool:
        tier = getattr(user, 'subscription_tier', 'free')
        plan = PLANS.get(tier, PLANS["free"])
        features = plan.get("features", {})
        
        feature_map = {
            "custom_domain": features.get("custom_domain", False),
            "advanced_analytics": features.get("analytics") in ["advanced", "full"],
            "priority_support": features.get("support") == "priority",
            "unlimited_apps": features.get("apps") == "unlimited"
        }
        
        return feature_map.get(feature, False)
    
    async def calculate_pricing(
        self, apps: int, storage_gb: int, bandwidth_gb: int, ai_requests: int
    ) -> Dict[str, Any]:
        recommendations = []
        
        for plan_id, plan in PLANS.items():
            features = plan["features"]
            meets_requirements = True
            reasons = []
            
            if isinstance(features.get("apps"), int) and apps > features["apps"]:
                meets_requirements = False
                reasons.append(f"Needs {apps} apps, plan allows {features['apps']}")
            
            if storage_gb > features["storage_gb"]:
                meets_requirements = False
                reasons.append(f"Needs {storage_gb}GB storage, plan allows {features['storage_gb']}GB")
            
            if bandwidth_gb > features["bandwidth_gb"]:
                meets_requirements = False
                reasons.append(f"Needs {bandwidth_gb}GB bandwidth, plan allows {features['bandwidth_gb']}GB")
            
            if ai_requests > features["ai_requests_per_month"]:
                meets_requirements = False
                reasons.append(f"Needs {ai_requests} AI requests, plan allows {features['ai_requests_per_month']}")
            
            recommendations.append({
                "plan": plan_id,
                "name": plan["name"],
                "price": plan["price"],
                "meets_requirements": meets_requirements,
                "reasons": reasons if not meets_requirements else ["Meets all requirements"]
            })
        
        recommendations.sort(key=lambda x: (not x["meets_requirements"], x["price"]))
        
        return {
            "requirements": {"apps": apps, "storage_gb": storage_gb, "bandwidth_gb": bandwidth_gb, "ai_requests": ai_requests},
            "recommendations": recommendations,
            "suggested_plan": recommendations[0]["plan"] if recommendations else "free"
        }
