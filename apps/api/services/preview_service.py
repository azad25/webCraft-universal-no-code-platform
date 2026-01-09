"""
Preview Service for WebCraft Platform
Generates temporary preview URLs for apps
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import secrets
from typing import Optional, Dict, Any, List

from core.database import App, PreviewSession


class PreviewService:
    """Service for creating and managing app previews"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def create_preview_url(self, app: App, device: str = "desktop") -> Dict[str, Any]:
        """
        Create a preview URL for an app
        
        Args:
            app: The app to create preview for
            device: Device type (desktop, tablet, mobile)
            
        Returns:
            Dictionary with preview data including URL and token
        """
        
        # Generate unique preview token
        token = str(uuid.uuid4())
        
        # Set expiration (24 hours from now)
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        # Create preview session
        preview_session = PreviewSession(
            token=token,
            device_type=device,
            expires_at=expires_at,
            app_id=app.id,
            access_count=0
        )
        
        self.db.add(preview_session)
        self.db.commit()
        self.db.refresh(preview_session)
        
        # Generate preview URL
        base_url = "http://localhost:3000"  # In production, use actual domain
        preview_url = f"{base_url}/preview/{token}"
        
        if device != "desktop":
            preview_url += f"?device={device}"
        
        return {
            "success": True,
            "token": token,
            "preview_url": preview_url,
            "device_type": device,
            "expires_at": expires_at.isoformat(),
            "valid_for_hours": 24
        }
    
    async def get_preview_session(self, token: str) -> Optional[PreviewSession]:
        """
        Get preview session by token
        
        Args:
            token: Preview token
            
        Returns:
            PreviewSession if valid, None otherwise
        """
        
        session = self.db.query(PreviewSession).filter(
            PreviewSession.token == token,
            PreviewSession.expires_at > datetime.utcnow()
        ).first()
        
        if session:
            # Update access count and last accessed
            session.access_count += 1
            session.last_accessed = datetime.utcnow()
            self.db.commit()
        
        return session
    
    async def cleanup_expired_sessions(self):
        """Clean up expired preview sessions"""
        
        expired_sessions = self.db.query(PreviewSession).filter(
            PreviewSession.expires_at <= datetime.utcnow()
        )
        
        count = expired_sessions.count()
        expired_sessions.delete()
        self.db.commit()
        
        return count
    
    async def get_preview_data(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Get preview data by token
        
        Args:
            token: Preview token
            
        Returns:
            Dictionary with preview data if valid, None otherwise
        """
        
        session = await self.get_preview_session(token)
        if not session:
            return None
        
        return {
            "app_id": session.app_id,
            "device_type": session.device_type,
            "expires_at": session.expires_at.isoformat(),
            "access_count": session.access_count
        }
    
    async def get_app_preview_sessions(self, app_id: str) -> List[Dict[str, Any]]:
        """Get all active preview sessions for an app"""
        
        sessions = self.db.query(PreviewSession).filter(
            PreviewSession.app_id == app_id,
            PreviewSession.expires_at > datetime.utcnow()
        ).all()
        
        return [
            {
                "token": session.token,
                "device_type": session.device_type,
                "expires_at": session.expires_at.isoformat(),
                "access_count": session.access_count,
                "last_accessed": session.last_accessed.isoformat() if session.last_accessed else None,
                "created_at": session.created_at.isoformat()
            }
            for session in sessions
        ]
    
    async def revoke_preview(self, token: str) -> bool:
        """Revoke a preview session"""
        
        session = self.db.query(PreviewSession).filter(
            PreviewSession.token == token
        ).first()
        
        if session:
            self.db.delete(session)
            self.db.commit()
            return True
        
        return False
    
    def get_iframe_embed_code(self, token: str, width: str = "100%", height: str = "600px") -> str:
        """Generate iframe embed code for preview"""
        
        base_url = "http://localhost:3000"  # In production, use actual domain
        embed_url = f"{base_url}/preview/{token}/embed"
        
        return f'''<iframe 
    src="{embed_url}" 
    width="{width}" 
    height="{height}" 
    frameborder="0" 
    allowfullscreen
    style="border: 1px solid #ddd; border-radius: 8px;">
</iframe>'''
    
    async def get_app_preview_data(self, app: App, device: str = "desktop") -> Dict[str, Any]:
        """
        Get app data formatted for preview
        
        Args:
            app: The app to get preview data for
            device: Device type for responsive preview
            
        Returns:
            Dictionary with app preview data
        """
        
        # Get app pages
        pages = []
        for page in app.pages:
            if page.is_published:
                pages.append({
                    "id": str(page.id),
                    "title": page.title,
                    "slug": page.slug,
                    "content": page.content,
                    "meta_title": page.meta_title,
                    "meta_description": page.meta_description,
                    "is_homepage": page.is_homepage
                })
        
        # Get app widgets
        widgets = []
        for widget in app.widgets:
            widgets.append({
                "id": str(widget.id),
                "widget_id": str(widget.widget_id),
                "config": widget.config,
                "position": widget.position,
                "page_id": str(widget.page_id) if widget.page_id else None
            })
        
        return {
            "app": {
                "id": str(app.id),
                "name": app.name,
                "slug": app.slug,
                "description": app.description,
                "app_type": app.app_type,
                "config": app.config,
                "theme_config": app.theme_config,
                "seo_config": app.seo_config
            },
            "pages": pages,
            "widgets": widgets,
            "device": device,
            "preview_mode": True
        }