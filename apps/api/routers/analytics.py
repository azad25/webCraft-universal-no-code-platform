"""
Analytics API Routes
Real-time analytics, tracking, and reporting
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from enum import Enum
import uuid

from core.database import get_db, App, Page, User
from core.auth import get_current_user

router = APIRouter()


class TimeRange(str, Enum):
    TODAY = "today"
    YESTERDAY = "yesterday"
    LAST_7_DAYS = "7d"
    LAST_30_DAYS = "30d"
    LAST_90_DAYS = "90d"
    THIS_MONTH = "this_month"
    LAST_MONTH = "last_month"
    THIS_YEAR = "this_year"
    CUSTOM = "custom"


class MetricType(str, Enum):
    PAGE_VIEWS = "page_views"
    UNIQUE_VISITORS = "unique_visitors"
    SESSIONS = "sessions"
    BOUNCE_RATE = "bounce_rate"
    AVG_SESSION_DURATION = "avg_session_duration"
    CONVERSIONS = "conversions"
    REVENUE = "revenue"


class AnalyticsEvent(BaseModel):
    event_type: str
    event_name: str
    properties: Dict[str, Any] = {}
    page_url: Optional[str] = None
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    session_id: Optional[str] = None


class GoalCreate(BaseModel):
    name: str
    description: Optional[str] = None
    goal_type: str  # page_view, event, duration, pages_per_session
    target_value: Any
    config: Dict[str, Any] = {}


def get_date_range(time_range: TimeRange, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    """Calculate date range based on time range enum"""
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    if time_range == TimeRange.TODAY:
        return today, now
    elif time_range == TimeRange.YESTERDAY:
        return today - timedelta(days=1), today
    elif time_range == TimeRange.LAST_7_DAYS:
        return today - timedelta(days=7), now
    elif time_range == TimeRange.LAST_30_DAYS:
        return today - timedelta(days=30), now
    elif time_range == TimeRange.LAST_90_DAYS:
        return today - timedelta(days=90), now
    elif time_range == TimeRange.THIS_MONTH:
        return today.replace(day=1), now
    elif time_range == TimeRange.LAST_MONTH:
        first_of_month = today.replace(day=1)
        last_month_end = first_of_month - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        return last_month_start, first_of_month
    elif time_range == TimeRange.THIS_YEAR:
        return today.replace(month=1, day=1), now
    elif time_range == TimeRange.CUSTOM and start_date and end_date:
        return start_date, end_date
    else:
        return today - timedelta(days=30), now


@router.get("/apps/{app_id}/analytics/overview")
async def get_analytics_overview(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics overview for an app"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    start_date, end_date = get_date_range(time_range)
    
    # In production, this would query actual analytics data
    # For now, return sample data structure
    return {
        "app_id": str(app_id),
        "time_range": time_range.value,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        },
        "metrics": {
            "page_views": {
                "value": 12543,
                "change": 12.5,
                "trend": "up"
            },
            "unique_visitors": {
                "value": 4521,
                "change": 8.3,
                "trend": "up"
            },
            "sessions": {
                "value": 5234,
                "change": 5.2,
                "trend": "up"
            },
            "bounce_rate": {
                "value": 42.3,
                "change": -3.1,
                "trend": "down"
            },
            "avg_session_duration": {
                "value": 185,  # seconds
                "change": 15.2,
                "trend": "up"
            },
            "pages_per_session": {
                "value": 2.4,
                "change": 0.3,
                "trend": "up"
            }
        },
        "comparison": {
            "previous_period": {
                "page_views": 11150,
                "unique_visitors": 4175,
                "sessions": 4975
            }
        }
    }


@router.get("/apps/{app_id}/analytics/traffic")
async def get_traffic_analytics(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    granularity: str = Query("day"),  # hour, day, week, month
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get traffic analytics over time"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    start_date, end_date = get_date_range(time_range)
    
    # Generate sample time series data
    data_points = []
    current = start_date
    while current < end_date:
        import random
        data_points.append({
            "date": current.isoformat(),
            "page_views": random.randint(300, 600),
            "unique_visitors": random.randint(100, 200),
            "sessions": random.randint(150, 250)
        })
        if granularity == "hour":
            current += timedelta(hours=1)
        elif granularity == "day":
            current += timedelta(days=1)
        elif granularity == "week":
            current += timedelta(weeks=1)
        else:
            current += timedelta(days=30)
    
    return {
        "app_id": str(app_id),
        "granularity": granularity,
        "data": data_points
    }


@router.get("/apps/{app_id}/analytics/pages")
async def get_page_analytics(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    limit: int = Query(20, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics by page"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    pages = db.query(Page).filter(Page.app_id == app_id, Page.is_active == True).all()
    
    page_stats = []
    for page in pages[:limit]:
        import random
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
    
    return {
        "app_id": str(app_id),
        "pages": page_stats,
        "total": len(page_stats)
    }


@router.get("/apps/{app_id}/analytics/sources")
async def get_traffic_sources(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get traffic sources breakdown"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    return {
        "app_id": str(app_id),
        "sources": {
            "channels": [
                {"name": "Organic Search", "sessions": 2150, "percentage": 41.1},
                {"name": "Direct", "sessions": 1580, "percentage": 30.2},
                {"name": "Social", "sessions": 820, "percentage": 15.7},
                {"name": "Referral", "sessions": 450, "percentage": 8.6},
                {"name": "Email", "sessions": 180, "percentage": 3.4},
                {"name": "Paid Search", "sessions": 54, "percentage": 1.0}
            ],
            "referrers": [
                {"domain": "google.com", "sessions": 1850, "percentage": 35.4},
                {"domain": "facebook.com", "sessions": 520, "percentage": 9.9},
                {"domain": "twitter.com", "sessions": 180, "percentage": 3.4},
                {"domain": "linkedin.com", "sessions": 120, "percentage": 2.3},
                {"domain": "reddit.com", "sessions": 85, "percentage": 1.6}
            ],
            "search_engines": [
                {"name": "Google", "sessions": 1850, "percentage": 86.0},
                {"name": "Bing", "sessions": 180, "percentage": 8.4},
                {"name": "DuckDuckGo", "sessions": 75, "percentage": 3.5},
                {"name": "Yahoo", "sessions": 45, "percentage": 2.1}
            ]
        }
    }


@router.get("/apps/{app_id}/analytics/geography")
async def get_geography_analytics(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get geographic distribution of visitors"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    return {
        "app_id": str(app_id),
        "countries": [
            {"code": "US", "name": "United States", "sessions": 2100, "percentage": 40.1},
            {"code": "GB", "name": "United Kingdom", "sessions": 580, "percentage": 11.1},
            {"code": "DE", "name": "Germany", "sessions": 420, "percentage": 8.0},
            {"code": "CA", "name": "Canada", "sessions": 380, "percentage": 7.3},
            {"code": "FR", "name": "France", "sessions": 290, "percentage": 5.5},
            {"code": "AU", "name": "Australia", "sessions": 250, "percentage": 4.8},
            {"code": "IN", "name": "India", "sessions": 220, "percentage": 4.2},
            {"code": "BR", "name": "Brazil", "sessions": 180, "percentage": 3.4},
            {"code": "NL", "name": "Netherlands", "sessions": 150, "percentage": 2.9},
            {"code": "JP", "name": "Japan", "sessions": 130, "percentage": 2.5}
        ],
        "cities": [
            {"name": "New York", "country": "US", "sessions": 420},
            {"name": "London", "country": "GB", "sessions": 380},
            {"name": "Los Angeles", "country": "US", "sessions": 290},
            {"name": "San Francisco", "country": "US", "sessions": 250},
            {"name": "Berlin", "country": "DE", "sessions": 180}
        ]
    }


@router.get("/apps/{app_id}/analytics/devices")
async def get_device_analytics(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get device and browser analytics"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    return {
        "app_id": str(app_id),
        "devices": [
            {"type": "Desktop", "sessions": 2800, "percentage": 53.5},
            {"type": "Mobile", "sessions": 2100, "percentage": 40.1},
            {"type": "Tablet", "sessions": 334, "percentage": 6.4}
        ],
        "browsers": [
            {"name": "Chrome", "sessions": 2950, "percentage": 56.4},
            {"name": "Safari", "sessions": 1250, "percentage": 23.9},
            {"name": "Firefox", "sessions": 520, "percentage": 9.9},
            {"name": "Edge", "sessions": 380, "percentage": 7.3},
            {"name": "Other", "sessions": 134, "percentage": 2.5}
        ],
        "operating_systems": [
            {"name": "Windows", "sessions": 2100, "percentage": 40.1},
            {"name": "macOS", "sessions": 1450, "percentage": 27.7},
            {"name": "iOS", "sessions": 980, "percentage": 18.7},
            {"name": "Android", "sessions": 580, "percentage": 11.1},
            {"name": "Linux", "sessions": 124, "percentage": 2.4}
        ],
        "screen_resolutions": [
            {"resolution": "1920x1080", "sessions": 1850, "percentage": 35.4},
            {"resolution": "1366x768", "sessions": 920, "percentage": 17.6},
            {"resolution": "390x844", "sessions": 680, "percentage": 13.0},
            {"resolution": "1536x864", "sessions": 450, "percentage": 8.6},
            {"resolution": "414x896", "sessions": 380, "percentage": 7.3}
        ]
    }


@router.get("/apps/{app_id}/analytics/realtime")
async def get_realtime_analytics(
    app_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get real-time analytics"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    import random
    
    return {
        "app_id": str(app_id),
        "timestamp": datetime.utcnow().isoformat(),
        "active_users": random.randint(5, 50),
        "active_pages": [
            {"path": "/", "title": "Home", "users": random.randint(2, 15)},
            {"path": "/products", "title": "Products", "users": random.randint(1, 10)},
            {"path": "/about", "title": "About", "users": random.randint(0, 5)},
            {"path": "/contact", "title": "Contact", "users": random.randint(0, 3)}
        ],
        "events_per_minute": random.randint(10, 100),
        "top_referrers": [
            {"source": "google.com", "users": random.randint(1, 10)},
            {"source": "direct", "users": random.randint(1, 8)},
            {"source": "facebook.com", "users": random.randint(0, 5)}
        ],
        "locations": [
            {"country": "US", "users": random.randint(2, 20)},
            {"country": "GB", "users": random.randint(1, 10)},
            {"country": "DE", "users": random.randint(0, 5)}
        ]
    }


@router.post("/apps/{app_id}/analytics/events")
async def track_event(
    app_id: uuid.UUID = Path(...),
    event: AnalyticsEvent = None,
    db: Session = Depends(get_db)
):
    """Track an analytics event (public endpoint for tracking)"""
    app = db.query(App).filter(App.id == app_id, App.is_active == True).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # In production, this would store the event in a time-series database
    # or send to an analytics service like Kafka
    
    return {
        "success": True,
        "event_id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/apps/{app_id}/analytics/conversions")
async def get_conversion_analytics(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get conversion analytics and funnel data"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    return {
        "app_id": str(app_id),
        "goals": [
            {
                "id": "signup",
                "name": "User Signup",
                "completions": 245,
                "conversion_rate": 4.7,
                "value": 0
            },
            {
                "id": "purchase",
                "name": "Purchase",
                "completions": 89,
                "conversion_rate": 1.7,
                "value": 8900
            },
            {
                "id": "newsletter",
                "name": "Newsletter Signup",
                "completions": 412,
                "conversion_rate": 7.9,
                "value": 0
            }
        ],
        "funnels": [
            {
                "name": "Purchase Funnel",
                "steps": [
                    {"name": "View Product", "users": 2500, "percentage": 100},
                    {"name": "Add to Cart", "users": 750, "percentage": 30},
                    {"name": "Begin Checkout", "users": 320, "percentage": 12.8},
                    {"name": "Complete Purchase", "users": 89, "percentage": 3.6}
                ]
            }
        ],
        "ecommerce": {
            "revenue": 8900,
            "transactions": 89,
            "average_order_value": 100,
            "products_sold": 156
        }
    }


@router.get("/apps/{app_id}/analytics/performance")
async def get_performance_analytics(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Core Web Vitals and performance metrics"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    return {
        "app_id": str(app_id),
        "core_web_vitals": {
            "lcp": {
                "value": 1.8,
                "unit": "s",
                "rating": "good",
                "threshold": {"good": 2.5, "needs_improvement": 4.0}
            },
            "fid": {
                "value": 45,
                "unit": "ms",
                "rating": "good",
                "threshold": {"good": 100, "needs_improvement": 300}
            },
            "cls": {
                "value": 0.05,
                "unit": "",
                "rating": "good",
                "threshold": {"good": 0.1, "needs_improvement": 0.25}
            },
            "ttfb": {
                "value": 320,
                "unit": "ms",
                "rating": "good",
                "threshold": {"good": 800, "needs_improvement": 1800}
            },
            "fcp": {
                "value": 1.2,
                "unit": "s",
                "rating": "good",
                "threshold": {"good": 1.8, "needs_improvement": 3.0}
            }
        },
        "lighthouse_scores": {
            "performance": 92,
            "accessibility": 95,
            "best_practices": 100,
            "seo": 98
        },
        "page_load_distribution": {
            "fast": 78,
            "moderate": 18,
            "slow": 4
        }
    }


@router.post("/apps/{app_id}/analytics/goals")
async def create_goal(
    app_id: uuid.UUID = Path(...),
    goal: GoalCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a conversion goal"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # In production, this would store the goal in the database
    return {
        "id": str(uuid.uuid4()),
        "app_id": str(app_id),
        "name": goal.name,
        "description": goal.description,
        "goal_type": goal.goal_type,
        "target_value": goal.target_value,
        "config": goal.config,
        "created_at": datetime.utcnow().isoformat()
    }


@router.get("/apps/{app_id}/analytics/export")
async def export_analytics(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    format: str = Query("csv"),  # csv, json, xlsx
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export analytics data"""
    app = db.query(App).filter(App.id == app_id, App.owner_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # In production, this would generate and return the export file
    return {
        "status": "processing",
        "export_id": str(uuid.uuid4()),
        "format": format,
        "download_url": f"/api/v1/apps/{app_id}/analytics/export/download",
        "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()
    }
