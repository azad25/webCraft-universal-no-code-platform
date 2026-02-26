"""Link management service"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import requests
import asyncio
import aiohttp
from urllib.parse import urlparse

from .models import AppLink, LinkGroup, LinkGroupItem, LinkRedirect, LinkAnalytics
from .schemas import (
    LinkCreate, LinkUpdate, LinkResponse,
    LinkGroupCreate, LinkGroupUpdate, LinkGroupResponse,
    LinkRedirectCreate, LinkRedirectUpdate, LinkRedirectResponse,
    LinkStatsResponse, LinkValidationResult, BulkValidationResponse
)
from src.domains.apps.models import App
from src.domains.pages.models import Page


class LinkService:
    def __init__(self, db: Session):
        self.db = db
    
    # Link CRUD operations
    async def create_link(self, app_id: str, user_id: str, data: LinkCreate) -> LinkResponse:
        """Create a new link"""
        # Verify app ownership
        app = self.db.query(App).filter(
            App.id == app_id,
            App.owner_id == user_id
        ).first()
        
        if not app:
            raise ValueError("App not found")
        
        # Verify page exists if page_id provided
        if data.page_id:
            page = self.db.query(Page).filter(
                Page.id == data.page_id,
                Page.app_id == app_id
            ).first()
            
            if not page:
                raise ValueError("Page not found")
        
        # Create link
        link = AppLink(
            app_id=app_id,
            **data.dict()
        )
        
        self.db.add(link)
        self.db.commit()
        self.db.refresh(link)
        
        return LinkResponse.from_orm(link)
    
    async def get_link(self, app_id: str, link_id: str, user_id: str) -> Optional[LinkResponse]:
        """Get a specific link"""
        link = self.db.query(AppLink).join(App).filter(
            AppLink.id == link_id,
            AppLink.app_id == app_id,
            App.owner_id == user_id
        ).first()
        
        if not link:
            return None
        
        return LinkResponse.from_orm(link)
    
    async def list_links(
        self,
        app_id: str,
        user_id: str,
        page_id: Optional[str] = None,
        category: Optional[str] = None,
        link_type: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        per_page: int = 50
    ) -> Dict[str, Any]:
        """List links with filtering"""
        query = self.db.query(AppLink).join(App).filter(
            AppLink.app_id == app_id,
            App.owner_id == user_id
        )
        
        # Apply filters
        if page_id:
            query = query.filter(AppLink.page_id == page_id)
        
        if category:
            query = query.filter(AppLink.category == category)
        
        if link_type:
            query = query.filter(AppLink.link_type == link_type)
        
        if is_active is not None:
            query = query.filter(AppLink.is_active == is_active)
        
        if search:
            query = query.filter(
                or_(
                    AppLink.title.ilike(f"%{search}%"),
                    AppLink.url.ilike(f"%{search}%"),
                    AppLink.description.ilike(f"%{search}%")
                )
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        links = query.order_by(AppLink.sort_order, AppLink.created_at).offset(
            (page - 1) * per_page
        ).limit(per_page).all()
        
        return {
            "links": [LinkResponse.from_orm(link) for link in links],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
    
    async def update_link(self, app_id: str, link_id: str, user_id: str, data: LinkUpdate) -> Optional[LinkResponse]:
        """Update a link"""
        link = self.db.query(AppLink).join(App).filter(
            AppLink.id == link_id,
            AppLink.app_id == app_id,
            App.owner_id == user_id
        ).first()
        
        if not link:
            return None
        
        # Update fields
        update_data = data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(link, field, value)
        
        link.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(link)
        
        return LinkResponse.from_orm(link)
    
    async def delete_link(self, app_id: str, link_id: str, user_id: str) -> bool:
        """Delete a link"""
        link = self.db.query(AppLink).join(App).filter(
            AppLink.id == link_id,
            AppLink.app_id == app_id,
            App.owner_id == user_id
        ).first()
        
        if not link:
            return False
        
        # Delete analytics
        self.db.query(LinkAnalytics).filter(LinkAnalytics.link_id == link_id).delete()
        
        # Remove from groups
        self.db.query(LinkGroupItem).filter(LinkGroupItem.link_id == link_id).delete()
        
        # Delete link
        self.db.delete(link)
        self.db.commit()
        
        return True
    
    # Link validation
    async def validate_link(self, link_id: str) -> LinkValidationResult:
        """Validate a single link"""
        link = self.db.query(AppLink).filter(AppLink.id == link_id).first()
        
        if not link:
            raise ValueError("Link not found")
        
        start_time = datetime.utcnow()
        
        try:
            # Skip validation for certain link types
            if link.link_type in ['email', 'phone', 'anchor']:
                return LinkValidationResult(
                    link_id=link.id,
                    url=link.url,
                    is_valid=True,
                    status_code=None,
                    error_message=None,
                    response_time_ms=0,
                    checked_at=start_time
                )
            
            # Validate HTTP/HTTPS links
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.head(link.url) as response:
                    response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
                    
                    is_valid = response.status < 400
                    error_message = None if is_valid else f"HTTP {response.status}"
                    
                    # Update link status
                    link.is_validated = True
                    link.last_checked = start_time
                    link.status_code = response.status
                    link.error_message = error_message
                    
                    self.db.commit()
                    
                    return LinkValidationResult(
                        link_id=link.id,
                        url=link.url,
                        is_valid=is_valid,
                        status_code=response.status,
                        error_message=error_message,
                        response_time_ms=int(response_time),
                        checked_at=start_time
                    )
        
        except Exception as e:
            error_message = str(e)
            
            # Update link status
            link.is_validated = True
            link.last_checked = start_time
            link.status_code = None
            link.error_message = error_message
            
            self.db.commit()
            
            return LinkValidationResult(
                link_id=link.id,
                url=link.url,
                is_valid=False,
                status_code=None,
                error_message=error_message,
                response_time_ms=None,
                checked_at=start_time
            )
    
    async def validate_all_links(self, app_id: str, user_id: str) -> BulkValidationResponse:
        """Validate all links in an app"""
        links = self.db.query(AppLink).join(App).filter(
            AppLink.app_id == app_id,
            App.owner_id == user_id,
            AppLink.is_active == True
        ).all()
        
        results = []
        valid_count = 0
        
        for link in links:
            result = await self.validate_link(str(link.id))
            results.append(result)
            
            if result.is_valid:
                valid_count += 1
        
        return BulkValidationResponse(
            total_checked=len(results),
            valid_links=valid_count,
            invalid_links=len(results) - valid_count,
            results=results
        )
    
    # Link groups
    async def create_link_group(self, app_id: str, user_id: str, data: LinkGroupCreate) -> LinkGroupResponse:
        """Create a link group"""
        # Verify app ownership
        app = self.db.query(App).filter(
            App.id == app_id,
            App.owner_id == user_id
        ).first()
        
        if not app:
            raise ValueError("App not found")
        
        # Check for duplicate slug
        existing = self.db.query(LinkGroup).filter(
            LinkGroup.app_id == app_id,
            LinkGroup.slug == data.slug
        ).first()
        
        if existing:
            raise ValueError("Group with this slug already exists")
        
        group = LinkGroup(
            app_id=app_id,
            **data.dict()
        )
        
        self.db.add(group)
        self.db.commit()
        self.db.refresh(group)
        
        return LinkGroupResponse.from_orm(group)
    
    async def get_link_group(self, app_id: str, group_id: str, user_id: str) -> Optional[LinkGroupResponse]:
        """Get a link group with its links"""
        group = self.db.query(LinkGroup).join(App).filter(
            LinkGroup.id == group_id,
            LinkGroup.app_id == app_id,
            App.owner_id == user_id
        ).first()
        
        if not group:
            return None
        
        return LinkGroupResponse.from_orm(group)
    
    async def list_link_groups(self, app_id: str, user_id: str) -> List[LinkGroupResponse]:
        """List all link groups for an app"""
        groups = self.db.query(LinkGroup).join(App).filter(
            LinkGroup.app_id == app_id,
            App.owner_id == user_id
        ).order_by(LinkGroup.sort_order, LinkGroup.name).all()
        
        return [LinkGroupResponse.from_orm(group) for group in groups]
    
    async def add_link_to_group(self, group_id: str, link_id: str, user_id: str, sort_order: int = 0) -> bool:
        """Add a link to a group"""
        # Verify group and link ownership
        group = self.db.query(LinkGroup).join(App).filter(
            LinkGroup.id == group_id,
            App.owner_id == user_id
        ).first()
        
        if not group:
            return False
        
        link = self.db.query(AppLink).filter(
            AppLink.id == link_id,
            AppLink.app_id == group.app_id
        ).first()
        
        if not link:
            return False
        
        # Check if already in group
        existing = self.db.query(LinkGroupItem).filter(
            LinkGroupItem.group_id == group_id,
            LinkGroupItem.link_id == link_id
        ).first()
        
        if existing:
            return False
        
        # Add to group
        group_item = LinkGroupItem(
            group_id=group_id,
            link_id=link_id,
            sort_order=sort_order
        )
        
        self.db.add(group_item)
        self.db.commit()
        
        return True
    
    # Link analytics
    async def track_link_click(
        self,
        link_id: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        referrer: Optional[str] = None
    ) -> bool:
        """Track a link click"""
        link = self.db.query(AppLink).filter(AppLink.id == link_id).first()
        
        if not link:
            return False
        
        # Update link click count
        link.click_count += 1
        link.last_clicked = datetime.utcnow()
        
        # Create analytics record
        analytics = LinkAnalytics(
            link_id=link_id,
            ip_address=ip_address,
            user_agent=user_agent,
            referrer=referrer
        )
        
        self.db.add(analytics)
        self.db.commit()
        
        return True
    
    async def get_link_stats(self, app_id: str, user_id: str) -> LinkStatsResponse:
        """Get link statistics for an app"""
        # Basic stats
        total_links = self.db.query(AppLink).join(App).filter(
            AppLink.app_id == app_id,
            App.owner_id == user_id
        ).count()
        
        active_links = self.db.query(AppLink).join(App).filter(
            AppLink.app_id == app_id,
            App.owner_id == user_id,
            AppLink.is_active == True
        ).count()
        
        total_clicks = self.db.query(func.sum(AppLink.click_count)).join(App).filter(
            AppLink.app_id == app_id,
            App.owner_id == user_id
        ).scalar() or 0
        
        # Time-based stats
        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        clicks_today = self.db.query(LinkAnalytics).join(AppLink).join(App).filter(
            AppLink.app_id == app_id,
            App.owner_id == user_id,
            LinkAnalytics.clicked_at >= today
        ).count()
        
        clicks_this_week = self.db.query(LinkAnalytics).join(AppLink).join(App).filter(
            AppLink.app_id == app_id,
            App.owner_id == user_id,
            LinkAnalytics.clicked_at >= week_ago
        ).count()
        
        clicks_this_month = self.db.query(LinkAnalytics).join(AppLink).join(App).filter(
            AppLink.app_id == app_id,
            App.owner_id == user_id,
            LinkAnalytics.clicked_at >= month_ago
        ).count()
        
        # Top links
        top_links = self.db.query(
            AppLink.id,
            AppLink.title,
            AppLink.url,
            AppLink.click_count
        ).join(App).filter(
            AppLink.app_id == app_id,
            App.owner_id == user_id
        ).order_by(desc(AppLink.click_count)).limit(10).all()
        
        # Recent clicks
        recent_clicks = self.db.query(LinkAnalytics).join(AppLink).join(App).filter(
            AppLink.app_id == app_id,
            App.owner_id == user_id
        ).order_by(desc(LinkAnalytics.clicked_at)).limit(20).all()
        
        return LinkStatsResponse(
            total_links=total_links,
            active_links=active_links,
            total_clicks=total_clicks,
            clicks_today=clicks_today,
            clicks_this_week=clicks_this_week,
            clicks_this_month=clicks_this_month,
            top_links=[
                {
                    "id": str(link.id),
                    "title": link.title,
                    "url": link.url,
                    "clicks": link.click_count
                }
                for link in top_links
            ],
            recent_clicks=[
                {
                    "id": str(click.id),
                    "link_id": str(click.link_id),
                    "clicked_at": click.clicked_at,
                    "ip_address": click.ip_address,
                    "user_agent": click.user_agent,
                    "referrer": click.referrer
                }
                for click in recent_clicks
            ]
        )
    
    # Link redirects
    async def create_redirect(self, app_id: str, user_id: str, data: LinkRedirectCreate) -> LinkRedirectResponse:
        """Create a URL redirect"""
        # Verify app ownership
        app = self.db.query(App).filter(
            App.id == app_id,
            App.owner_id == user_id
        ).first()
        
        if not app:
            raise ValueError("App not found")
        
        redirect = LinkRedirect(
            app_id=app_id,
            **data.dict()
        )
        
        self.db.add(redirect)
        self.db.commit()
        self.db.refresh(redirect)
        
        return LinkRedirectResponse.from_orm(redirect)
    
    async def list_redirects(self, app_id: str, user_id: str) -> List[LinkRedirectResponse]:
        """List all redirects for an app"""
        redirects = self.db.query(LinkRedirect).join(App).filter(
            LinkRedirect.app_id == app_id,
            App.owner_id == user_id
        ).order_by(LinkRedirect.created_at).all()
        
        return [LinkRedirectResponse.from_orm(redirect) for redirect in redirects]