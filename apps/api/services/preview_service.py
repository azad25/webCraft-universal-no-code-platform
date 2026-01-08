"""
Preview Service
Handles app preview URLs for development and production environments
"""

import os
import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from core.database import App, PreviewSession
from core.redis_client import get_redis_client


class PreviewService:
    """Service for managing app preview URLs and sessions"""
    
    def __init__(self, db: Session):
        self.db = db
        self.redis = get_redis_client()
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.preview_base_url = os.getenv("PREVIEW_BASE_URL", "http://localhost")
        self.preview_domain = os.getenv("PREVIEW_DOMAIN", "preview.webcraft.local")
        self.api_url = os.getenv("API_URL", "http://localhost:8000")
        
    async def create_preview_url(self, app: App, device: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a preview URL for an app
        
        Args:
            app: The app to create preview for
            device: Optional device type (mobile, tablet, desktop)
            
        Returns:
            Dictionary with preview URL and metadata
        """
        
        # Generate preview session
        preview_token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        # Store preview session in Redis for fast access
        preview_data = {
            "app_id": str(app.id),
            "app_slug": app.slug,
            "owner_id": str(app.owner_id),
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": expires_at.isoformat(),
            "device": device or "desktop"
        }
        
        # Store in Redis with 24-hour expiration
        import json
        await self.redis.setex(
            f"preview:{preview_token}",
            86400,  # 24 hours
            json.dumps(preview_data)
        )
        
        # Also store in database for persistence
        preview_session = PreviewSession(
            id=uuid.uuid4(),
            app_id=app.id,
            token=preview_token,
            device_type=device or "desktop",
            expires_at=expires_at
        )
        
        self.db.add(preview_session)
        self.db.commit()
        
        # Generate preview URLs based on environment
        if self.environment == "development":
            preview_url = self._generate_dev_preview_url(app, preview_token, device)
        else:
            preview_url = self._generate_prod_preview_url(app, preview_token, device)
        
        return {
            "preview_url": preview_url,
            "token": preview_token,
            "expires_at": expires_at.isoformat(),
            "expires_in_hours": 24,
            "device": device or "desktop",
            "mobile_preview": self._get_device_preview_url(app, preview_token, "mobile"),
            "tablet_preview": self._get_device_preview_url(app, preview_token, "tablet"),
            "desktop_preview": self._get_device_preview_url(app, preview_token, "desktop"),
            "qr_code_url": f"{self.api_url}/api/v1/preview/{preview_token}/qr"
        }
    
    def _generate_dev_preview_url(self, app: App, token: str, device: Optional[str] = None) -> str:
        """Generate preview URL for development environment"""
        base_url = "http://localhost:3000"  # Next.js dev server
        device_param = f"&device={device}" if device else ""
        return f"{base_url}/preview/{token}?app_id={app.id}{device_param}"
    
    def _generate_prod_preview_url(self, app: App, token: str, device: Optional[str] = None) -> str:
        """Generate preview URL for production environment"""
        device_param = f"&device={device}" if device else ""
        return f"https://{self.preview_domain}/preview/{token}?app_id={app.id}{device_param}"
    
    def _get_device_preview_url(self, app: App, token: str, device: str) -> str:
        """Get preview URL for specific device"""
        if self.environment == "development":
            return f"http://localhost:3000/preview/{token}?app_id={app.id}&device={device}"
        else:
            return f"https://{self.preview_domain}/preview/{token}?app_id={app.id}&device={device}"
    
    async def get_preview_data(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Get preview data by token
        
        Args:
            token: Preview token
            
        Returns:
            Preview data if valid, None if expired or not found
        """
        
        # Try Redis first for fast access
        preview_data = await self.redis.get(f"preview:{token}")
        if preview_data:
            import json
            return json.loads(preview_data)  # Convert string back to dict
        
        # Fallback to database
        preview_session = self.db.query(PreviewSession).filter(
            PreviewSession.token == token,
            PreviewSession.expires_at > datetime.utcnow()
        ).first()
        
        if not preview_session:
            return None
        
        # Get app data
        app = self.db.query(App).filter(App.id == preview_session.app_id).first()
        if not app:
            return None
        
        return {
            "app_id": str(app.id),
            "app_slug": app.slug,
            "owner_id": str(app.owner_id),
            "device": preview_session.device_type,
            "expires_at": preview_session.expires_at.isoformat()
        }
    
    async def validate_preview_token(self, token: str) -> bool:
        """
        Validate if preview token is still valid
        
        Args:
            token: Preview token to validate
            
        Returns:
            True if valid, False otherwise
        """
        
        preview_data = await self.get_preview_data(token)
        return preview_data is not None
    
    async def cleanup_expired_previews(self):
        """Clean up expired preview sessions from database"""
        
        expired_sessions = self.db.query(PreviewSession).filter(
            PreviewSession.expires_at < datetime.utcnow()
        ).all()
        
        for session in expired_sessions:
            # Remove from Redis
            await self.redis.delete(f"preview:{session.token}")
            # Remove from database
            self.db.delete(session)
        
        self.db.commit()
        
        return len(expired_sessions)
    
    async def revoke_preview(self, token: str) -> bool:
        """
        Revoke a preview session
        
        Args:
            token: Preview token to revoke
            
        Returns:
            True if revoked, False if not found
        """
        
        # Remove from Redis
        await self.redis.delete(f"preview:{token}")
        
        # Remove from database
        preview_session = self.db.query(PreviewSession).filter(
            PreviewSession.token == token
        ).first()
        
        if preview_session:
            self.db.delete(preview_session)
            self.db.commit()
            return True
        
        return False
    
    async def get_app_preview_sessions(self, app_id: uuid.UUID) -> list:
        """
        Get all active preview sessions for an app
        
        Args:
            app_id: App ID
            
        Returns:
            List of active preview sessions
        """
        
        sessions = self.db.query(PreviewSession).filter(
            PreviewSession.app_id == app_id,
            PreviewSession.expires_at > datetime.utcnow()
        ).all()
        
        return [
            {
                "token": session.token,
                "device_type": session.device_type,
                "created_at": session.created_at.isoformat(),
                "expires_at": session.expires_at.isoformat(),
                "preview_url": self._get_device_preview_url(
                    type('App', (), {'id': app_id, 'slug': 'preview'})(),
                    session.token,
                    session.device_type
                )
            }
            for session in sessions
        ]
    
    def get_iframe_embed_code(self, token: str, width: str = "100%", height: str = "600px") -> str:
        """
        Generate iframe embed code for preview
        
        Args:
            token: Preview token
            width: Iframe width
            height: Iframe height
            
        Returns:
            HTML iframe code
        """
        
        if self.environment == "development":
            preview_url = f"http://localhost:3000/preview/{token}/embed"
        else:
            preview_url = f"https://{self.preview_domain}/preview/{token}/embed"
        
        return f'''<iframe 
    src="{preview_url}" 
    width="{width}" 
    height="{height}" 
    frameborder="0" 
    scrolling="auto"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups">
</iframe>'''
    
    async def generate_qr_code_url(self, token: str) -> str:
        """
        Generate QR code URL for mobile preview
        
        Args:
            token: Preview token
            
        Returns:
            QR code image URL
        """
        
        preview_data = await self.get_preview_data(token)
        if not preview_data:
            raise HTTPException(status_code=404, detail="Preview not found")
        
        mobile_url = self._get_device_preview_url(
            type('App', (), {'id': preview_data['app_id'], 'slug': preview_data['app_slug']})(),
            token,
            "mobile"
        )
        
        # Generate QR code using external service or library
        qr_api_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={mobile_url}"
        
        return qr_api_url