"""
OAuth Service for WebCraft Platform
Handles Google, Apple, and GitHub OAuth authentication
"""

from typing import Dict, Any, Optional, Tuple
import httpx
import jwt
from datetime import datetime, timedelta
import secrets
import hashlib
from urllib.parse import urlencode

from core.config import settings
from core.logging import get_logger
from core.redis_client import redis_client

logger = get_logger(__name__)


class OAuthProvider:
    """Base OAuth provider class"""
    
    def __init__(self):
        self.state_ttl = 600  # 10 minutes
    
    async def generate_state(self) -> str:
        """Generate and store OAuth state for CSRF protection"""
        state = secrets.token_urlsafe(32)
        await redis_client.set(
            f"oauth:state:{state}",
            {"created_at": datetime.utcnow().isoformat()},
            ttl=self.state_ttl
        )
        return state
    
    async def verify_state(self, state: str) -> bool:
        """Verify OAuth state"""
        key = f"oauth:state:{state}"
        data = await redis_client.get(key)
        if data:
            await redis_client.delete(key)
            return True
        return False
    
    def get_authorization_url(self) -> Tuple[str, str]:
        """Get authorization URL - to be implemented by subclasses"""
        raise NotImplementedError
    
    async def exchange_code(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens"""
        raise NotImplementedError
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from provider"""
        raise NotImplementedError


class GoogleOAuthProvider(OAuthProvider):
    """Google OAuth 2.0 implementation"""
    
    def __init__(self):
        super().__init__()
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = f"https://{settings.BASE_DOMAIN}/api/v1/auth/oauth/google/callback"
        
        # Google OAuth endpoints
        self.auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
        self.token_url = "https://oauth2.googleapis.com/token"
        self.userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
    
    async def get_authorization_url(self) -> Tuple[str, str]:
        """Generate Google OAuth authorization URL"""
        state = await self.generate_state()
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent",
            "state": state
        }
        
        url = f"{self.auth_url}?{urlencode(params)}"
        return url, state
    
    async def exchange_code(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for Google tokens"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Google token exchange failed: {response.text}")
                raise ValueError("Failed to exchange authorization code")
            
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user info from Google"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if response.status_code != 200:
                logger.error(f"Google userinfo failed: {response.text}")
                raise ValueError("Failed to get user info")
            
            data = response.json()
            
            return {
                "id": data["sub"],
                "email": data["email"],
                "email_verified": data.get("email_verified", False),
                "name": data.get("name"),
                "given_name": data.get("given_name"),
                "family_name": data.get("family_name"),
                "picture": data.get("picture"),
                "provider": "google"
            }


