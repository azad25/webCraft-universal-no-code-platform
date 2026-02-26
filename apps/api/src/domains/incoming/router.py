"""Incoming webhooks router"""
from fastapi import APIRouter, Depends, HTTPException, Request, Path
from sqlalchemy.orm import Session
from typing import Dict, Any
import uuid
import json

from src.core.database import get_db
from src.domains.apps.models import App
from src.domains.data_sources.models import DataSourceEndpoint

router = APIRouter(prefix="/incoming")


@router.post("/{app_id}/{endpoint_id}")
async def handle_incoming_webhook(
    app_id: uuid.UUID = Path(...),
    endpoint_id: uuid.UUID = Path(...),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Handle incoming webhook data"""
    
    # Get the app
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Get the endpoint
    endpoint = db.query(DataSourceEndpoint).filter(
        DataSourceEndpoint.id == endpoint_id
    ).first()
    
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    # Get request data
    try:
        if request.headers.get("content-type", "").startswith("application/json"):
            data = await request.json()
        else:
            # Handle form data or other content types
            form_data = await request.form()
            data = dict(form_data)
    except Exception:
        data = {}
    
    # Get headers
    headers = dict(request.headers)
    
    # Process the webhook data
    webhook_data = {
        "app_id": str(app_id),
        "endpoint_id": str(endpoint_id),
        "method": request.method,
        "headers": headers,
        "data": data,
        "query_params": dict(request.query_params),
        "client_ip": request.client.host if request.client else None
    }
    
    # Here you would typically:
    # 1. Validate the webhook signature if required
    # 2. Transform the data according to endpoint configuration
    # 3. Store the data in collections or trigger automations
    # 4. Send notifications if configured
    
    # For now, return success
    return {
        "success": True,
        "message": "Webhook received successfully",
        "webhook_id": str(uuid.uuid4()),
        "processed_at": "2024-01-01T00:00:00Z"
    }


@router.get("/{app_id}/{endpoint_id}")
async def handle_incoming_webhook_get(
    app_id: uuid.UUID = Path(...),
    endpoint_id: uuid.UUID = Path(...),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Handle incoming webhook GET requests (for verification)"""
    
    # Get the app
    app = db.query(App).filter(App.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Get the endpoint
    endpoint = db.query(DataSourceEndpoint).filter(
        DataSourceEndpoint.id == endpoint_id
    ).first()
    
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    # Handle webhook verification (common for services like Facebook, Slack, etc.)
    query_params = dict(request.query_params)
    
    # Example: Facebook webhook verification
    if "hub.challenge" in query_params and "hub.verify_token" in query_params:
        # Verify token would be stored in endpoint configuration
        verify_token = endpoint.headers.get("verify_token") if endpoint.headers else None
        
        if verify_token and query_params.get("hub.verify_token") == verify_token:
            return int(query_params["hub.challenge"])
    
    # Default response for GET requests
    return {
        "success": True,
        "message": "Webhook endpoint is active",
        "app_id": str(app_id),
        "endpoint_id": str(endpoint_id)
    }