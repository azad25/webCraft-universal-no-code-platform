"""
Apps domain models
"""

from sqlalchemy import Column, String, Boolean, Text, Integer, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from src.common.base_model import BaseModel


class App(BaseModel):
    """Application model for V2"""
    __tablename__ = "apps"
    
    name = Column(String(255), nullable=False)
    slug = Column(String(100), index=True, nullable=False)
    description = Column(Text)
    app_type = Column(String(100), nullable=False)
    
    # Owner
    owner_id = Column(UUID(as_uuid=True), nullable=False)  # Reference to V1 users table
    organization_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Configuration
    config = Column(JSONB, default={})
    theme_config = Column(JSONB, default={})
    seo_config = Column(JSONB, default={})
    
    # Deployment
    is_published = Column(Boolean, default=False)
    custom_domain = Column(String(255), nullable=True)
    subdomain = Column(String(100), unique=True, nullable=True)
    
    # Template (reference only, no relationship)
    template_id = Column(UUID(as_uuid=True), nullable=True)  # Reference to V1 templates table
    
    # Relationships (V2 only)
    pages = relationship("Page", back_populates="app", cascade="all, delete-orphan")
    widgets = relationship("AppWidget", back_populates="app", cascade="all, delete-orphan")
    custom_assets = relationship("CustomAsset", back_populates="app", cascade="all, delete-orphan")
    media_items = relationship("MediaItem", back_populates="app", cascade="all, delete-orphan")
    media_folders = relationship("MediaFolder", back_populates="app", cascade="all, delete-orphan")
    ai_requests = relationship("AIRequest", back_populates="app", cascade="all, delete-orphan")
    automations = relationship("Automation", back_populates="app", cascade="all, delete-orphan")
    collections = relationship("Collection", back_populates="app", cascade="all, delete-orphan")
    data_sources = relationship("DataSource", back_populates="app", cascade="all, delete-orphan")
    scrapers = relationship("WebScraper", back_populates="app", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_app_owner_slug', 'owner_id', 'slug'),
        Index('idx_app_subdomain', 'subdomain'),
        Index('idx_app_custom_domain', 'custom_domain'),
    )


class Page(BaseModel):
    """Page model for V2"""
    __tablename__ = "pages"
    
    title = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False)
    content = Column(JSONB, default={})
    
    # SEO
    meta_title = Column(String(255))
    meta_description = Column(Text)
    meta_keywords = Column(String(500))
    og_image = Column(String(500))
    
    # Settings
    is_homepage = Column(Boolean, default=False)
    is_published = Column(Boolean, default=True)
    password_protected = Column(Boolean, default=False)
    password_hash = Column(String(255), nullable=True)
    
    # App relationship
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App", back_populates="pages")
    custom_assets = relationship("CustomAsset", back_populates="page")
    
    __table_args__ = (
        Index('idx_page_app_slug', 'app_id', 'slug'),
    )


class AppWidget(BaseModel):
    """Widget instance in an app for V2"""
    __tablename__ = "app_widgets"
    
    config = Column(JSONB, default={})
    position = Column(JSONB, default={})
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    widget_id = Column(UUID(as_uuid=True), ForeignKey("widgets.id"), nullable=False)
    page_id = Column(UUID(as_uuid=True), ForeignKey("pages.id"), nullable=True)
    
    app = relationship("App", back_populates="widgets")
    page = relationship("Page")
    widget = relationship("Widget", back_populates="app_widgets")


class CustomAsset(BaseModel):
    """Custom HTML/CSS/JS assets for apps in V2"""
    __tablename__ = "custom_assets"
    
    name = Column(String(255), nullable=False)
    asset_type = Column(String(50), nullable=False)  # html, css, js
    content = Column(Text, nullable=False)
    is_minified = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    
    # Scope
    scope = Column(String(50), default="app")  # app, page, global
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    page_id = Column(UUID(as_uuid=True), ForeignKey("pages.id"), nullable=True)
    
    # Add the missing relationships
    app = relationship("App", back_populates="custom_assets")
    page = relationship("Page", back_populates="custom_assets")
    
class Action(BaseModel):
    """Action model for V2"""
    __tablename__ = "actions"
    
    name = Column(String(255), nullable=False)
    action_type = Column(String(100), nullable=False)  # webhook, email, api_call, etc.
    trigger_config = Column(JSONB, default={})
    config = Column(JSONB, default={})
    is_enabled = Column(Boolean, default=True)
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App", back_populates="actions")
    executions = relationship("ActionExecution", back_populates="action", cascade="all, delete-orphan")


class ActionExecution(BaseModel):
    """Action execution log for V2"""
    __tablename__ = "action_executions"
    
    input_data = Column(JSONB, default={})
    output_data = Column(JSONB, default={})
    status = Column(String(50), nullable=False)  # success, failed, pending
    error_message = Column(Text, nullable=True)
    executed_at = Column(String(50), nullable=False)
    
    # Relationships
    action_id = Column(UUID(as_uuid=True), ForeignKey("actions.id"), nullable=False)
    action = relationship("Action", back_populates="executions")


class DataFlow(BaseModel):
    """Data flow model for V2"""
    __tablename__ = "data_flows"
    
    name = Column(String(255), nullable=False)
    description = Column(Text)
    config = Column(JSONB, default={})
    is_enabled = Column(Boolean, default=True)
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App", back_populates="data_flows")
    executions = relationship("DataFlowExecution", back_populates="flow", cascade="all, delete-orphan")


