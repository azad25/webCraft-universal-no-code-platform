"""
Custom exceptions for the application
"""

from typing import Optional, Dict, Any


class AppException(Exception):
    """Base application exception"""
    
    def __init__(
        self,
        message: str,
        code: str = "APP_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = code  # For compatibility with handlers
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(AppException):
    """Resource not found"""
    
    def __init__(self, message: str = "Resource not found", details: Dict = None):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=404,
            details=details
        )


class ValidationError(AppException):
    """Validation error"""
    
    def __init__(self, message: str = "Validation failed", details: Dict = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=400,
            details=details
        )


class AuthorizationError(AppException):
    """Authorization error"""
    
    def __init__(self, message: str = "Not authorized", details: Dict = None):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=403,
            details=details
        )


class AuthenticationError(AppException):
    """Authentication error"""
    
    def __init__(self, message: str = "Authentication failed", details: Dict = None):
        super().__init__(
            message=message,
            code="UNAUTHENTICATED",
            status_code=401,
            details=details
        )


class ConflictError(AppException):
    """Conflict error (e.g., duplicate resource)"""
    
    def __init__(self, message: str = "Resource conflict", details: Dict = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=409,
            details=details
        )


class RateLimitError(AppException):
    """Rate limit exceeded"""
    
    def __init__(self, message: str = "Rate limit exceeded", details: Dict = None):
        super().__init__(
            message=message,
            code="RATE_LIMIT",
            status_code=429,
            details=details
        )
