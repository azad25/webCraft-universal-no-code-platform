"""
GraphQL API Endpoint
Provides GraphQL interface for the WebCraft platform
"""

from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
import json

from core.database import get_db, App, Page, Template, Widget, User, Automation
from core.auth import get_current_user, get_optional_user

router = APIRouter()


class GraphQLRequest(BaseModel):
    query: str
    variables: Optional[Dict[str, Any]] = None
    operationName: Optional[str] = None


# Simple GraphQL schema definition
SCHEMA = """
type Query {
  # Apps
  apps: [App!]!
  app(id: ID!): App
  
  # Pages
  pages(appId: ID!): [Page!]!
  page(id: ID!): Page
  
  # Templates
  templates(category: String): [Template!]!
  template(id: ID!): Template
  
  # Widgets
  widgets(category: String): [Widget!]!
  widget(id: ID!): Widget
  
  # Automations
  automations(appId: ID!): [Automation!]!
  automation(id: ID!): Automation
  
  # User
  me: User
}

type Mutation {
  # Apps
  createApp(input: CreateAppInput!): App!
  updateApp(id: ID!, input: UpdateAppInput!): App!
  deleteApp(id: ID!): Boolean!
  
  # Pages
  createPage(appId: ID!, input: CreatePageInput!): Page!
  updatePage(id: ID!, input: UpdatePageInput!): Page!
  deletePage(id: ID!): Boolean!
  
  # Automations
  createAutomation(appId: ID!, input: CreateAutomationInput!): Automation!
  executeAutomation(id: ID!): AutomationExecution!
}

type App {
  id: ID!
  name: String!
  slug: String!
  description: String
  appType: String!
  isPublished: Boolean!
  customDomain: String
  subdomain: String
  config: JSON
  themeConfig: JSON
  seoConfig: JSON
  pages: [Page!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Page {
  id: ID!
  title: String!
  slug: String!
  content: JSON
  metaTitle: String
  metaDescription: String
  isHomepage: Boolean!
  isPublished: Boolean!
  app: App!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Template {
  id: ID!
  name: String!
  slug: String!
  description: String
  category: String!
  previewImage: String
  isPremium: Boolean!
  price: Int!
  downloads: Int!
  rating: Float!
  createdAt: DateTime!
}

type Widget {
  id: ID!
  name: String!
  slug: String!
  description: String
  category: String!
  configSchema: JSON
  defaultConfig: JSON
  isPremium: Boolean!
  createdAt: DateTime!
}

type Automation {
  id: ID!
  name: String!
  description: String
  triggerType: String!
  triggerConfig: JSON
  workflowSteps: JSON
  isEnabled: Boolean!
  lastExecutedAt: DateTime
  executionCount: Int!
  createdAt: DateTime!
}

type AutomationExecution {
  id: ID!
  status: String!
  message: String
}

type User {
  id: ID!
  email: String!
  username: String!
  fullName: String
  avatarUrl: String
  subscriptionTier: String!
  isPremium: Boolean!
  createdAt: DateTime!
}

input CreateAppInput {
  name: String!
  appType: String!
  description: String
  templateId: ID
}

input UpdateAppInput {
  name: String
  description: String
  config: JSON
  themeConfig: JSON
  seoConfig: JSON
  isPublished: Boolean
}

input CreatePageInput {
  title: String!
  slug: String!
  content: JSON
  metaTitle: String
  metaDescription: String
  isHomepage: Boolean
}

input UpdatePageInput {
  title: String
  slug: String
  content: JSON
  metaTitle: String
  metaDescription: String
  isPublished: Boolean
}

input CreateAutomationInput {
  name: String!
  description: String
  triggerType: String!
  triggerConfig: JSON
  workflowSteps: JSON
}

scalar JSON
scalar DateTime
"""


def resolve_query(query_name: str, args: Dict, context: Dict, db: Session):
    """Resolve GraphQL queries"""
    user = context.get("user")
    
    if query_name == "apps":
        if not user:
            return []
        apps = db.query(App).filter(App.owner_id == user.id, App.is_active == True).all()
        return [app_to_dict(a) for a in apps]
    
    elif query_name == "app":
        app = db.query(App).filter(App.id == args.get("id")).first()
        if app and (not user or app.owner_id != user.id):
            if not app.is_published:
                return None
        return app_to_dict(app) if app else None
    
    elif query_name == "pages":
        pages = db.query(Page).filter(
            Page.app_id == args.get("appId"),
            Page.is_active == True
        ).all()
        return [page_to_dict(p) for p in pages]
    
    elif query_name == "page":
        page = db.query(Page).filter(Page.id == args.get("id")).first()
        return page_to_dict(page) if page else None
    
    elif query_name == "templates":
        query = db.query(Template).filter(Template.is_active == True)
        if args.get("category"):
            query = query.filter(Template.category == args["category"])
        templates = query.all()
        return [template_to_dict(t) for t in templates]
    
    elif query_name == "template":
        template = db.query(Template).filter(Template.id == args.get("id")).first()
        return template_to_dict(template) if template else None
    
    elif query_name == "widgets":
        query = db.query(Widget).filter(Widget.is_active == True)
        if args.get("category"):
            query = query.filter(Widget.category == args["category"])
        widgets = query.all()
        return [widget_to_dict(w) for w in widgets]
    
    elif query_name == "automations":
        if not user:
            return []
        automations = db.query(Automation).filter(
            Automation.app_id == args.get("appId"),
            Automation.is_active == True
        ).all()
        return [automation_to_dict(a) for a in automations]
    
    elif query_name == "me":
        return user_to_dict(user) if user else None
    
    return None


