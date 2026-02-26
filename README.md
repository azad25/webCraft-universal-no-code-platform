<h1 align="center">
  <br>
  <b>WebCraft</b>
  <br>
  Universal No-Code Platform
  <br>
</h1>

<p align="center">
  <a href="https://github.com/azad25/webCraft-universal-no-code-platform/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License">
  </a>
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/contributions-welcome-orange.svg" alt="Contributions Welcome">
</p>

<p align="center">
  <!-- Languages -->
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/SQL-PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL">
</p>

<p align="center">
  <!-- Backend -->
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/SQLAlchemy-2.x-CC2927?style=flat&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy">
  <img src="https://img.shields.io/badge/Pydantic-2.x-E92063?style=flat&logo=pydantic&logoColor=white" alt="Pydantic">
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/Apache_Kafka-7.4-231F20?style=flat&logo=apachekafka&logoColor=white" alt="Kafka">
</p>

<p align="center">
  <!-- Frontend -->
  <img src="https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Redux_Toolkit-2.x-764ABC?style=flat&logo=redux&logoColor=white" alt="Redux Toolkit">
  <img src="https://img.shields.io/badge/Framer_Motion-11.x-0055FF?style=flat&logo=framer&logoColor=white" alt="Framer Motion">
  <img src="https://img.shields.io/badge/Radix_UI-1.x-161618?style=flat&logo=radixui&logoColor=white" alt="Radix UI">
</p>

<p align="center">
  <!-- Infrastructure -->
  <img src="https://img.shields.io/badge/Docker-20.x-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Kubernetes-1.28-326CE5?style=flat&logo=kubernetes&logoColor=white" alt="Kubernetes">
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Nginx-1.x-009639?style=flat&logo=nginx&logoColor=white" alt="Nginx">
</p>

<p align="center">
  A comprehensive, production-ready no-code platform for building websites, web apps,<br>
  e-commerce stores, and business applications — with a powerful visual editor, 60+ widgets,<br>
  visual automation system, and AI-powered content generation.
</p>

---

## 📸 Screenshots

**🛠️ Visual Builder**

![Builder UI](screenshots/builder.png)

**🛠️ Dashboard**

![Dashboard UI](screenshots/dashboard.png)

**🏠 Landing Page**

![Home Page](screenshots/home.png)

**🔐 Login**

![Login Page](screenshots/login.png)


---

## 🚧 Under Active Development

> [!IMPORTANT]
> This project is **actively under development**. Features, UI, and APIs are continuously evolving. Expect frequent updates, breaking changes, and new additions.

### Current Status

| Area | Status |
|------|--------|
| 🎨 Visual Editor | 🟡 In Progress — UI enhancements ongoing |
| 🧩 Widget Library | 🟡 In Progress — new widgets being added |
| ⚡ Automation System | 🟡 In Progress — advanced triggers in development |
| 🤖 AI Features | 🟡 In Progress — expanding model support |
| 📦 V2 API | 🟡 In Progress — domain architecture stabilizing |
| 🔌 Integrations | 🟡 In Progress — adding more connectors |
| 📱 Mobile SDKs | 🔴 Planned — not yet released |
| 🚀 Cloud Deployment | 🟢 Functional — improvements ongoing |
| 🔒 Auth & Security | 🟢 Functional |
| 📚 Documentation | 🟡 In Progress |

> [!TIP]
> Watch or ⭐ star the repo to stay up to date with new releases.

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/azad25/webCraft-universal-no-code-platform
cd webCraft-universal-no-code-platform

# Run the setup script
./setup.sh
```

The setup script will:
1. Check system requirements (Docker, memory, disk space)
2. Start all services via Docker Compose
3. Guide you to the web-based setup wizard

### Option 2: Docker Compose (Direct)

```bash
docker compose up -d
```

Then open: **http://localhost:3000**

### Option 3: Web Setup Wizard

After starting Docker services, visit: `http://localhost:3000/setup`

The setup wizard guides you through database configuration, admin account creation, email config, and feature toggles.

---

## 🔑 Default Credentials

> [!NOTE]
> These are seed credentials for development only.

| Role  | Email | Password |
|-------|-------|----------|
| Admin | `admin@test.com` | `12345678` |
| User  | `user@test.com` | `password123` |

---

## 🎯 Features

