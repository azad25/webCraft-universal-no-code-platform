"""Analytics domain service"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import uuid
import random

from .schemas import TimeRange


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_date_range(
        self,
        time_range: TimeRange,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> tuple:
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        ranges = {
            TimeRange.TODAY: (today, now),
            TimeRange.YESTERDAY: (today - timedelta(days=1), today),
            TimeRange.LAST_7_DAYS: (today - timedelta(days=7), now),
            TimeRange.LAST_30_DAYS: (today - timedelta(days=30), now),
            TimeRange.LAST_90_DAYS: (today - timedelta(days=90), now),
            TimeRange.THIS_MONTH: (today.replace(day=1), now),
            TimeRange.THIS_YEAR: (today.replace(month=1, day=1), now),
        }
        
        if time_range == TimeRange.LAST_MONTH:
            first_of_month = today.replace(day=1)
            last_month_end = first_of_month - timedelta(days=1)
            return last_month_end.replace(day=1), first_of_month
        
        if time_range == TimeRange.CUSTOM and start_date and end_date:
            return start_date, end_date
        
        return ranges.get(time_range, (today - timedelta(days=30), now))
    
    async def get_overview(self, app_id: str, time_range: TimeRange) -> Dict[str, Any]:
        start_date, end_date = self.get_date_range(time_range)
        
        return {
            "app_id": app_id,
            "time_range": time_range.value,
            "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "metrics": {
                "page_views": {"value": 12543, "change": 12.5, "trend": "up"},
                "unique_visitors": {"value": 4521, "change": 8.3, "trend": "up"},
                "sessions": {"value": 5234, "change": 5.2, "trend": "up"},
                "bounce_rate": {"value": 42.3, "change": -3.1, "trend": "down"},
                "avg_session_duration": {"value": 185, "change": 15.2, "trend": "up"},
                "pages_per_session": {"value": 2.4, "change": 0.3, "trend": "up"}
            },
            "comparison": {
                "previous_period": {"page_views": 11150, "unique_visitors": 4175, "sessions": 4975}
            }
        }
    
    async def get_traffic(
        self, app_id: str, time_range: TimeRange, granularity: str = "day"
    ) -> Dict[str, Any]:
        start_date, end_date = self.get_date_range(time_range)
        data_points = []
        current = start_date
        
        delta = {
            "hour": timedelta(hours=1),
            "day": timedelta(days=1),
            "week": timedelta(weeks=1),
            "month": timedelta(days=30)
        }.get(granularity, timedelta(days=1))
        
        while current < end_date:
            data_points.append({
                "date": current.isoformat(),
                "page_views": random.randint(300, 600),
                "unique_visitors": random.randint(100, 200),
                "sessions": random.randint(150, 250)
            })
            current += delta
        
        return {"app_id": app_id, "granularity": granularity, "data": data_points}
    
    async def get_page_analytics(self, app_id: str, pages: list, limit: int = 20) -> Dict[str, Any]:
        page_stats = []
        for page in pages[:limit]:
            page_stats.append({
                "page_id": str(page.id),
                "title": page.title,
                "path": f"/{page.slug}" if not page.is_homepage else "/",
                "page_views": random.randint(100, 2000),
                "unique_visitors": random.randint(50, 1000),
                "avg_time_on_page": random.randint(30, 300),
                "bounce_rate": round(random.uniform(20, 70), 1),
                "exit_rate": round(random.uniform(10, 50), 1)
            })
        page_stats.sort(key=lambda x: x["page_views"], reverse=True)
        return {"app_id": app_id, "pages": page_stats, "total": len(page_stats)}
    
    async def get_traffic_sources(self, app_id: str) -> Dict[str, Any]:
        return {
            "app_id": app_id,
            "sources": {
                "channels": [
                    {"name": "Organic Search", "sessions": 2150, "percentage": 41.1},
                    {"name": "Direct", "sessions": 1580, "percentage": 30.2},
                    {"name": "Social", "sessions": 820, "percentage": 15.7},
                    {"name": "Referral", "sessions": 450, "percentage": 8.6},
                    {"name": "Email", "sessions": 180, "percentage": 3.4},
                ],
                "referrers": [
                    {"domain": "google.com", "sessions": 1850, "percentage": 35.4},
                    {"domain": "facebook.com", "sessions": 520, "percentage": 9.9},
                ],
                "search_engines": [
                    {"name": "Google", "sessions": 1850, "percentage": 86.0},
                    {"name": "Bing", "sessions": 180, "percentage": 8.4},
                ]
            }
        }
    
    async def get_geography(self, app_id: str) -> Dict[str, Any]:
        return {
            "app_id": app_id,
            "countries": [
                {"code": "US", "name": "United States", "sessions": 2100, "percentage": 40.1},
                {"code": "GB", "name": "United Kingdom", "sessions": 580, "percentage": 11.1},
                {"code": "DE", "name": "Germany", "sessions": 420, "percentage": 8.0},
            ],
            "cities": [
                {"name": "New York", "country": "US", "sessions": 420},
                {"name": "London", "country": "GB", "sessions": 380},
            ]
        }
    
    async def get_devices(self, app_id: str) -> Dict[str, Any]:
        return {
            "app_id": app_id,
            "devices": [
                {"type": "Desktop", "sessions": 2800, "percentage": 53.5},
                {"type": "Mobile", "sessions": 2100, "percentage": 40.1},
                {"type": "Tablet", "sessions": 334, "percentage": 6.4}
            ],
            "browsers": [
                {"name": "Chrome", "sessions": 2950, "percentage": 56.4},
                {"name": "Safari", "sessions": 1250, "percentage": 23.9},
            ],
            "operating_systems": [
                {"name": "Windows", "sessions": 2100, "percentage": 40.1},
                {"name": "macOS", "sessions": 1450, "percentage": 27.7},
            ]
        }
    
    async def get_realtime(self, app_id: str) -> Dict[str, Any]:
        return {
            "app_id": app_id,
            "timestamp": datetime.utcnow().isoformat(),
            "active_users": random.randint(5, 50),
            "active_pages": [
                {"path": "/", "title": "Home", "users": random.randint(2, 15)},
                {"path": "/products", "title": "Products", "users": random.randint(1, 10)},
            ],
            "events_per_minute": random.randint(10, 100),
            "top_referrers": [{"source": "google.com", "users": random.randint(1, 10)}],
            "locations": [{"country": "US", "users": random.randint(2, 20)}]
        }
    
    async def track_event(self, app_id: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "success": True,
            "event_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def get_conversions(self, app_id: str) -> Dict[str, Any]:
        return {
            "app_id": app_id,
            "goals": [
                {"id": "signup", "name": "User Signup", "completions": 245, "conversion_rate": 4.7, "value": 0},
                {"id": "purchase", "name": "Purchase", "completions": 89, "conversion_rate": 1.7, "value": 8900},
            ],
            "funnels": [{
                "name": "Purchase Funnel",
                "steps": [
                    {"name": "View Product", "users": 2500, "percentage": 100},
                    {"name": "Add to Cart", "users": 750, "percentage": 30},
                    {"name": "Complete Purchase", "users": 89, "percentage": 3.6}
                ]
            }],
            "ecommerce": {"revenue": 8900, "transactions": 89, "average_order_value": 100}
        }
    
    async def get_performance(self, app_id: str) -> Dict[str, Any]:
        return {
            "app_id": app_id,
            "core_web_vitals": {
                "lcp": {"value": 1.8, "unit": "s", "rating": "good"},
                "fid": {"value": 45, "unit": "ms", "rating": "good"},
                "cls": {"value": 0.05, "unit": "", "rating": "good"},
            },
            "lighthouse_scores": {"performance": 92, "accessibility": 95, "best_practices": 100, "seo": 98},
            "page_load_distribution": {"fast": 78, "moderate": 18, "slow": 4}
        }
    
    async def create_goal(self, app_id: str, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": str(uuid.uuid4()),
            "app_id": app_id,
            **goal_data,
            "created_at": datetime.utcnow().isoformat()
        }
