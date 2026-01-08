# WebCraft - Universal No-Code Platform

A comprehensive, production-ready no-code platform for building websites, web apps, e-commerce stores, and business applications. Features a powerful visual editor, 60+ pre-built widgets, automation system, and AI-powered content generation.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/azad25/webCraft-universal-no-code-platform
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

### Option 3: Development Setup

See the [Development Setup](#-development-setup) section below.

## 🎯 Features

### Visual Editor & Builder
- **Drag-and-Drop Interface**: Professional visual editor with 60+ pre-built widgets
- **Live Preview System**: Real-time preview across desktop, tablet, and mobile devices
- **Multi-Page Support**: Create complex applications with multiple pages and navigation
- **Responsive Design**: Automatic responsive layouts with device-specific optimization
- **Real-time Collaboration**: Live editing with team members (WebSocket-powered)

### Widget Library (60+ Components)
- **Layout**: Container, Columns, Section, Spacer, Divider
- **Content**: Text, Image, Video, Audio, Gallery, Embed
- **Navigation**: Navbar, Footer, Breadcrumb, Tabs, Sidebar
- **Interactive**: Button, Form, Search, Calendar, Rating
- **Business**: Hero, CTA, Features, Testimonials, Team, Pricing
- **E-commerce**: Product, Cart, Checkout, Comparison
- **Data**: Table, Chart, Stats, Metrics, Progress
- **Marketing**: Newsletter, Social, Banner, Countdown
- **Advanced**: Code, Map, Timeline, FAQ, Accordion

### Automation System
- **Visual Workflow Builder**: Drag-and-drop automation creation
- **100+ Integrations**: Google Sheets, Airtable, Notion, Discord, Slack, Teams
- **Smart Templates**: Pre-built workflows for marketing, e-commerce, and productivity
- **Error Handling**: Retry logic, fallback actions, and detailed error reporting
- **Performance Dashboard**: Real-time monitoring and analytics

### AI-Powered Features
- **Content Generation**: AI-powered text and image generation
- **Design Suggestions**: Smart layout and styling recommendations
- **SEO Optimization**: Automatic meta tags, structured data, and sitemap generation
- **Code Generation**: Export to clean HTML/CSS/JavaScript

### Data & Integrations
- **Data Sources**: Connect to APIs, databases, and external services
- **Web Scraping**: Built-in web scraper for data collection
- **Media Manager**: Advanced file management with thumbnails and folders
- **Collections**: User-defined databases with CRUD operations
- **Real-time Sync**: Live data updates across all connected widgets

### Deployment & Export
- **Live Preview**: Shareable preview links with QR codes for mobile testing
- **Static Export**: Generate optimized static sites for CDN deployment
- **Custom Domains**: Connect your own domain names
- **Mobile SDKs**: Generate native mobile app SDKs (iOS, Android, React Native, Flutter)
- **SEO Optimized**: Core Web Vitals optimization and search engine friendly

## 📦 Module System

WebCraft uses a powerful plugin architecture where every feature is a module that can be enabled/disabled:

### Core Modules (Built-in)
- `core.widgets` - 60+ widget library with advanced components
- `core.integrations` - 100+ third-party service connections
- `core.analytics` - Comprehensive tracking and reporting
- `core.ai_providers` - OpenAI, Gemini, Claude integration
- `core.storage` - S3, GCS, local file storage with media management
- `core.notifications` - Email, SMS, Push notifications
- `core.data_sources` - API connections and data synchronization
- `core.web_scraper` - Built-in web scraping capabilities

### Premium Modules (Available)
- `core.ecommerce` - Complete e-commerce suite with payment processing
- `core.crm` - Contact and deal management system
- `core.workflow` - Advanced automation builder with 100+ integrations

### Module Management
- **Dynamic Loading**: Enable/disable modules without restart
- **Dependency Management**: Automatic dependency resolution
- **Version Control**: Module versioning and updates
- **Custom Modules**: Build and install your own modules

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
│   ├── api/                    # FastAPI Backend (Python)
│   │   ├── core/              # Core utilities & database
│   │   ├── modules/           # Plugin modules system
│   │   ├── routers/           # API endpoints (20+ routers)
│   │   ├── services/          # Business logic services
│   │   ├── middleware/        # Request middleware
│   │   └── main.py           # FastAPI application
│   └── web/                   # Next.js Frontend (TypeScript)
│       ├── app/              # App router pages
│       ├── components/       # React components (100+ components)
│       │   ├── editor/       # Visual editor components
│       │   ├── automation/   # Automation builder
│       │   ├── ui/          # Reusable UI components
│       │   └── widgets/     # 60+ widget components
│       ├── lib/             # Utilities & API client
│       ├── store/           # Redux state management
│       └── contexts/        # React contexts
├── k8s/                      # Kubernetes deployment configs
├── scripts/                  # Setup and deployment scripts
└── docker-compose.yml        # Local development environment
```

### Key Components

**Backend Services:**
- **FastAPI API** (Port 8000) - Main application server
- **PostgreSQL** (Port 5434) - Primary database with multi-tenant support
- **Redis** (Port 6381) - Caching and session storage
- **Kafka** (Port 9092) - Event streaming for real-time features

**Frontend Application:**
- **Next.js 14** (Port 3000) - React-based frontend with App Router
- **Redux Toolkit** - State management with RTK Query
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations and transitions

## 🛠️ Tech Stack

### Backend
- **FastAPI** (Python 3.11) - High-performance API framework
- **PostgreSQL 15** - Multi-tenant database with advanced features
- **Redis 7** - Caching, sessions, and real-time data
- **Kafka** - Event streaming for real-time collaboration
- **SQLAlchemy** - Advanced ORM with relationship management
- **Alembic** - Database migrations
- **Pydantic** - Data validation and serialization

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Redux Toolkit** - State management with RTK Query
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React DnD** - Drag and drop functionality
- **Radix UI** - Accessible component primitives

### Infrastructure & DevOps
- **Docker & Docker Compose** - Containerization
- **Kubernetes** - Production orchestration
- **Nginx** - Reverse proxy and load balancing
- **AWS/GCP Ready** - Cloud deployment configurations
- **CDN Integration** - Edge caching and global distribution

### Development Tools
- **ESLint & Prettier** - Code formatting and linting
- **Jest & Testing Library** - Unit and integration testing
- **Playwright** - End-to-end testing
- **Storybook** - Component development and documentation

## 🚀 Development Setup

### Prerequisites
- **Docker & Docker Compose** (Recommended for quick setup)
- **Node.js 18+** (for local frontend development)
- **Python 3.11+** (for local backend development)
- **PostgreSQL 15+** (if running locally)
- **Redis 7+** (if running locally)

### Quick Development Setup

1. **Clone and setup environment:**
```bash
git clone https://github.com/azad25/webCraft-universal-no-code-platform.git
cd webcraft-platform
cp .env.example .env
```

2. **Start with Docker (Recommended):**
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

3. **Access the application:**
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5434 (postgres/webcraft/password)
- **Redis**: localhost:6381

### Local Development (Without Docker)

1. **Start infrastructure services:**
```bash
docker compose up -d postgres redis kafka zookeeper
```

2. **Setup backend:**
```bash
cd apps/api
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. **Setup frontend:**
```bash
cd apps/web
npm install
npm run dev
```

### Environment Configuration

Key environment variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://webcraft:password@localhost:5434/webcraft_db

# Redis
REDIS_URL=redis://localhost:6381

# JWT Security
JWT_SECRET_KEY=your-secret-key-here
SECRET_KEY=your-secret-key-here

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Optional: AI Services
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

## 📚 API Documentation

### Core Endpoints

#### Authentication
```bash
POST   /api/v1/auth/register     # User registration
POST   /api/v1/auth/login        # User login
POST   /api/v1/auth/refresh      # Token refresh
DELETE /api/v1/auth/logout       # User logout
```

#### App Builder
```bash
GET    /api/v1/apps              # List user apps
POST   /api/v1/apps              # Create new app
GET    /api/v1/apps/{id}         # Get app details
PUT    /api/v1/apps/{id}         # Update app
DELETE /api/v1/apps/{id}         # Delete app
POST   /api/v1/apps/{id}/publish # Publish app
POST   /api/v1/apps/{id}/preview # Generate preview URL
```

#### Widgets & Templates
```bash
GET    /api/v1/widgets           # Available widgets
GET    /api/v1/templates         # Template library
POST   /api/v1/templates         # Create template
```

#### Automation System
```bash
GET    /api/v1/automations       # List automations
POST   /api/v1/automations       # Create automation
PUT    /api/v1/automations/{id}  # Update automation
POST   /api/v1/automations/{id}/execute # Execute automation
GET    /api/v1/automation-templates     # Template library
```

#### AI Services
```bash
POST   /api/v1/ai/generate-content      # Generate text content
POST   /api/v1/ai/generate-image        # Generate images
POST   /api/v1/ai/apps/{id}/suggestions # Get design suggestions
POST   /api/v1/ai/optimize-seo          # SEO optimization
```

#### Data & Media
```bash
GET    /api/v1/data-sources      # List data sources
POST   /api/v1/data-sources      # Create data source
GET    /api/v1/media             # Media library
POST   /api/v1/media/upload      # Upload files
GET    /api/v1/collections       # User databases
```

#### Preview & Export
```bash
GET    /api/v1/preview/{token}   # Access preview
POST   /api/v1/apps/{id}/export  # Export static site
GET    /api/v1/live-apps         # Deployed apps
```

### API Features
- **OpenAPI 3.0** - Complete API documentation at `/docs`
- **Rate Limiting** - Tier-based request limits
- **Authentication** - JWT Bearer tokens and OAuth2
- **Versioning** - v1 (stable) and v2 (latest features)
- **WebSocket** - Real-time collaboration at `/ws`
- **GraphQL** - Alternative query interface at `/graphql`

## 🔌 Integrations & Services

### Built-in Integrations (100+)

#### Popular Services
- **Google Services**: Sheets, Drive, Analytics, Maps
- **Microsoft**: Teams, OneDrive, Outlook
- **Communication**: Slack, Discord, Twilio, SendGrid
- **Marketing**: Mailchimp, HubSpot, ConvertKit
- **E-commerce**: Stripe, PayPal, Shopify
- **Social Media**: Twitter, Facebook, Instagram, LinkedIn
- **Productivity**: Notion, Airtable, Trello, Asana
- **Storage**: AWS S3, Google Cloud Storage, Dropbox

#### Data Sources
- **APIs**: REST and GraphQL endpoint connections
- **Databases**: PostgreSQL, MySQL, MongoDB
- **Web Scraping**: Built-in scraper with scheduling
- **CSV/JSON**: File-based data imports
- **Real-time**: WebSocket and Server-Sent Events

#### AI & ML Services
- **OpenAI**: GPT-4, DALL-E, Whisper
- **Anthropic**: Claude models
- **Google**: Gemini, Vision API
- **Custom Models**: Bring your own AI endpoints

### Integration Features
- **OAuth2 Flow**: Secure authentication for all services
- **Token Management**: Automatic refresh and storage
- **Rate Limiting**: Respect service limits
- **Error Handling**: Retry logic and fallback options
- **Data Mapping**: Visual field mapping interface
- **Webhook Support**: Receive real-time updates

## 📱 Mobile & Export Options

### Mobile SDKs (API-Ready)
Generate native mobile app SDKs from your WebCraft apps:
- **iOS SDK** (Swift) - Native iOS applications
- **Android SDK** (Kotlin) - Native Android applications  
- **React Native** - Cross-platform mobile apps
- **Flutter** - Cross-platform with single codebase

### Export Formats
- **Static Sites** - Optimized HTML/CSS/JS for CDN deployment
- **Progressive Web Apps** - PWA with offline capabilities
- **Single Page Applications** - SPA with client-side routing
- **Server-Side Rendered** - SSR for better SEO performance

### Deployment Options
- **Custom Domains** - Connect your own domain names
- **Subdomains** - Free webcraft.app subdomains
- **CDN Integration** - Global content delivery
- **SSL Certificates** - Automatic HTTPS encryption
- **Performance Optimization** - Core Web Vitals optimization

## 🔒 Security & Performance

### Security Features
- **JWT Authentication** - Secure token-based authentication
- **OAuth2 Integration** - Google, GitHub, Microsoft login
- **API Key Management** - Server-to-server authentication
- **Rate Limiting** - Tier-based request limits
- **CORS Configuration** - Cross-origin request security
- **Input Validation** - Pydantic-based data validation
- **SQL Injection Protection** - SQLAlchemy ORM security
- **XSS Prevention** - Content Security Policy headers

### Performance Optimization
- **Horizontal Scaling** - Kubernetes-ready architecture
- **Database Connection Pooling** - Efficient database connections
- **Redis Caching** - Multi-layer caching strategy
- **CDN Integration** - Global content delivery
- **Event-driven Architecture** - Kafka for real-time features
- **Code Splitting** - Optimized frontend bundles
- **Image Optimization** - Automatic image compression
- **Core Web Vitals** - Google performance standards

### Monitoring & Reliability
- **Health Checks** - Service monitoring endpoints
- **Error Tracking** - Comprehensive error logging
- **Performance Metrics** - Real-time performance monitoring
- **Uptime Monitoring** - Service availability tracking
- **Backup Systems** - Automated data backups
- **Disaster Recovery** - Multi-region deployment support

## 🎯 Use Cases & Applications

### Business Applications
- **Corporate Websites** - Professional business sites with CMS
- **Landing Pages** - High-converting marketing pages
- **Portfolios** - Creative showcases and personal brands
- **Documentation** - Knowledge bases and help centers
- **Blogs** - Content management with SEO optimization

### E-commerce Solutions
- **Online Stores** - Full-featured e-commerce platforms
- **Product Catalogs** - Showcase products with rich media
- **Booking Systems** - Appointment and reservation management
- **Marketplaces** - Multi-vendor platforms
- **Subscription Services** - Recurring billing and memberships

### Business Tools
- **CRM Systems** - Customer relationship management
- **Project Management** - Task and team collaboration tools
- **Inventory Management** - Stock tracking and management
- **Analytics Dashboards** - Data visualization and reporting
- **Internal Tools** - Custom business applications

### Content & Media
- **News Sites** - Content publishing with automation
- **Event Platforms** - Event management and ticketing
- **Educational Platforms** - Course delivery and management
- **Community Sites** - Forums and social platforms
- **Media Galleries** - Photo and video showcases

## 🏆 Competitive Advantages

### vs. Webflow
- ✅ **Open Source** - Full customization and self-hosting
- ✅ **Automation System** - Built-in workflow automation
- ✅ **AI Integration** - Native AI-powered content generation
- ✅ **Multi-tenant** - Built for agencies and teams
- ✅ **API-First** - Complete programmatic control

### vs. WordPress
- ✅ **Modern Stack** - React/TypeScript frontend, Python backend
- ✅ **Visual Editor** - True drag-and-drop without code
- ✅ **Performance** - Optimized for speed and Core Web Vitals
- ✅ **Security** - Built-in security best practices
- ✅ **Scalability** - Cloud-native architecture

### vs. Bubble
- ✅ **Static Export** - Generate deployable static sites
- ✅ **Mobile SDKs** - Native mobile app generation
- ✅ **Self-hosted** - Full control over data and infrastructure
- ✅ **Open Source** - Community-driven development
- ✅ **Performance** - Faster loading and better SEO

### vs. Zapier/n8n
- ✅ **Integrated Builder** - Automation + app building in one platform
- ✅ **Visual Workflows** - More complex logic and branching
- ✅ **Data Binding** - Direct widget-to-automation connections
- ✅ **Real-time Updates** - Live data synchronization

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute
- **Bug Reports** - Report issues and bugs
- **Feature Requests** - Suggest new features and improvements
- **Code Contributions** - Submit pull requests
- **Documentation** - Improve docs and tutorials
- **Widget Development** - Create new widget components
- **Module Development** - Build integration modules
- **Testing** - Help with testing and QA

### Development Process
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript/Python best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style
- Test across different browsers and devices

### Community
- **GitHub Discussions** - Ask questions and share ideas
- **Discord Server** - Real-time community chat
- **Documentation** - Comprehensive guides and tutorials
- **Blog** - Updates and technical articles

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React** and **Next.js** teams for the amazing frameworks
- **FastAPI** team for the high-performance Python framework
- **Tailwind CSS** for the utility-first CSS framework
- **Radix UI** for accessible component primitives
- **All contributors** who help make WebCraft better

---

**Built with ❤️ by the WebCraft team**

For support, documentation, and updates, visit [webcraft.dev](https://webcraft.dev)
