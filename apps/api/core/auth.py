"""
Authentication and Authorization for WebCraft Platform
JWT-based auth with OAuth2 support and API key authentication
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Union
import os
import hashlib
import secrets

from core.database import get_db, User, APIKey

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security schemes
security = HTTPBearer()
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


class AuthService:
    """Authentication service for user management"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password"""
        # Ensure password is never longer than 50 characters to be safe with bcrypt
        if len(password) > 50:
            password = password[:50]
        
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: dict) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not AuthService.verify_password(password, user.hashed_password):
            return None
        return user
    
    @staticmethod
    def create_user(
        db: Session,
        email: str,
        username: str,
        password: str,
        full_name: Optional[str] = None
    ) -> User:
        """Create a new user"""
        # Check if user already exists
        if db.query(User).filter(User.email == email).first():
            raise ValueError("Email already registered")
        
        if db.query(User).filter(User.username == username).first():
            raise ValueError("Username already taken")
        
        # Create user with password length handling
        hashed_password = AuthService.get_password_hash(password)
        user = User(
            email=email,
            username=username,
            full_name=full_name,
            hashed_password=hashed_password
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def create_api_key(
        db: Session,
        user_id: str,
        name: str,
        scopes: list = None,
        rate_limit: int = 1000
    ) -> tuple[str, APIKey]:
        """Create API key for user"""
        # Generate secure API key
        key = f"wc_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        key_prefix = key[:8]
        
        api_key = APIKey(
            name=name,
            key_hash=key_hash,
            key_prefix=key_prefix,
            user_id=user_id,
            scopes=scopes or [],
            rate_limit=rate_limit
        )
        
        db.add(api_key)
        db.commit()
        db.refresh(api_key)
        
        return key, api_key
    
    @staticmethod
    def verify_api_key(db: Session, key: str) -> Optional[APIKey]:
        """Verify API key and return associated API key object"""
        if not key.startswith("wc_"):
            return None
        
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        api_key = db.query(APIKey).filter(
            APIKey.key_hash == key_hash,
            APIKey.is_active == True
        ).first()
        
        if api_key and (not api_key.expires_at or api_key.expires_at > datetime.utcnow()):
            # Update usage statistics
            api_key.last_used = datetime.utcnow()
            api_key.usage_count += 1
            db.commit()
            return api_key
        
        return None


# Dependency functions
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Development bypass - always use admin@test.com user
    if credentials.credentials.startswith("dev-bypass-token") or credentials.credentials == "admin-test-token":
        # Always use admin@test.com for consistency
        admin_user = db.query(User).filter(User.email == "admin@test.com").first()
        if admin_user:
            print(f"🔧 Using admin@test.com user (ID: {admin_user.id})")
            return admin_user
        
        # If admin@test.com doesn't exist, create it
        print("🔧 Creating admin@test.com user...")
        admin_user = User(
            email="admin@test.com",
            username="admin",
            full_name="Admin User",
            hashed_password=AuthService.get_password_hash("12345678"),
            is_verified=True,
            is_premium=True,
            subscription_tier="enterprise"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"✅ Created admin@test.com user (ID: {admin_user.id})")
        return admin_user
    
    try:
        payload = AuthService.verify_token(credentials.credentials)
        if payload is None or payload.get("type") != "access":
            raise credentials_exception
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user


async def get_api_key_user(
    api_key: Optional[str] = Depends(api_key_header),
    db: Session = Depends(get_db)
) -> User:
    """Get user from API key authentication"""
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    
    api_key_obj = AuthService.verify_api_key(db, api_key)
    if not api_key_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    user = db.query(User).filter(User.id == api_key_obj.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    api_key: Optional[str] = Depends(api_key_header),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user (optional) - supports both JWT and API key"""
    try:
        if credentials:
            return await get_current_user(credentials, db)
        elif api_key:
            return await get_api_key_user(api_key, db)
        return None
    except HTTPException:
        return None


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_premium_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current premium user"""
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required"
        )
    return current_user


class RateLimiter:
    """Rate limiting for API endpoints"""
    
    def __init__(self, calls: int, period: int):
        self.calls = calls
        self.period = period
        self.calls_made = {}
    
    def __call__(self, request: Request):
        client_ip = request.client.host
        now = datetime.utcnow()
        
        # Clean old entries
        cutoff = now - timedelta(seconds=self.period)
        self.calls_made = {
            ip: times for ip, times in self.calls_made.items()
            if any(t > cutoff for t in times)
        }
        
        # Check rate limit
        if client_ip in self.calls_made:
            recent_calls = [t for t in self.calls_made[client_ip] if t > cutoff]
            if len(recent_calls) >= self.calls:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded"
                )
            self.calls_made[client_ip] = recent_calls + [now]
        else:
            self.calls_made[client_ip] = [now]


# OAuth2 Integration Classes
class OAuthProvider:
    """Base class for OAuth providers"""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
    
    def get_authorization_url(self) -> str:
        """Get OAuth authorization URL"""
        raise NotImplementedError
    
    def exchange_code_for_token(self, code: str) -> dict:
        """Exchange authorization code for access token"""
        raise NotImplementedError
    
    def get_user_info(self, access_token: str) -> dict:
        """Get user information from OAuth provider"""
        raise NotImplementedError


class GoogleOAuth(OAuthProvider):
    """Google OAuth2 integration"""
    
    def get_authorization_url(self) -> str:
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "openid email profile",
            "response_type": "code",
            "access_type": "offline"
        }
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{base_url}?{query_string}"
    
    def exchange_code_for_token(self, code: str) -> dict:
        # Implementation would use requests to exchange code for token
        # This is a placeholder for the actual implementation
        pass
    
    def get_user_info(self, access_token: str) -> dict:
        # Implementation would fetch user info from Google API
        # This is a placeholder for the actual implementation
        pass


class GitHubOAuth(OAuthProvider):
    """GitHub OAuth2 integration"""
    
    def get_authorization_url(self) -> str:
        base_url = "https://github.com/login/oauth/authorize"
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "user:email"
        }
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{base_url}?{query_string}"