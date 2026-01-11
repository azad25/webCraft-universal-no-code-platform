"""
SDK domain router
"""

from fastapi import APIRouter

router = APIRouter(prefix="/sdk", tags=["SDK"])


@router.get("/")
async def list_sdks():
    """List available SDKs"""
    return {
        "sdks": [
            {"name": "JavaScript SDK", "version": "1.0.0", "status": "available"},
            {"name": "Python SDK", "version": "1.0.0", "status": "available"},
            {"name": "React SDK", "version": "1.0.0", "status": "available"},
            {"name": "Vue SDK", "version": "1.0.0", "status": "available"}
        ],
        "total": 4
    }


@router.get("/health")
async def sdk_health():
    """SDK health check"""
    return {"status": "healthy", "domain": "sdk"}