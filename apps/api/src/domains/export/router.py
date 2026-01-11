"""Export domain router"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import os

from src.core.database import get_db
from src.core.security import get_current_user
from src.domains.apps.models import App
from src.domains.auth.schemas import UserResponse
from .service import ExportService
from .schemas import ExportFormat, ExportOptions

router = APIRouter()


async def get_app_or_404(app_id: uuid.UUID, user_id: str, db: Session) -> App:
    app = db.query(App).filter(App.id == app_id, App.owner_id == user_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app


@router.post("/apps/{app_id}/export/static")
async def create_static_export(
    app_id: uuid.UUID = Path(...),
    options: ExportOptions = None,
    background_tasks: BackgroundTasks = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a static site export"""
    app = await get_app_or_404(app_id, str(current_user.id), db)
    service = ExportService(db)
    return await service.create_export(str(app_id), options, background_tasks)


@router.get("/apps/{app_id}/export/status")
async def get_export_status(
    app_id: uuid.UUID = Path(...),
    export_id: str = Query(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get export job status"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = ExportService(db)
    status = await service.get_status(str(app_id), export_id)
    if not status:
        raise HTTPException(status_code=404, detail="Export job not found")
    return status


@router.get("/apps/{app_id}/export/download")
async def download_export(
    app_id: uuid.UUID = Path(...),
    export_id: str = Query(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download the exported ZIP file"""
    app = await get_app_or_404(app_id, str(current_user.id), db)
    service = ExportService(db)
    result = await service.get_download(str(app_id), export_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Export not found")
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    
    return FileResponse(
        path=result["file_path"],
        filename=f"{app.slug}-export.zip",
        media_type="application/zip"
    )


@router.post("/apps/{app_id}/export/github")
async def export_to_github(
    app_id: uuid.UUID = Path(...),
    repo_name: str = Query(...),
    branch: str = Query("main"),
    enable_pages: bool = Query(True),
    github_token: str = Query(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export directly to GitHub repository"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = ExportService(db)
    return await service.export_to_github(
        str(app_id), repo_name, branch, enable_pages, github_token, current_user
    )


@router.post("/apps/{app_id}/export/netlify")
async def export_to_netlify(
    app_id: uuid.UUID = Path(...),
    site_name: Optional[str] = Query(None),
    netlify_token: str = Query(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deploy directly to Netlify"""
    app = await get_app_or_404(app_id, str(current_user.id), db)
    service = ExportService(db)
    return await service.export_to_netlify(str(app_id), site_name or app.slug, netlify_token)


@router.post("/apps/{app_id}/export/vercel")
async def export_to_vercel(
    app_id: uuid.UUID = Path(...),
    project_name: Optional[str] = Query(None),
    vercel_token: str = Query(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deploy directly to Vercel"""
    app = await get_app_or_404(app_id, str(current_user.id), db)
    service = ExportService(db)
    return await service.export_to_vercel(str(app_id), project_name or app.slug, vercel_token, current_user)


@router.get("/apps/{app_id}/export/preview")
async def preview_export(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Preview what will be exported"""
    app = await get_app_or_404(app_id, str(current_user.id), db)
    service = ExportService(db)
    return await service.preview_export(str(app_id), app)


@router.post("/apps/{app_id}/export/lighthouse")
async def run_lighthouse_audit(
    app_id: uuid.UUID = Path(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run Lighthouse audit before export"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = ExportService(db)
    return await service.run_lighthouse()


@router.get("/apps/{app_id}/export/history")
async def get_export_history(
    app_id: uuid.UUID = Path(...),
    limit: int = Query(10, le=50),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get export history for an app"""
    await get_app_or_404(app_id, str(current_user.id), db)
    service = ExportService(db)
    return await service.get_history(str(app_id), limit)