class DataFlowExecution(BaseModel):
    """Data flow execution log for V2"""
    __tablename__ = "data_flow_executions"
    
    input_data = Column(JSONB, default={})
    output_data = Column(JSONB, default={})
    status = Column(String(50), nullable=False)  # success, failed, running
    error_message = Column(Text, nullable=True)
    executed_at = Column(String(50), nullable=False)
    
    # Relationships
    flow_id = Column(UUID(as_uuid=True), ForeignKey("data_flows.id"), nullable=False)
    flow = relationship("DataFlow", back_populates="executions")


class AppEvent(BaseModel):
    """App event model for V2"""
    __tablename__ = "app_events"
    
    event_type = Column(String(100), nullable=False)
    event_data = Column(JSONB, default={})
    triggered_at = Column(String(50), nullable=False)
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App", back_populates="events")


class Export(BaseModel):
    """Export model for V2"""
    __tablename__ = "exports"
    
    export_type = Column(String(50), nullable=False)  # static, github, netlify, vercel
    config = Column(JSONB, default={})
    status = Column(String(50), nullable=False)  # pending, processing, completed, failed
    progress = Column(Integer, default=0)
    download_url = Column(String(500), nullable=True)
    completed_at = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App", back_populates="exports")


class LighthouseAudit(BaseModel):
    """Lighthouse audit model for V2"""
    __tablename__ = "lighthouse_audits"
    
    url = Column(String(500), nullable=False)
    status = Column(String(50), nullable=False)  # pending, running, completed, failed
    scores = Column(JSONB, default={})
    metrics = Column(JSONB, default={})
    report_url = Column(String(500), nullable=True)
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App", back_populates="lighthouse_audits")


class NotificationTemplate(BaseModel):
    """Notification template model for V2"""
    __tablename__ = "notification_templates"
    
    name = Column(String(255), nullable=False)
    template_type = Column(String(50), nullable=False)  # email, sms, push
    subject = Column(String(500), nullable=True)
    content = Column(Text, nullable=False)
    variables = Column(JSONB, default={})
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App", back_populates="notification_templates")


class Notification(BaseModel):
    """Notification model for V2"""
    __tablename__ = "notifications"
    
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)
    recipient = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)  # sent, delivered, failed
    sent_at = Column(String(50), nullable=False)
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("notification_templates.id"), nullable=True)
    app = relationship("App", back_populates="notifications")
    template = relationship("NotificationTemplate")


class PushSubscription(BaseModel):
    """Push subscription model for V2"""
    __tablename__ = "push_subscriptions"
    
    endpoint = Column(String(500), nullable=False)
    p256dh_key = Column(String(255), nullable=False)
    auth_key = Column(String(255), nullable=False)
    user_agent = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App", back_populates="push_subscriptions")


class PreviewSession(BaseModel):
    """Preview session model for V2"""
    __tablename__ = "preview_sessions"
    
    token = Column(String(255), nullable=False, unique=True)
    device = Column(String(50), default="desktop")
    expires_at = Column(String(50), nullable=False)
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App", back_populates="preview_sessions")


class Webhook(BaseModel):
    """Webhook model for V2"""
    __tablename__ = "webhooks"
    
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    events = Column(JSONB, default=[])
    secret = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App", back_populates="webhooks")
    logs = relationship("WebhookLog", back_populates="webhook", cascade="all, delete-orphan")


class WebhookLog(BaseModel):
    """Webhook log model for V2"""
    __tablename__ = "webhook_logs"
    
    event_type = Column(String(100), nullable=False)
    payload = Column(JSONB, default={})
    response_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    status = Column(String(50), nullable=False)  # success, failed, pending
    sent_at = Column(String(50), nullable=False)
    
    # Relationships
    webhook_id = Column(UUID(as_uuid=True), ForeignKey("webhooks.id"), nullable=False)
    webhook = relationship("Webhook", back_populates="logs")


class Relation(BaseModel):
    """Relation model for V2"""
    __tablename__ = "relations"
    
    relation_type = Column(String(50), nullable=False)  # one_to_one, one_to_many, many_to_many
    source_collection_id = Column(UUID(as_uuid=True), nullable=False)
    target_collection_id = Column(UUID(as_uuid=True), nullable=False)
    config = Column(JSONB, default={})
    
    # Relationships
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id"), nullable=False)
    app = relationship("App", back_populates="relations")


# Update App model to include new relationships
App.actions = relationship("Action", back_populates="app", cascade="all, delete-orphan")
App.data_flows = relationship("DataFlow", back_populates="app", cascade="all, delete-orphan")
App.events = relationship("AppEvent", back_populates="app", cascade="all, delete-orphan")
App.exports = relationship("Export", back_populates="app", cascade="all, delete-orphan")
App.lighthouse_audits = relationship("LighthouseAudit", back_populates="app", cascade="all, delete-orphan")
App.notification_templates = relationship("NotificationTemplate", back_populates="app", cascade="all, delete-orphan")
App.notifications = relationship("Notification", back_populates="app", cascade="all, delete-orphan")
App.push_subscriptions = relationship("PushSubscription", back_populates="app", cascade="all, delete-orphan")
App.preview_sessions = relationship("PreviewSession", back_populates="app", cascade="all, delete-orphan")
App.webhooks = relationship("Webhook", back_populates="app", cascade="all, delete-orphan")
App.relations = relationship("Relation", back_populates="app", cascade="all, delete-orphan")