class AppleOAuthProvider(OAuthProvider):
    """Apple Sign In implementation"""
    
    def __init__(self):
        super().__init__()
        self.client_id = settings.APPLE_CLIENT_ID
        self.team_id = settings.APPLE_TEAM_ID
        self.key_id = settings.APPLE_KEY_ID
        self.private_key = settings.APPLE_PRIVATE_KEY
        self.redirect_uri = f"https://{settings.BASE_DOMAIN}/api/v1/auth/oauth/apple/callback"
        
        # Apple OAuth endpoints
        self.auth_url = "https://appleid.apple.com/auth/authorize"
        self.token_url = "https://appleid.apple.com/auth/token"
    
    def _generate_client_secret(self) -> str:
        """Generate Apple client secret JWT"""
        now = datetime.utcnow()
        
        headers = {
            "alg": "ES256",
            "kid": self.key_id
        }
        
        payload = {
            "iss": self.team_id,
            "iat": now,
            "exp": now + timedelta(days=180),
            "aud": "https://appleid.apple.com",
            "sub": self.client_id
        }
        
        return jwt.encode(
            payload,
            self.private_key,
            algorithm="ES256",
            headers=headers
        )
    
    async def get_authorization_url(self) -> Tuple[str, str]:
        """Generate Apple Sign In authorization URL"""
        state = await self.generate_state()
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code id_token",
            "response_mode": "form_post",
            "scope": "name email",
            "state": state
        }
        
        url = f"{self.auth_url}?{urlencode(params)}"
        return url, state
    
    async def exchange_code(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for Apple tokens"""
        client_secret = self._generate_client_secret()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data={
                    "client_id": self.client_id,
                    "client_secret": client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Apple token exchange failed: {response.text}")
                raise ValueError("Failed to exchange authorization code")
            
            return response.json()
    
    async def get_user_info(self, id_token: str) -> Dict[str, Any]:
        """Decode Apple ID token to get user info"""
        # Apple doesn't have a userinfo endpoint, info is in the ID token
        # Decode without verification for user info (token already verified)
        decoded = jwt.decode(id_token, options={"verify_signature": False})
        
        return {
            "id": decoded["sub"],
            "email": decoded.get("email"),
            "email_verified": decoded.get("email_verified", False),
            "name": None,  # Apple only provides name on first sign-in
            "provider": "apple"
        }


class GitHubOAuthProvider(OAuthProvider):
    """GitHub OAuth implementation"""
    
    def __init__(self):
        super().__init__()
        self.client_id = settings.GITHUB_CLIENT_ID
        self.client_secret = settings.GITHUB_CLIENT_SECRET
        self.redirect_uri = f"https://{settings.BASE_DOMAIN}/api/v1/auth/oauth/github/callback"
        
        # GitHub OAuth endpoints
        self.auth_url = "https://github.com/login/oauth/authorize"
        self.token_url = "https://github.com/login/oauth/access_token"
        self.userinfo_url = "https://api.github.com/user"
        self.emails_url = "https://api.github.com/user/emails"
    
    async def get_authorization_url(self) -> Tuple[str, str]:
        """Generate GitHub OAuth authorization URL"""
        state = await self.generate_state()
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "user:email read:user",
            "state": state
        }
        
        url = f"{self.auth_url}?{urlencode(params)}"
        return url, state
    
    async def exchange_code(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for GitHub tokens"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri
                },
                headers={"Accept": "application/json"}
            )
            
            if response.status_code != 200:
                logger.error(f"GitHub token exchange failed: {response.text}")
                raise ValueError("Failed to exchange authorization code")
            
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user info from GitHub"""
        async with httpx.AsyncClient() as client:
            # Get user profile
            response = await client.get(
                self.userinfo_url,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"GitHub userinfo failed: {response.text}")
                raise ValueError("Failed to get user info")
            
            user_data = response.json()
            
            # Get primary email
            email_response = await client.get(
                self.emails_url,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            
            email = None
            email_verified = False
            
            if email_response.status_code == 200:
                emails = email_response.json()
                for e in emails:
                    if e.get("primary"):
                        email = e["email"]
                        email_verified = e.get("verified", False)
                        break
            
            return {
                "id": str(user_data["id"]),
                "email": email or user_data.get("email"),
                "email_verified": email_verified,
                "name": user_data.get("name"),
                "username": user_data.get("login"),
                "avatar_url": user_data.get("avatar_url"),
                "provider": "github"
            }


class OAuthService:
    """
    Unified OAuth service for all providers
    """
    
    def __init__(self):
        self.providers = {
            "google": GoogleOAuthProvider(),
            "apple": AppleOAuthProvider(),
            "github": GitHubOAuthProvider()
        }
    
    def get_provider(self, provider_name: str) -> OAuthProvider:
        """Get OAuth provider by name"""
        provider = self.providers.get(provider_name.lower())
        if not provider:
            raise ValueError(f"Unsupported OAuth provider: {provider_name}")
        return provider
    
    def get_authorization_url(self, provider_name: str) -> Tuple[str, str]:
        """Get authorization URL for provider"""
        provider = self.get_provider(provider_name)
        return provider.get_authorization_url()
    
    async def handle_callback(
        self,
        provider_name: str,
        code: str,
        state: str
    ) -> Dict[str, Any]:
        """
        Handle OAuth callback
        
        Args:
            provider_name: OAuth provider name
            code: Authorization code
            state: OAuth state for CSRF verification
        
        Returns:
            User information from provider
        """
        provider = self.get_provider(provider_name)
        
        # Verify state
        if not await provider.verify_state(state):
            raise ValueError("Invalid OAuth state")
        
        # Exchange code for tokens
        tokens = await provider.exchange_code(code)
        
        # Get user info
        if provider_name == "apple":
            # Apple uses ID token for user info
            user_info = await provider.get_user_info(tokens.get("id_token"))
        else:
            user_info = await provider.get_user_info(tokens.get("access_token"))
        
        # Store refresh token if available
        if tokens.get("refresh_token"):
            await redis_client.set(
                f"oauth:refresh:{provider_name}:{user_info['id']}",
                tokens["refresh_token"],
                ttl=86400 * 30  # 30 days
            )
        
        logger.info(
            f"OAuth authentication successful",
            provider=provider_name,
            user_id=user_info["id"]
        )
        
        return user_info
    
    async def refresh_token(
        self,
        provider_name: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Refresh OAuth tokens if available"""
        refresh_token = await redis_client.get(
            f"oauth:refresh:{provider_name}:{user_id}"
        )
        
        if not refresh_token:
            return None
        
        # Implementation depends on provider
        # Most providers support token refresh
        # This is a placeholder for the actual implementation
        
        return None
    
    def get_supported_providers(self) -> list:
        """Get list of supported OAuth providers"""
        return list(self.providers.keys())


# Global OAuth service instance
oauth_service = OAuthService()