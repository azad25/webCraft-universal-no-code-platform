"""
Preview domain service
"""

from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import secrets
import os

from src.common.exceptions import NotFoundError


class PreviewService:
    """Service for managing app previews"""
    
    def __init__(self, db: Session):
        self.db = db
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.preview_domain = os.getenv("PREVIEW_DOMAIN", "preview.webcraft.dev")
        self.preview_base_url = os.getenv("PREVIEW_BASE_URL", "http://localhost:3000")
        self._preview_cache: Dict[str, Dict] = {}  # In-memory cache for dev
    
    async def create_preview_url(
        self,
        app,
        device: str = "desktop"
    ) -> Dict[str, Any]:
        """Create a preview URL for an app"""
        # Generate secure token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        # Store preview data
        preview_data = {
            "app_id": str(app.id),
            "device": device,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": expires_at.isoformat()
        }
        
        # Store in cache (in production, use Redis)
        self._preview_cache[token] = preview_data
        
        # Generate URLs
        if self.environment == "development":
            base_url = "http://localhost:3000"
        else:
            base_url = f"https://{self.preview_domain}"
        
        preview_url = f"{base_url}/preview/{token}"
        mobile_url = f"{preview_url}?device=mobile"
        qr_code_url = f"{self.preview_base_url}/api/v2/preview/{token}/qr"
        
        return {
            "token": token,
            "url": preview_url,
            "mobile_url": mobile_url,
            "qr_code_url": qr_code_url,
            "expires_at": expires_at.isoformat(),
            "device": device
        }
    
    async def get_preview_data(self, token: str) -> Optional[Dict[str, Any]]:
        """Get preview data by token"""
        preview_data = self._preview_cache.get(token)
        
        if not preview_data:
            return None
        
        # Check expiration
        expires_at = datetime.fromisoformat(preview_data["expires_at"])
        if datetime.utcnow() > expires_at:
            del self._preview_cache[token]
            return None
        
        return preview_data
    
    async def get_app_preview_sessions(self, app_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Get all active preview sessions for an app"""
        sessions = []
        app_id_str = str(app_id)
        
        for token, data in list(self._preview_cache.items()):
            if data.get("app_id") == app_id_str:
                expires_at = datetime.fromisoformat(data["expires_at"])
                if datetime.utcnow() <= expires_at:
                    sessions.append({
                        "token": token,
                        "device": data.get("device", "desktop"),
                        "created_at": data.get("created_at"),
                        "expires_at": data.get("expires_at"),
                        "is_active": True
                    })
        
        return sessions
    
    async def revoke_preview(self, token: str) -> bool:
        """Revoke a preview session"""
        if token in self._preview_cache:
            del self._preview_cache[token]
            return True
        return False
    
    async def cleanup_expired_previews(self) -> int:
        """Clean up expired preview sessions"""
        cleaned = 0
        now = datetime.utcnow()
        
        for token in list(self._preview_cache.keys()):
            data = self._preview_cache.get(token)
            if data:
                expires_at = datetime.fromisoformat(data["expires_at"])
                if now > expires_at:
                    del self._preview_cache[token]
                    cleaned += 1
        
        return cleaned
    
    def get_iframe_embed_code(
        self,
        token: str,
        width: str = "100%",
        height: str = "600px"
    ) -> str:
        """Generate iframe embed code"""
        if self.environment == "development":
            embed_url = f"http://localhost:3000/preview/{token}/embed"
        else:
            embed_url = f"https://{self.preview_domain}/preview/{token}/embed"
        
        return f'<iframe src="{embed_url}" width="{width}" height="{height}" frameborder="0" allowfullscreen></iframe>'