def app_to_dict(app: App) -> Dict:
    if not app:
        return None
    return {
        "id": str(app.id),
        "name": app.name,
        "slug": app.slug,
        "description": app.description,
        "appType": app.app_type,
        "isPublished": app.is_published,
        "customDomain": app.custom_domain,
        "subdomain": app.subdomain,
        "config": app.config,
        "themeConfig": app.theme_config,
        "seoConfig": app.seo_config,
        "createdAt": app.created_at.isoformat(),
        "updatedAt": app.updated_at.isoformat()
    }


def page_to_dict(page: Page) -> Dict:
    if not page:
        return None
    return {
        "id": str(page.id),
        "title": page.title,
        "slug": page.slug,
        "content": page.content,
        "metaTitle": page.meta_title,
        "metaDescription": page.meta_description,
        "isHomepage": page.is_homepage,
        "isPublished": page.is_published,
        "createdAt": page.created_at.isoformat(),
        "updatedAt": page.updated_at.isoformat()
    }


def template_to_dict(template: Template) -> Dict:
    if not template:
        return None
    return {
        "id": str(template.id),
        "name": template.name,
        "slug": template.slug,
        "description": template.description,
        "category": template.category,
        "previewImage": template.preview_image,
        "isPremium": template.is_premium,
        "price": template.price,
        "downloads": template.downloads,
        "rating": template.rating,
        "createdAt": template.created_at.isoformat()
    }


def widget_to_dict(widget: Widget) -> Dict:
    if not widget:
        return None
    return {
        "id": str(widget.id),
        "name": widget.name,
        "slug": widget.slug,
        "description": widget.description,
        "category": widget.category,
        "configSchema": widget.config_schema,
        "defaultConfig": widget.default_config,
        "isPremium": widget.is_premium,
        "createdAt": widget.created_at.isoformat()
    }


def automation_to_dict(automation: Automation) -> Dict:
    if not automation:
        return None
    return {
        "id": str(automation.id),
        "name": automation.name,
        "description": automation.description,
        "triggerType": automation.trigger_type,
        "triggerConfig": automation.trigger_config,
        "workflowSteps": automation.workflow_steps,
        "isEnabled": automation.is_enabled,
        "lastExecutedAt": automation.last_executed_at.isoformat() if automation.last_executed_at else None,
        "executionCount": automation.execution_count,
        "createdAt": automation.created_at.isoformat()
    }


def user_to_dict(user: User) -> Dict:
    if not user:
        return None
    return {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "fullName": user.full_name,
        "avatarUrl": user.avatar_url,
        "subscriptionTier": user.subscription_tier,
        "isPremium": user.is_premium,
        "createdAt": user.created_at.isoformat()
    }


def parse_simple_graphql(query: str) -> Dict:
    """Simple GraphQL parser for basic queries"""
    import re
    
    result = {"type": None, "name": None, "args": {}, "fields": []}
    
    # Detect query or mutation
    if query.strip().startswith("mutation"):
        result["type"] = "mutation"
    else:
        result["type"] = "query"
    
    # Extract operation name and arguments
    match = re.search(r'(\w+)\s*(?:\(([^)]*)\))?\s*\{', query)
    if match:
        result["name"] = match.group(1)
        if match.group(2):
            # Parse arguments
            args_str = match.group(2)
            for arg in args_str.split(','):
                if ':' in arg:
                    key, value = arg.split(':', 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    result["args"][key] = value
    
    return result


@router.post("/graphql")
async def graphql_endpoint(
    request: GraphQLRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """GraphQL endpoint"""
    try:
        parsed = parse_simple_graphql(request.query)
        
        # Merge variables into args
        if request.variables:
            parsed["args"].update(request.variables)
        
        context = {"user": current_user}
        
        if parsed["type"] == "query":
            data = resolve_query(parsed["name"], parsed["args"], context, db)
            return {"data": {parsed["name"]: data}}
        else:
            # Mutations would be handled here
            return {"data": None, "errors": [{"message": "Mutations not fully implemented"}]}
    
    except Exception as e:
        return {
            "data": None,
            "errors": [{"message": str(e)}]
        }


@router.get("/graphql")
async def graphql_playground():
    """GraphQL Playground UI"""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>WebCraft GraphQL Playground</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
        <link rel="shortcut icon" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/favicon.png" />
        <script src="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
    </head>
    <body>
        <div id="root">
            <style>
                body { margin: 0; padding: 0; overflow: hidden; }
                #root { height: 100vh; }
            </style>
        </div>
        <script>
            window.addEventListener('load', function() {
                GraphQLPlayground.init(document.getElementById('root'), {
                    endpoint: '/graphql',
                    settings: {
                        'editor.theme': 'dark',
                        'editor.fontSize': 14,
                        'request.credentials': 'include'
                    },
                    tabs: [
                        {
                            endpoint: '/graphql',
                            query: `# Welcome to WebCraft GraphQL Playground
# 
# Try these example queries:

# Get all your apps
query GetApps {
  apps {
    id
    name
    slug
    appType
    isPublished
  }
}

# Get templates
query GetTemplates {
  templates(category: "business") {
    id
    name
    description
    category
    isPremium
  }
}

# Get current user
query GetMe {
  me {
    id
    email
    username
    subscriptionTier
  }
}
`
                        }
                    ]
                })
            })
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html)


@router.get("/graphql/schema")
async def get_schema():
    """Get GraphQL schema"""
    return {"schema": SCHEMA}
