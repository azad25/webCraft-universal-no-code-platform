"""
Structured Logging Configuration
Production-grade logging with JSON formatting and correlation IDs
"""

import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict, Optional
from contextvars import ContextVar
import traceback
import uuid

from core.config import settings

# Context variable for request correlation
correlation_id_var: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)
request_context_var: ContextVar[Dict[str, Any]] = ContextVar('request_context', default={})


def get_correlation_id() -> str:
    """Get or create correlation ID for request tracing"""
    cid = correlation_id_var.get()
    if cid is None:
        cid = str(uuid.uuid4())
        correlation_id_var.set(cid)
    return cid


def set_correlation_id(cid: str) -> None:
    """Set correlation ID for current context"""
    correlation_id_var.set(cid)


def set_request_context(context: Dict[str, Any]) -> None:
    """Set request context for logging"""
    request_context_var.set(context)


class JSONFormatter(logging.Formatter):
    """
    JSON log formatter for structured logging
    Compatible with ELK stack, CloudWatch, and other log aggregators
    """
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "correlation_id": get_correlation_id(),
            "service": settings.APP_NAME,
            "environment": settings.ENVIRONMENT,
        }
        
        # Add request context if available
        request_context = request_context_var.get()
        if request_context:
            log_data["request"] = request_context
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": traceback.format_exception(*record.exc_info)
            }
        
        # Add extra fields
        if hasattr(record, 'extra_data'):
            log_data["extra"] = record.extra_data
        
        return json.dumps(log_data, default=str)


class DevelopmentFormatter(logging.Formatter):
    """
    Human-readable formatter for development
    """
    
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        
        # Format timestamp
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        
        # Build message
        message = f"{color}{timestamp} | {record.levelname:8} | {record.name} | {record.getMessage()}{self.RESET}"
        
        # Add correlation ID
        cid = get_correlation_id()
        if cid:
            message = f"{message} | cid={cid[:8]}"
        
        # Add exception if present
        if record.exc_info:
            message += f"\n{self.RESET}{traceback.format_exception(*record.exc_info)}"
        
        return message


class LoggerAdapter(logging.LoggerAdapter):
    """
    Logger adapter with extra context support
    """
    
    def process(self, msg: str, kwargs: Dict[str, Any]) -> tuple:
        extra = kwargs.get('extra', {})
        extra['extra_data'] = self.extra
        kwargs['extra'] = extra
        return msg, kwargs


def setup_logging() -> None:
    """Configure logging for the application"""
    
    # Get log level from settings
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Create root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers
    root_logger.handlers.clear()
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    
    # Use appropriate formatter based on environment
    if settings.ENVIRONMENT == "development":
        formatter = DevelopmentFormatter()
    else:
        formatter = JSONFormatter()
    
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # Set levels for noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("aiokafka").setLevel(logging.WARNING)
    logging.getLogger("aioredis").setLevel(logging.WARNING)
    
    # Log startup
    root_logger.info(
        f"Logging configured",
        extra={
            "extra_data": {
                "level": settings.LOG_LEVEL,
                "environment": settings.ENVIRONMENT
            }
        }
    )


def get_logger(name: str, **extra) -> LoggerAdapter:
    """
    Get a logger instance with optional extra context
    
    Usage:
        logger = get_logger(__name__)
        logger.info("User created", extra={"user_id": "123"})
    """
    logger = logging.getLogger(name)
    return LoggerAdapter(logger, extra)


# Convenience functions for structured logging
class StructuredLogger:
    """
    Structured logger with predefined log methods
    """
    
    def __init__(self, name: str):
        self.logger = get_logger(name)
    
    def info(self, message: str, **kwargs) -> None:
        self.logger.info(message, extra={"extra_data": kwargs})
    
    def debug(self, message: str, **kwargs) -> None:
        self.logger.debug(message, extra={"extra_data": kwargs})
    
    def warning(self, message: str, **kwargs) -> None:
        self.logger.warning(message, extra={"extra_data": kwargs})
    
    def error(self, message: str, exc_info: bool = False, **kwargs) -> None:
        self.logger.error(message, exc_info=exc_info, extra={"extra_data": kwargs})
    
    def critical(self, message: str, exc_info: bool = True, **kwargs) -> None:
        self.logger.critical(message, exc_info=exc_info, extra={"extra_data": kwargs})
    
    def audit(self, action: str, user_id: str, resource: str, **kwargs) -> None:
        """Log audit event"""
        self.logger.info(
            f"AUDIT: {action}",
            extra={
                "extra_data": {
                    "audit": True,
                    "action": action,
                    "user_id": user_id,
                    "resource": resource,
                    **kwargs
                }
            }
        )
    
    def metric(self, name: str, value: float, tags: Dict[str, str] = None) -> None:
        """Log metric for monitoring"""
        self.logger.info(
            f"METRIC: {name}={value}",
            extra={
                "extra_data": {
                    "metric": True,
                    "metric_name": name,
                    "metric_value": value,
                    "tags": tags or {}
                }
            }
        )