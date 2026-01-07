"""
SDK Generator API Routes
Generate and download client SDKs
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse, JSONResponse
from typing import Optional
from enum import Enum

from services.sdk_generator import SDKGenerator
from core.auth import get_current_user, get_optional_user

router = APIRouter()


class SDKLanguage(str, Enum):
    TYPESCRIPT = "typescript"
    PYTHON = "python"
    REACT_HOOKS = "react-hooks"
    CURL = "curl"


@router.get("/sdk/{language}")
async def get_sdk(
    language: SDKLanguage,
    download: bool = Query(False)
):
    """Get SDK for specified language"""
    generator = SDKGenerator({})
    
    if language == SDKLanguage.TYPESCRIPT:
        content = generator.generate_typescript_sdk()
        filename = "webcraft-client.ts"
        media_type = "text/typescript"
    elif language == SDKLanguage.PYTHON:
        content = generator.generate_python_sdk()
        filename = "webcraft_client.py"
        media_type = "text/x-python"
    elif language == SDKLanguage.REACT_HOOKS:
        content = generator.generate_react_hooks()
        filename = "use-webcraft.ts"
        media_type = "text/typescript"
    elif language == SDKLanguage.CURL:
        content = generator.generate_curl_examples()
        filename = "webcraft-examples.sh"
        media_type = "text/x-shellscript"
    else:
        raise HTTPException(status_code=400, detail="Unsupported language")
    
    response = PlainTextResponse(content=content, media_type=media_type)
    
    if download:
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    
    return response


@router.get("/sdk")
async def list_sdks():
    """List available SDKs"""
    return {
        "sdks": [
            {
                "language": "typescript",
                "name": "TypeScript/JavaScript",
                "description": "Full-featured TypeScript client with type definitions",
                "filename": "webcraft-client.ts",
                "download_url": "/sdk/typescript?download=true"
            },
            {
                "language": "python",
                "name": "Python",
                "description": "Python client with dataclass responses",
                "filename": "webcraft_client.py",
                "download_url": "/sdk/python?download=true"
            },
            {
                "language": "react-hooks",
                "name": "React Hooks",
                "description": "React hooks for easy data fetching",
                "filename": "use-webcraft.ts",
                "download_url": "/sdk/react-hooks?download=true"
            },
            {
                "language": "curl",
                "name": "cURL Examples",
                "description": "cURL command examples for all endpoints",
                "filename": "webcraft-examples.sh",
                "download_url": "/sdk/curl?download=true"
            }
        ],
        "documentation": "/docs",
        "openapi": "/openapi.json"
    }


@router.get("/sdk/all")
async def get_all_sdks():
    """Get all SDKs as JSON"""
    generator = SDKGenerator({})
    return generator.generate_all()
