"""
Authentication API Routes
User registration, login, OAuth, and API key management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, timedelta
import uuid

from core.database import get_db, User
from core.auth import AuthService, get_current_user, get_current_active_user, RateLimiter
from services.email_service import EmailService
from services.oauth_service import OAuthService

router = APIRouter()

# Rate limiters
login_limiter = RateLimiter(calls=5, period=300)  # 5 attempts per 5 minutes
register_limiter = RateLimiter(calls=3, period=3600)  # 3 registrations per hour

# Pydantic models
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, regex="^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = Field(None, max_length=255)
    terms_accepted: bool = Field(..., description="Must accept terms and conditions")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    full_name: Optional[str]
    is_verified: bool
    is_premium: bool
    subscription_tier: str
    avatar_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    scopes: Optional[list[str]] = Field(default_factory=list)
    rate_limit: Optional[int] = Field(1000, ge=100, le=10000)

class APIKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    key_prefix: str
    scopes: list[str]
    rate_limit: int
    created_at: datetime
    last_used: Optional[datetime]
    usage_count: int
    
    class Config:
        from_attributes = True

class OAuthURLResponse(BaseModel):
    authorization_url: str
    state: str

class OAuthCallbackRequest(BaseModel):
    code: str
    state: str
    provider: str


@router.post("/register", response_model=TokenResponse)
async def register(
    user_data: UserRegister,
    request: Request,
    db: Session = Depends(get_db),
    _: None = Depends(register_limiter)
):
    """
    Register a new user account
    
    Creates a new user with email verification. Returns access and refresh tokens
    for immediate login after successful registration.
    """
    
    if not user_data.terms_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Terms and conditions must be accepted"
        )
    
    try:
        # Create user
        user = AuthService.create_user(
            db=db,
            email=user_data.email,
            username=user_data.username,
            password=user_data.password,
            full_name=user_data.full_name
        )
        
        # Send verification email
        email_service = EmailService()
        await email_service.send_verification_email(user.email, user.id)
        
        # Create tokens
        access_token = AuthService.create_access_token(data={"sub": str(user.id)})
        refresh_token = AuthService.create_refresh_token(data={"sub": str(user.id)})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=1800,  # 30 minutes
            user=UserResponse.from_orm(user)
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    user_credentials: UserLogin,
    request: Request,
    db: Session = Depends(get_db),
    _: None = Depends(login_limiter)
):
    """
    Login with email and password
    
    Authenticates user and returns access and refresh tokens.
    """
    
    user = AuthService.authenticate_user(
        db, user_credentials.email, user_credentials.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated"
        )
    
    # Create tokens
    access_token = AuthService.create_access_token(data={"sub": str(user.id)})
    refresh_token = AuthService.create_refresh_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=1800,  # 30 minutes
        user=UserResponse.from_orm(user)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    
    Validates refresh token and issues new access and refresh tokens.
    """
    
    payload = AuthService.verify_token(token_data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new tokens
    access_token = AuthService.create_access_token(data={"sub": str(user.id)})
    refresh_token = AuthService.create_refresh_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=1800,
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user information
    
    Returns detailed information about the authenticated user.
    """
    return UserResponse.from_orm(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    profile_data: UpdateProfileRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile
    
    Updates user profile information like full name and avatar.
    """
    
    update_data = profile_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.from_orm(current_user)


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    
    Requires current password for verification before setting new password.
    """
    
    if not AuthService.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_user.hashed_password = AuthService.get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
async def forgot_password(
    reset_data: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset
    
    Sends password reset email to the user if email exists.
    """
    
    user = db.query(User).filter(User.email == reset_data.email).first()
    
    if user:
        email_service = EmailService()
        await email_service.send_password_reset_email(user.email, user.id)
    
    # Always return success to prevent email enumeration
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Reset password with token
    
    Validates reset token and sets new password.
    """
    
    # Verify reset token (implementation depends on token generation strategy)
    payload = AuthService.verify_token(reset_data.token)
    if not payload or payload.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    
    user.hashed_password = AuthService.get_password_hash(reset_data.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password reset successfully"}


# API Key Management
@router.get("/api-keys", response_model=list[APIKeyResponse])
async def list_api_keys(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List user's API keys
    
    Returns all API keys created by the current user.
    """
    
    api_keys = db.query(APIKey).filter(
        APIKey.user_id == current_user.id,
        APIKey.is_active == True
    ).all()
    
    return [APIKeyResponse.from_orm(key) for key in api_keys]


@router.post("/api-keys")
async def create_api_key(
    key_data: APIKeyCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create new API key
    
    Generates a new API key for programmatic access to the platform.
    """
    
    key, api_key = AuthService.create_api_key(
        db=db,
        user_id=current_user.id,
        name=key_data.name,
        scopes=key_data.scopes,
        rate_limit=key_data.rate_limit
    )
    
    return {
        "message": "API key created successfully",
        "api_key": key,  # Only shown once
        "key_info": APIKeyResponse.from_orm(api_key)
    }


@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete API key
    
    Deactivates the specified API key.
    """
    
    api_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id
    ).first()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    api_key.is_active = False
    api_key.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "API key deleted successfully"}


# OAuth Routes
@router.get("/oauth/{provider}/url", response_model=OAuthURLResponse)
async def get_oauth_url(provider: str):
    """
    Get OAuth authorization URL
    
    Returns the authorization URL for the specified OAuth provider.
    """
    
    oauth_service = OAuthService()
    
    try:
        auth_url, state = oauth_service.get_authorization_url(provider)
        return OAuthURLResponse(authorization_url=auth_url, state=state)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/oauth/callback", response_model=TokenResponse)
async def oauth_callback(
    callback_data: OAuthCallbackRequest,
    db: Session = Depends(get_db)
):
    """
    Handle OAuth callback
    
    Processes OAuth callback and creates or logs in user.
    """
    
    oauth_service = OAuthService()
    
    try:
        user_info = await oauth_service.handle_callback(
            provider=callback_data.provider,
            code=callback_data.code,
            state=callback_data.state
        )
        
        # Find or create user
        user = db.query(User).filter(User.email == user_info["email"]).first()
        
        if not user:
            # Create new user from OAuth
            user = User(
                email=user_info["email"],
                username=user_info.get("username", user_info["email"].split("@")[0]),
                full_name=user_info.get("name"),
                is_verified=True,  # OAuth emails are pre-verified
                avatar_url=user_info.get("avatar_url")
            )
            
            # Set OAuth provider ID
            if callback_data.provider == "google":
                user.google_id = user_info["id"]
            elif callback_data.provider == "github":
                user.github_id = user_info["id"]
            
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create tokens
        access_token = AuthService.create_access_token(data={"sub": str(user.id)})
        refresh_token = AuthService.create_refresh_token(data={"sub": str(user.id)})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=1800,
            user=UserResponse.from_orm(user)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth authentication failed: {str(e)}"
        )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout user
    
    In a stateless JWT system, logout is handled client-side by removing tokens.
    This endpoint can be used for logging purposes or token blacklisting if implemented.
    """
    
    return {"message": "Logged out successfully"}


@router.post("/verify-email/{token}")
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verify email address
    
    Validates email verification token and marks user as verified.
    """
    
    payload = AuthService.verify_token(token)
    if not payload or payload.get("type") != "email_verification":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    
    user.is_verified = True
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Email verified successfully"}