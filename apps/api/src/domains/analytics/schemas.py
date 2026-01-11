"""Analytics domain schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


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


class AnalyticsEventCreate(BaseModel):
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
    goal_type: str
    target_value: Any
    config: Dict[str, Any] = {}


class MetricValue(BaseModel):
    value: float
    change: float
    trend: str


class AnalyticsOverview(BaseModel):
    app_id: str
    time_range: str
    period: Dict[str, str]
    metrics: Dict[str, MetricValue]
    comparison: Dict[str, Any]


class TrafficDataPoint(BaseModel):
    date: str
    page_views: int
    unique_visitors: int
    sessions: int


class PageStats(BaseModel):
    page_id: str
    title: str
    path: str
    page_views: int
    unique_visitors: int
    avg_time_on_page: int
    bounce_rate: float
    exit_rate: float


class TrafficSource(BaseModel):
    name: str
    sessions: int
    percentage: float


class GeoLocation(BaseModel):
    code: str
    name: str
    sessions: int
    percentage: float


class DeviceStats(BaseModel):
    type: str
    sessions: int
    percentage: float


class RealtimeData(BaseModel):
    app_id: str
    timestamp: str
    active_users: int
    active_pages: List[Dict[str, Any]]
    events_per_minute: int
    top_referrers: List[Dict[str, Any]]
    locations: List[Dict[str, Any]]


class ConversionGoal(BaseModel):
    id: str
    name: str
    completions: int
    conversion_rate: float
    value: float


class FunnelStep(BaseModel):
    name: str
    users: int
    percentage: float


class PerformanceMetrics(BaseModel):
    core_web_vitals: Dict[str, Any]
    lighthouse_scores: Dict[str, int]
    page_load_distribution: Dict[str, int]