### 🎨 Visual Editor & Builder
- **Drag-and-Drop Interface** — Professional visual editor with 60+ pre-built widgets
- **Live Preview** — Real-time preview across desktop, tablet, and mobile
- **Multi-Page Support** — Complex applications with multiple pages and navigation
- **Responsive Design** — Automatic responsive layouts with device-specific optimization
- **Real-time Collaboration** — WebSocket-powered live team editing

### 🧩 Widget Library (60+)
| Category | Widgets |
|----------|---------|
| Layout | Container, Columns, Section, Spacer, Divider |
| Content | Text, Image, Video, Audio, Gallery, Embed |
| Navigation | Navbar, Footer, Breadcrumb, Tabs, Sidebar |
| Interactive | Button, Form, Search, Calendar, Rating |
| Business | Hero, CTA, Features, Testimonials, Pricing |
| E-commerce | Product, Cart, Checkout, Comparison |
| Data | Table, Chart, Stats, Metrics, Progress |
| Marketing | Newsletter, Social, Banner, Countdown |

### ⚡ Automation System
- Visual workflow builder with drag-and-drop
- 100+ integrations (Google Sheets, Airtable, Notion, Discord, Slack)
- Retry logic, fallback actions, and detailed error reporting
- Real-time performance monitoring

### 🤖 AI-Powered Features
- Content generation (text & image)
- Smart layout and styling suggestions
- Automatic SEO optimization (meta tags, structured data, sitemaps)
- Clean HTML/CSS/JavaScript export

### 🔌 Data & Integrations
- Connect to REST APIs, databases, and external services
- Built-in web scraper with scheduling
- Advanced media manager with thumbnails and folders
- User-defined collections (database) with full CRUD
- Real-time sync across all connected widgets

---

## 🏗️ Architecture

```
webCraft-universal-no-code-platform/
├── apps/
│   ├── api/                    # FastAPI Backend (Python 3.11)
│   │   ├── core/               # Core utilities & database
│   │   ├── routers/            # API endpoints (20+ routers)
│   │   ├── services/           # Business logic services
│   │   ├── middleware/         # Rate limiting, SEO, AI crawler
│   │   ├── src/                # V2 domain-driven architecture
│   │   │   └── domains/        # auth, apps, templates, links, ...
│   │   └── main.py             # FastAPI application entry
│   └── web/                    # Next.js 14 Frontend (TypeScript)
│       ├── app/                # App Router pages
│       ├── components/         # 100+ React components
│       │   ├── editor/         # Visual editor components
│       │   ├── automation/     # Automation builder UI
│       │   ├── ui/             # Reusable UI primitives
│       │   └── widgets/        # 60+ widget renderers
│       ├── store/              # Redux Toolkit state
│       └── lib/                # API client & utilities
├── k8s/                        # Kubernetes manifests
├── scripts/                    # Setup & deployment scripts
├── screenshots/                # App screenshots
└── docker-compose.yml          # Local development environment
```

### Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| Next.js Frontend | `3000` | React app with App Router |
| FastAPI Backend | `8000` | REST + WebSocket + GraphQL |
| PostgreSQL | `5434` | Primary multi-tenant database |
| Redis | `6381` | Caching & session storage |
| Kafka | `9092` | Event streaming (real-time) |
| Zookeeper | `2181` | Kafka coordination |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** (Python 3.11) | High-performance async API framework |
| **PostgreSQL 15** | Multi-tenant primary database |
| **Redis 7** | Caching, sessions, real-time data |
| **Apache Kafka** | Event streaming & collaboration |
| **SQLAlchemy 2** | ORM with relationship management |
| **Alembic** | Database schema migrations |
| **Pydantic v2** | Data validation & serialization |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **Redux Toolkit** | Global state + RTK Query |
| **TanStack Query** | Server state management |
| **Framer Motion** | Smooth animations & transitions |
| **React DnD** | Drag-and-drop interactions |
| **Radix UI** | Accessible component primitives |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Docker & Compose** | Containerization & local dev |
| **Kubernetes** | Production orchestration |
| **Nginx** | Reverse proxy & load balancing |
| **AWS / GCP** | Cloud deployment targets |

---

## 🚀 Development Setup

### Prerequisites
- **Docker & Docker Compose** (recommended — handles everything)
- **Node.js 18+** (for local frontend)
- **Python 3.11+** (for local backend)

### With Docker (Recommended)

```bash
git clone https://github.com/azad25/webCraft-universal-no-code-platform.git
cd webCraft-universal-no-code-platform
cp .env.example .env
docker compose up -d
```

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend |
| http://localhost:8000/docs | API Swagger Docs |
| http://localhost:8000/redoc | API ReDoc |

