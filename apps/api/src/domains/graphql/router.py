"""GraphQL domain router"""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from pydantic import BaseModel

from src.core.database import get_db
from src.core.security import get_current_user_optional
from .service import GraphQLService

router = APIRouter(prefix="/graphql")


class GraphQLRequest(BaseModel):
    query: str
    variables: Optional[Dict[str, Any]] = None
    operationName: Optional[str] = None


@router.post("")
async def graphql_endpoint(
    request: GraphQLRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """GraphQL endpoint"""
    try:
        service = GraphQLService(db)
        return await service.execute_query(request.query, request.variables, current_user)
    except Exception as e:
        return {"data": None, "errors": [{"message": str(e)}]}


@router.get("")
async def graphql_playground():
    """GraphQL Playground UI"""
    service = GraphQLService(None)
    return HTMLResponse(content=service.get_playground_html())


@router.get("/schema")
async def get_schema(db: Session = Depends(get_db)):
    """Get GraphQL schema"""
    service = GraphQLService(db)
    return {"schema": service.get_schema()}
