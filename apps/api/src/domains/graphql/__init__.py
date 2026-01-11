"""GraphQL domain - GraphQL API interface"""
from .router import router
from .service import GraphQLService

__all__ = ["router", "GraphQLService"]
