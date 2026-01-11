"""
Authentication API routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import os

from src.core.database import get_db
from src.core.security import get_current_user, get_current_active_user
from src.common.exceptions import ValidationError, AuthenticationError
from .service import AuthService
from .models import User
from .schemas import (
    UserRegister, UserLogin, RefreshTokenRequest,
    ChangePasswordRequest, UpdateProfileRequest,
    APIKeyCreate, UserResponse, TokenResponse, APIKeyResponse,
    PasswordResetRequest, PasswordResetConfirm, OAuthURLResponse
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(
    data: UserRegister,
    db: Session = Depends(get_db)
):
    """Register a new user account"""
    if not data.terms_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Terms and conditions must be accepted"
        )
    
    try:
        service = AuthService(db)
        user = service.create_user(data)
        
        # Auto-verify in development
        if os.getenv("ENVIRONMENT") == "development":
            user.is_verified = True
            db.commit()
            db.refresh(user)
        
        access_token, refresh_token = service.create_tokens(user)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=1800,
            user=UserResponse.model_validate(user)
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLogin,
    db: Session = Depends(get_db)
):
    """Login with email and password"""
    service = AuthService(db)
    user = service.authenticate(data.email, data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")
    
    if not user.is_verified and os.getenv("ENVIRONMENT") != "development":
        raise HTTPException(status_code=400, detail="Please verify your email")
    
    access_token, refresh_token = service.create_tokens(user)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=1800,
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token"""
    try:
        service = AuthService(db)
        access_token, refresh_token, user = service.refresh_tokens(data.refresh_token)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=1800,
            user=UserResponse.model_validate(user)
        )
    except AuthenticationError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    try:
        service = AuthService(db)
        service.change_password(current_user, data.current_password, data.new_password)
        return {"message": "Password changed successfully"}
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api-keys", response_model=list[APIKeyResponse])
async def list_api_keys(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List user's API keys"""
    from .models import APIKey
    
    api_keys = db.query(APIKey).filter(
        APIKey.user_id == current_user.id,
        APIKey.is_active == True
    ).all()
    
    return [APIKeyResponse.model_validate(key) for key in api_keys]


@router.post("/api-keys")
async def create_api_key(
    data: APIKeyCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new API key"""
    service = AuthService(db)
    key, api_key = service.create_api_key(
        user=current_user,
        name=data.name,
        scopes=data.scopes,
        rate_limit=data.rate_limit
    )
    
    return {
        "message": "API key created successfully",
        "api_key": key,
        "key_info": APIKeyResponse.model_validate(api_key)
    }


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user"""
    return {"message": "Logged out successfully"}


# Additional V1 endpoints
@router.post("/forgot-password")
async def forgot_password(
    data: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    service = AuthService(db)
    try:
        result = service.request_password_reset(data.email)
        return {"message": "Password reset email sent if account exists"}
    except Exception as e:
        # Always return success for security
        return {"message": "Password reset email sent if account exists"}


@router.post("/reset-password")
async def reset_password(
    data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Reset password with token"""
    service = AuthService(db)
    try:
        service.reset_password(data.token, data.new_password)
        return {"message": "Password reset successfully"}
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-email/{token}")
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """Verify email address"""
    service = AuthService(db)
    try:
        service.verify_email(token)
        return {"message": "Email verified successfully"}
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/resend-verification")
async def resend_verification(
    data: PasswordResetRequest,  # Reuse schema for email
    db: Session = Depends(get_db)
):
    """Resend verification email"""
    service = AuthService(db)
    try:
        service.resend_verification(data.email)
        return {"message": "Verification email sent if account exists"}
    except Exception as e:
        return {"message": "Verification email sent if account exists"}


@router.get("/oauth/{provider}/url")
async def get_oauth_url(
    provider: str,
    redirect_uri: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get OAuth authorization URL"""
    if provider not in ["google", "github", "microsoft"]:
        raise HTTPException(status_code=400, detail="Unsupported OAuth provider")
    
    # Generate OAuth URL (mock implementation)
    import secrets
    state = secrets.token_urlsafe(32)
    
    oauth_urls = {
        "google": f"https://accounts.google.com/oauth/authorize?state={state}",
        "github": f"https://github.com/login/oauth/authorize?state={state}",
        "microsoft": f"https://login.microsoftonline.com/oauth/authorize?state={state}"
    }
    
    return OAuthURLResponse(
        authorization_url=oauth_urls[provider],
        state=state
    )


@router.post("/oauth/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    """Handle OAuth callback"""
    # Mock OAuth implementation
    service = AuthService(db)
    
    # In production, this would validate the OAuth code and create/login user
    # For now, return a mock response
    
    return {
        "message": f"OAuth {provider} callback received",
        "code": code,
        "state": state
    }


@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an API key"""
    service = AuthService(db)
    try:
        service.delete_api_key(key_id, current_user.id)
        return {"message": "API key deleted successfully"}
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/test-email")
async def test_email(
    db: Session = Depends(get_db)
):
    """Test email functionality (development only)"""
    import os
    if os.getenv("ENVIRONMENT") != "development":
        raise HTTPException(status_code=404, detail="Not found")
    
    return {
        "success": True,
        "message": "Email test endpoint available in development"
    }


@router.post("/dev-verify-user")
async def dev_verify_user(
    email: str,
    db: Session = Depends(get_db)
):
    """Verify user in development (development only)"""
    import os
    if os.getenv("ENVIRONMENT") != "development":
        raise HTTPException(status_code=404, detail="Not found")
    
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.is_verified = True
        db.commit()
        return {"message": f"User {email} verified successfully"}
    else:
        raise HTTPException(status_code=404, detail="User not found")
