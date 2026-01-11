"""Integrations domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.apps.models import App
from src.domains.auth.schemas import UserResponse
from .service import IntegrationService
from .schemas import IntegrationConnect, IntegrationUpdate

router = APIRouter(prefix="/integrations")


async def get_app_or_404(app_id: uuid.UUID, user_id: str, db: Session) -> App:
    app = db.query(App).filter(App.id == app_id, App.owner_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


@router.get("/available")
async def list_available_integrations(
    category: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all available integrations"""
    service = IntegrationService(db)
    return service.list_available(category)


@router.get("/categories")
async def list_integration_categories(db: Session = Depends(get_db)):
    """List integration categories"""
    service = IntegrationService(db)
    return await service.list_categories()


@router.get("/apps/{app_id}")
async def list_app_integrations(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List connected integrations for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = IntegrationService(db)
    return service.list_app_integrations(str(app_id))


@router.post("/apps/{app_id}/connect")
async def connect_integration(
    app_id: uuid.UUID = Path(...),
    data: IntegrationConnect = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connect an integration"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = IntegrationService(db)
    result = await service.connect(str(app_id), data.provider, data.config)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/apps/{app_id}/{integration_id}")
async def get_integration(
    app_id: uuid.UUID = Path(...),
    integration_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get integration details"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = IntegrationService(db)
    integration = await service.get(str(app_id), str(integration_id))
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    return integration


@router.put("/apps/{app_id}/{integration_id}")
async def update_integration(
    app_id: uuid.UUID = Path(...),
    integration_id: uuid.UUID = Path(...),
    updates: IntegrationUpdate = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update integration settings"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = IntegrationService(db)
    result = await service.update(str(app_id), str(integration_id), updates.dict(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Integration not found")
    return result


@router.delete("/apps/{app_id}/{integration_id}")
async def disconnect_integration(
    app_id: uuid.UUID = Path(...),
    integration_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnect an integration"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = IntegrationService(db)
    if not await service.disconnect(str(app_id), str(integration_id)):
        raise HTTPException(status_code=404, detail="Integration not found")
    return {"message": "Integration disconnected"}


@router.post("/apps/{app_id}/{integration_id}/sync")
async def sync_integration(
    app_id: uuid.UUID = Path(...),
    integration_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually sync integration data"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = IntegrationService(db)
    result = await service.sync(str(app_id), str(integration_id))
    if not result:
        raise HTTPException(status_code=404, detail="Integration not found")
    return result


@router.post("/apps/{app_id}/{integration_id}/test")
async def test_integration(
    app_id: uuid.UUID = Path(...),
    integration_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Test integration connection"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = IntegrationService(db)
    result = await service.test(str(app_id), str(integration_id))
    if not result:
        raise HTTPException(status_code=404, detail="Integration not found")
    return result


@router.get("/oauth/{provider}/authorize")
async def get_oauth_url(
    provider: str = Path(...),
    app_id: uuid.UUID = Query(...),
    redirect_uri: str = Query(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get OAuth authorization URL"""
    service = IntegrationService(db)
    result = await service.get_oauth_url(provider, str(app_id), redirect_uri)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str = Path(...),
    code: str = Query(...),
    state: str = Query(...),
    app_id: uuid.UUID = Query(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Handle OAuth callback"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = IntegrationService(db)
    result = await service.oauth_callback(provider, code, state, str(app_id), current_user)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result