### Without Docker

```bash
# 1. Start infrastructure only
docker compose up -d postgres redis kafka zookeeper

# 2. Backend
cd apps/api
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 3. Frontend (new terminal)
cd apps/web
npm install
npm run dev
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://webcraft:password@localhost:5434/webcraft_db
DATABASE_V2_URL=postgresql://webcraft:password@localhost:5434/webcraft_v2_db

# Cache
REDIS_URL=redis://localhost:6381

# Security
JWT_SECRET_KEY=your-secret-key-here
SECRET_KEY=your-secret-key-here

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Optional: AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

---

## 📚 API Reference

### Authentication (V1 & V2)

```http
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v2/auth/register
POST   /api/v2/auth/login
POST   /api/v2/auth/refresh
```

### App Builder

```http
GET    /api/v1/apps              # List user apps
POST   /api/v1/apps              # Create new app
GET    /api/v1/apps/{id}         # Get app details
PUT    /api/v1/apps/{id}         # Update app
DELETE /api/v1/apps/{id}         # Delete app
POST   /api/v1/apps/{id}/publish # Publish app
POST   /api/v1/apps/{id}/preview # Generate preview URL
```

### Automations, AI, Media

```http
GET    /api/v1/automations
POST   /api/v1/automations/{id}/execute
POST   /api/v1/ai/generate-content
POST   /api/v1/ai/generate-image
POST   /api/v1/media/upload
GET    /api/v1/collections
```

> **Full interactive docs:** http://localhost:8000/docs  
> **GraphQL endpoint:** http://localhost:8000/graphql  
> **WebSocket:** ws://localhost:8000/ws

### API Versioning

| Version | Status | Description |
|---------|--------|-------------|
| `/api/v1` | ✅ Stable | Full production API |
| `/api/v2` | ✅ Active | Domain-driven architecture, enhanced auth, links, push, storage, scheduler, webhooks |

---

## 📦 Module System

WebCraft uses a plugin architecture — every feature is a module that can be enabled/disabled dynamically.

### Core Modules
| Module ID | Description |
|-----------|-------------|
| `core.widgets` | 60+ widget library |
| `core.integrations` | 100+ third-party connectors |
| `core.analytics` | Tracking & reporting |
| `core.ai_providers` | OpenAI, Gemini, Claude |
| `core.storage` | S3, GCS, local file storage |
| `core.notifications` | Email, SMS, push |
| `core.data_sources` | API & data sync |
| `core.web_scraper` | Scheduled scraping |

### Custom Module Example

```python
from core.module_system import BaseModule, ModuleMetadata, ModuleType

class MyModule(BaseModule):
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
        return True
    
    async def shutdown(self) -> bool:
        return True
    
    def get_routes(self):
        return []  # FastAPI routers
```

---

## 🔌 Integrations

| Category | Services |
|----------|---------|
| Google | Sheets, Drive, Analytics, Maps |
| Microsoft | Teams, OneDrive, Outlook |
| Communication | Slack, Discord, Twilio, SendGrid |
| Marketing | Mailchimp, HubSpot, ConvertKit |
| E-commerce | Stripe, PayPal, Shopify |
| Storage | AWS S3, Google Cloud Storage, Dropbox |
| Productivity | Notion, Airtable, Trello, Asana |
| AI/ML | OpenAI (GPT-4, DALL-E), Anthropic Claude, Google Gemini |

---

## 🔒 Security

- JWT Bearer token authentication
- OAuth2 (Google, GitHub, Microsoft)
- API key management (server-to-server)
- Tier-based rate limiting
- CORS configuration
- Pydantic input validation
- SQLAlchemy ORM (SQL injection protection)
- Content Security Policy headers

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Commit** your changes: `git commit -m 'Add my feature'`
4. **Push**: `git push origin feature/my-feature`
5. **Open** a Pull Request

All contributions welcome — bug reports, features, documentation, new widgets, and integration modules.

---

## 📄 License

[MIT License](LICENSE) — free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) — for the blazing-fast Python API framework
- [Next.js](https://nextjs.org/) — for the React framework powering the frontend
- [Tailwind CSS](https://tailwindcss.com/) — for the utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) — for accessible component primitives
- [Framer Motion](https://www.framer.com/motion/) — for smooth animations

---

<p align="center">Built with ❤️ by the WebCraft team &nbsp;·&nbsp; <a href="https://webcraft.dev">webcraft.dev</a></p>
