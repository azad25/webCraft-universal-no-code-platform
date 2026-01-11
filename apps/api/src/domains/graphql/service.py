"""GraphQL domain service"""
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime

GRAPHQL_SCHEMA = '''
type Query {
  apps: [App!]!
  app(id: ID!): App
  pages(appId: ID!): [Page!]!
  page(id: ID!): Page
  templates(category: String): [Template!]!
  template(id: ID!): Template
  widgets(category: String): [Widget!]!
  widget(id: ID!): Widget
  automations(appId: ID!): [Automation!]!
  automation(id: ID!): Automation
  me: User
}

type Mutation {
  createApp(input: CreateAppInput!): App!
  updateApp(id: ID!, input: UpdateAppInput!): App!
  deleteApp(id: ID!): Boolean!
  createPage(appId: ID!, input: CreatePageInput!): Page!
  updatePage(id: ID!, input: UpdatePageInput!): Page!
  deletePage(id: ID!): Boolean!
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
'''


class GraphQLService:
    def __init__(self, db: Session):
        self.db = db

    async def execute_query(self, query: str, variables: Optional[Dict] = None, user: Optional[Any] = None) -> Dict[str, Any]:
        """Execute a GraphQL query"""
        import re
        
        parsed = self._parse_simple_graphql(query)
        
        if variables:
            parsed["args"].update(variables)
        
        context = {"user": user}
        
        if parsed["type"] == "query":
            data = await self._resolve_query(parsed["name"], parsed["args"], context)
            return {"data": {parsed["name"]: data}}
        else:
            return {"data": None, "errors": [{"message": "Mutations not fully implemented"}]}

    def _parse_simple_graphql(self, query: str) -> Dict:
        """Simple GraphQL parser for basic queries"""
        import re
        
        result = {"type": None, "name": None, "args": {}, "fields": []}
        
        if query.strip().startswith("mutation"):
            result["type"] = "mutation"
        else:
            result["type"] = "query"
        
        match = re.search(r'(\w+)\s*(?:\(([^)]*)\))?\s*\{', query)
        if match:
            result["name"] = match.group(1)
            if match.group(2):
                args_str = match.group(2)
                for arg in args_str.split(','):
                    if ':' in arg:
                        key, value = arg.split(':', 1)
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        result["args"][key] = value
        
        return result

    async def _resolve_query(self, query_name: str, args: Dict, context: Dict) -> Any:
        """Resolve GraphQL queries"""
        user = context.get("user")
        
        if query_name == "apps":
            return []  # Would query from database
        elif query_name == "templates":
            return []  # Would query from database
        elif query_name == "me":
            if user:
                return {
                    "id": str(user.id) if hasattr(user, 'id') else "unknown",
                    "email": user.email if hasattr(user, 'email') else "",
                    "username": user.username if hasattr(user, 'username') else "",
                    "subscriptionTier": "free",
                    "isPremium": False,
                    "createdAt": datetime.utcnow().isoformat()
                }
            return None
        
        return None

    def get_schema(self) -> str:
        """Get GraphQL schema"""
        return GRAPHQL_SCHEMA

    def get_playground_html(self) -> str:
        """Get GraphQL Playground HTML"""
        return '''
<!DOCTYPE html>
<html>
<head>
    <title>WebCraft GraphQL Playground</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
    <script src="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
</head>
<body>
    <div id="root"></div>
    <script>
        window.addEventListener('load', function() {
            GraphQLPlayground.init(document.getElementById('root'), {
                endpoint: '/api/v2/graphql',
                settings: { 'editor.theme': 'dark' }
            })
        })
    </script>
</body>
</html>
'''
