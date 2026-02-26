"""Analytics domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.apps.models import App
from src.domains.auth.schemas import UserResponse
from src.domains.pages.models import Page
from .service import AnalyticsService
from .schemas import TimeRange, AnalyticsEventCreate, GoalCreate

router = APIRouter(prefix="/apps/{app_id}/analytics")


async def get_app_or_404(app_id: uuid.UUID, user_id: str, db: Session) -> App:
    app = db.query(App).filter(App.id == app_id, App.owner_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


@router.get("/overview")
async def get_analytics_overview(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics overview for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = AnalyticsService(db)
    return await service.get_overview(str(app_id), time_range)


@router.get("/traffic")
async def get_traffic_analytics(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    granularity: str = Query("day"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get traffic analytics over time"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = AnalyticsService(db)
    return await service.get_traffic(str(app_id), time_range, granularity)


@router.get("/pages")
async def get_page_analytics(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    limit: int = Query(20, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics by page"""
    app = await get_app_or_404(app_id, str(current_user.id), db)
    pages = db.query(Page).filter(Page.app_id == app_id, Page.is_active == True).all()
    service = AnalyticsService(db)
    return await service.get_page_analytics(str(app_id), pages, limit)


@router.get("/sources")
async def get_traffic_sources(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get traffic sources breakdown"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = AnalyticsService(db)
    return await service.get_traffic_sources(str(app_id))


@router.get("/geography")
async def get_geography_analytics(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get geographic distribution of visitors"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = AnalyticsService(db)
    return await service.get_geography(str(app_id))


@router.get("/devices")
async def get_device_analytics(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get device and browser analytics"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = AnalyticsService(db)
    return await service.get_devices(str(app_id))


@router.get("/realtime")
async def get_realtime_analytics(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get real-time analytics"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = AnalyticsService(db)
    return await service.get_realtime(str(app_id))


@router.post("/events")
async def track_event(
    app_id: uuid.UUID = Path(...),
    event: AnalyticsEventCreate = None,
    db: Session = Depends(get_db)
):
    """Track an analytics event (public endpoint)"""
    app = db.query(App).filter(App.id == app_id, App.is_active == True).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    service = AnalyticsService(db)
    return await service.track_event(str(app_id), event.dict() if event else {})


@router.get("/conversions")
async def get_conversion_analytics(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get conversion analytics and funnel data"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = AnalyticsService(db)
    return await service.get_conversions(str(app_id))


@router.get("/performance")
async def get_performance_analytics(
    app_id: uuid.UUID = Path(...),
    time_range: TimeRange = Query(TimeRange.LAST_30_DAYS),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Core Web Vitals and performance metrics"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = AnalyticsService(db)
    return await service.get_performance(str(app_id))


@router.post("/goals")
async def create_goal(
    app_id: uuid.UUID = Path(...),
    goal: GoalCreate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a conversion goal"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = AnalyticsService(db)
    return await service.create_goal(str(app_id), goal.dict() if goal else {})
