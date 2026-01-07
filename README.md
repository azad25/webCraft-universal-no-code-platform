# WebCraft - Universal No-Code Platform

A highly scalable, modular no-code platform for building websites, apps, e-commerce stores, CRMs, ERPs, and more. Built with a plugin architecture that allows any feature to be added as a module.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git https://github.com/azad25/webCraft-universal-no-code-platform
cd webcraft-platform

# Run the setup script
./setup.sh
```

The setup script will:
1. Check system requirements (Docker, memory, disk space)
2. Start all services via Docker Compose
3. Guide you to the web-based setup wizard

### Option 2: Web Setup Wizard

After starting Docker services, open your browser:

```
http://localhost:3000/setup
```

The setup wizard will guide you through:
- System requirements verification
- Database configuration
- Admin account creation
- Email configuration (optional)
- Feature toggles (AI, Analytics)

### Option 3: Manual Setup

See the [Development Setup](#-development-setup) section below.

## 🎯 Features

- **Visual Editor**: Drag-and-drop interface like Webflow/WordPress
- **AI-Powered**: Content generation, design suggestions, code generation
- **Modular Architecture**: Add any feature via plugins
- **Multi-tenant**: Isolated data per user/organization
- **Real-time Collaboration**: Live editing with team members
- **SEO Optimized**: AI-crawler friendly, structured data, Core Web Vitals
- **Mobile Ready**: REST/GraphQL APIs for mobile development

## 📦 Module System

WebCraft uses a powerful plugin architecture. Every feature is a module that can be enabled/disabled:

### Core Modules
- `core.widgets` - Built-in widget library
- `core.integrations` - Third-party service connections
- `core.analytics` - Tracking and reporting
- `core.ai_providers` - OpenAI, Gemini, Claude integration
- `core.storage` - S3, GCS, local file storage
- `core.notifications` - Email, SMS, Push notifications

### Premium Modules
- `core.ecommerce` - Full e-commerce suite
- `core.crm` - Contact and deal management
- `core.workflow` - Visual automation builder

### Creating Custom Modules

```python
from core.module_system import BaseModule, ModuleMetadata, ModuleType

class MyCustomModule(BaseModule):
    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            id="custom.my_module",
            name="My Custom Module",
            version="1.0.0",
            type=ModuleType.WIDGET,
            description="Custom functionality",
            author="Your Name",
            dependencies=[]
        )
    
    async def initialize(self) -> bool:
        # Setup code
        return True
    
    async def shutdown(self) -> bool:
        # Cleanup code
        return True
    
    def get_routes(self):
        # Return FastAPI routers
        return []
```

## 🏗️ Architecture

```
webcraft-platform/
├── apps/
│   ├── api/                 # FastAPI Backend
│   │   ├── core/           # Core utilities
│   │   ├── modules/        # Plugin modules
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Request middleware
│   └── web/                # Next.js Frontend
│       ├── app/            # App router pages
│       ├── components/     # React components
│       ├── lib/            # Utilities
│       └── store/          # Redux state
├── k8s/                    # Kubernetes configs
└── docker-compose.yml      # Local development
```

## 🛠️ Tech Stack

### Backend
- FastAPI (Python)
- PostgreSQL (Multi-tenant database)
- Redis (Caching & sessions)
- Kafka (Event streaming)
- SQLAlchemy (ORM)

### Frontend
- Next.js 14 (React)
- Redux Toolkit (State management)
- TanStack Query (Data fetching)
- Tailwind CSS (Styling)
- Framer Motion (Animations)
- React DnD (Drag and drop)

### Infrastructure
- Docker & Kubernetes
- AWS/GCP deployment ready
- CDN with edge caching

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. Clone and install:
```bash
git clone https://github.com/your-org/webcraft-platform.git
cd webcraft-platform
npm install
```

2. Setup environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start services:
```bash
docker-compose up -d postgres redis kafka
```

4. Run development servers:
```bash
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📚 API Documentation

### Authentication
```bash
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
```

### Apps
```bash
GET    /api/v1/apps
POST   /api/v1/apps
GET    /api/v1/apps/{id}
PUT    /api/v1/apps/{id}
DELETE /api/v1/apps/{id}
POST   /api/v1/apps/{id}/publish
```

### Modules
```bash
GET  /api/v1/modules
POST /api/v1/modules/{id}/enable
POST /api/v1/modules/{id}/disable
```

### AI Services
```bash
POST /api/v1/ai/generate-content
POST /api/v1/ai/generate-image
POST /api/v1/ai/apps/{id}/suggestions
```

## 🔌 Integrations

Built-in integrations with:
- **Payment**: Stripe, PayPal
- **Marketing**: Mailchimp, HubSpot
- **Communication**: Slack, Twilio
- **Storage**: AWS S3, Google Cloud
- **Analytics**: Google Analytics
- **Automation**: Zapier webhooks

## 📱 Mobile SDKs

Generate native SDKs for:
- iOS (Swift)
- Android (Kotlin)
- React Native
- Flutter

## 🔒 Security

- JWT authentication with refresh tokens
- OAuth2 (Google, GitHub, Microsoft)
- API key authentication for server-to-server
- Rate limiting per tier
- CORS configuration
- Input validation with Pydantic

## 📈 Scaling

- Horizontal scaling with Kubernetes
- Database connection pooling
- Redis caching layer
- CDN for static assets
- Event-driven architecture with Kafka

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
