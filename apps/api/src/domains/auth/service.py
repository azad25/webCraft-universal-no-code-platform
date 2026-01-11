"""
Authentication service
"""

from typing import Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import secrets

from src.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token, verify_token
)
from src.common.exceptions import ValidationError, AuthenticationError, NotFoundError
from .models import User, APIKey
from .schemas import UserRegister


class AuthService:
    """Authentication service"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_user(self, data: UserRegister) -> User:
        """Create a new user"""
        # Check if email exists
        if self.db.query(User).filter(User.email == data.email).first():
            raise ValidationError("Email already registered")
        
        # Check if username exists
        if self.db.query(User).filter(User.username == data.username).first():
            raise ValidationError("Username already taken")
        
        user = User(
            email=data.email,
            username=data.username,
            full_name=data.full_name,
            hashed_password=get_password_hash(data.password)
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = self.db.query(User).filter(User.email == email).first()
        
        if not user:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        return user
    
    def get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def create_tokens(self, user: User) -> Tuple[str, str]:
        """Create access and refresh tokens for user"""
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        return access_token, refresh_token
    
    def refresh_tokens(self, refresh_token: str) -> Tuple[str, str, User]:
        """Refresh tokens using refresh token"""
        payload = verify_token(refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            raise AuthenticationError("Invalid refresh token")
        
        user_id = payload.get("sub")
        user = self.get_user_by_id(user_id)
        
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive")
        
        access_token, new_refresh_token = self.create_tokens(user)
        return access_token, new_refresh_token, user
    
    def change_password(self, user: User, current_password: str, new_password: str) -> bool:
        """Change user password"""
        if not verify_password(current_password, user.hashed_password):
            raise ValidationError("Current password is incorrect")
        
        user.hashed_password = get_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        self.db.commit()
        
        return True
    
    def verify_email(self, token: str) -> User:
        """Verify user email with token"""
        payload = verify_token(token)
        
        if not payload or payload.get("type") != "email_verification":
            raise ValidationError("Invalid or expired verification token")
        
        user_id = payload.get("sub")
        user = self.get_user_by_id(user_id)
        
        if not user:
            raise NotFoundError("User not found")
        
        user.is_verified = True
        user.updated_at = datetime.utcnow()
        self.db.commit()
        
        return user
    
    def create_api_key(
        self,
        user: User,
        name: str,
        scopes: list = None,
        rate_limit: int = 1000
    ) -> Tuple[str, APIKey]:
        """Create API key for user"""
        # Generate key
        key = f"wc_{secrets.token_urlsafe(32)}"
        key_hash = get_password_hash(key)
        key_prefix = key[:10]
        
        api_key = APIKey(
            name=name,
            key_hash=key_hash,
            key_prefix=key_prefix,
            scopes=scopes or [],
            rate_limit=rate_limit,
            user_id=user.id
        )
        
        self.db.add(api_key)
        self.db.commit()
        self.db.refresh(api_key)
        
        return key, api_key
    
    def delete_api_key(self, key_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete an API key"""
        api_key = self.db.query(APIKey).filter(
            APIKey.id == key_id,
            APIKey.user_id == user_id
        ).first()
        
        if not api_key:
            raise ValidationError("API key not found")
        
        self.db.delete(api_key)
        self.db.commit()
        
        return True
    
    def request_password_reset(self, email: str) -> bool:
        """Request password reset"""
        user = self.db.query(User).filter(User.email == email).first()
        
        if user:
            # Generate reset token
            import secrets
            token = secrets.token_urlsafe(32)
            
            # In production, save token and send email
            # For now, just return success
            pass
        
        # Always return True for security (don't reveal if email exists)
        return True
    
    def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password with token"""
        from .models import PasswordResetToken, User
        
        # Find valid token
        reset_token = self.db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token,
            PasswordResetToken.is_used == False,
            PasswordResetToken.expires_at > datetime.utcnow()
        ).first()
        
        if not reset_token:
            raise ValidationError("Invalid or expired reset token")
        
        # Validate password
        if len(new_password) < 8:
            raise ValidationError("Password must be at least 8 characters")
        
        # Update user password
        user = self.db.query(User).filter(User.id == reset_token.user_id).first()
        if not user:
            raise NotFoundError("User not found")
        
        user.hashed_password = self.get_password_hash(new_password)
        
        # Mark token as used
        reset_token.is_used = True
        
        self.db.commit()
        return True
    
    def verify_email(self, token: str) -> bool:
        """Verify email with token"""
        from .models import EmailVerificationToken, User
        
        # Find valid token
        verification_token = self.db.query(EmailVerificationToken).filter(
            EmailVerificationToken.token == token,
            EmailVerificationToken.is_used == False,
            EmailVerificationToken.expires_at > datetime.utcnow()
        ).first()
        
        if not verification_token:
            raise ValidationError("Invalid or expired verification token")
        
        # Update user verification status
        user = self.db.query(User).filter(User.id == verification_token.user_id).first()
        if not user:
            raise NotFoundError("User not found")
        
        user.is_verified = True
        
        # Mark token as used
        verification_token.is_used = True
        
        self.db.commit()
        return True
    
    def resend_verification(self, email: str) -> bool:
        """Resend email verification"""
        from .models import User, EmailVerificationToken
        
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            raise NotFoundError("User not found")
        
        if user.is_verified:
            raise ValidationError("Email already verified")
        
        # Create verification token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        verification_token = EmailVerificationToken(
            token=token,
            user_id=user.id,
            expires_at=expires_at
        )
        
        self.db.add(verification_token)
        self.db.commit()
        
        # In production, send email here
        # email_service.send_verification_email(user.email, token)
        
        return True
    
    def request_password_reset(self, email: str) -> bool:
        """Request password reset"""
        from .models import User, PasswordResetToken
        
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            # Don't reveal if email exists
            return True
        
        # Create reset token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        
        reset_token = PasswordResetToken(
            token=token,
            user_id=user.id,
            expires_at=expires_at
        )
        
        self.db.add(reset_token)
        self.db.commit()
        
        # In production, send email here
        # email_service.send_password_reset_email(user.email, token)
        
        return True
        """Resend verification email"""
        user = self.db.query(User).filter(User.email == email).first()
        
        if user and not user.is_verified:
            # In production, send verification email
            # For now, just return success
            pass
        
        return True
    
    def validate_api_key(self, key: str) -> Optional[APIKey]:
        """Validate API key and return associated key object"""
        key_prefix = key[:10]
        
        api_keys = self.db.query(APIKey).filter(
            APIKey.key_prefix == key_prefix,
            APIKey.is_active == True
        ).all()
        
        for api_key in api_keys:
            if verify_password(key, api_key.key_hash):
                # Update usage
                api_key.last_used = datetime.utcnow()
                api_key.usage_count += 1
                self.db.commit()
                return api_key
        
        return None
