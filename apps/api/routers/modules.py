"""
Module Management API
Enable/disable modules, configure settings
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List, Any
from pydantic import BaseModel

from core.database import get_db, User
from core.auth import get_current_user
from core.module_system import module_registry, ModuleType

router = APIRouter()


class ModuleConfig(BaseModel):
    config: Dict[str, Any] = {}


@router.get("/")
async def list_modules(
    current_user: User = Depends(get_current_user)
):
    """List all available modules"""
    available = module_registry.get_available_modules()
    enabled = list(module_registry.get_all_modules().keys())
    
    return {
        "modules": [
            {
                "id": m.id,
                "name": m.name,
                "version": m.version,
                "type": m.type.value,
                "description": m.description,
                "is_premium": m.is_premium,
                "price": m.price,
                "enabled": m.id in enabled,
                "tags": m.tags
            }
            for m in available
        ]
    }


@router.get("/enabled")
async def list_enabled_modules(
    current_user: User = Depends(get_current_user)
):
    """List enabled modules"""
    modules = module_registry.get_all_modules()
    return {
        "modules": [
            {
                "id": m.metadata.id,
                "name": m.metadata.name,
                "type": m.metadata.type.value
            }
            for m in modules.values()
        ]
    }


@router.get("/types")
async def list_module_types():
    """List all module types"""
    return {
        "types": [
            {"id": t.value, "name": t.name}
            for t in ModuleType
        ]
    }


@router.post("/{module_id}/enable")
async def enable_module(
    module_id: str,
    config: ModuleConfig = None,
    current_user: User = Depends(get_current_user)
):
    """Enable a module"""
    try:
        success = await module_registry.enable_module(
            module_id, 
            config.config if config else {}
        )
        return {"success": success, "module_id": module_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{module_id}/disable")
async def disable_module(
    module_id: str,
    current_user: User = Depends(get_current_user)
):
    """Disable a module"""
    try:
        success = await module_registry.disable_module(module_id)
        return {"success": success, "module_id": module_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{module_id}")
async def get_module_info(
    module_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get module details"""
    module = module_registry.get_module(module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    return {
        "id": module.metadata.id,
        "name": module.metadata.name,
        "version": module.metadata.version,
        "type": module.metadata.type.value,
        "description": module.metadata.description,
        "config_schema": module.metadata.config_schema,
        "frontend_components": module.get_frontend_components()
    }


@router.get("/by-type/{module_type}")
async def get_modules_by_type(
    module_type: str,
    current_user: User = Depends(get_current_user)
):
    """Get modules by type"""
    try:
        mt = ModuleType(module_type)
        modules = module_registry.get_modules_by_type(mt)
        return {
            "type": module_type,
            "modules": [
                {"id": m.metadata.id, "name": m.metadata.name}
                for m in modules
            ]
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid module type")
