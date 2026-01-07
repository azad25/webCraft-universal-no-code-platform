# WebCraft Setup Guide

## Quick Start

### Prerequisites

- Docker Desktop (with Docker Compose)
- 4GB+ available RAM
- 10GB+ available disk space

### Installation

1. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

2. **Open the setup wizard:**
   ```
   http://localhost:3000/setup
   ```

3. **Complete the wizard steps:**
   - System requirements check
   - Database configuration
   - Admin account creation
   - Email settings (optional)
   - Feature configuration

4. **Access your dashboard:**
   ```
   http://localhost:3000/dashboard
   ```

---

## Setup Wizard Steps

### Step 1: Welcome
Introduction to WebCraft and setup overview.

### Step 2: System Requirements
Automatic check for:
- Docker installation and status
- Docker Compose availability
- Available memory (4GB+ recommended)
- Available disk space (10GB+ recommended)
- Required port availability (3000, 8000, 5432, 6379, 9092)

### Step 3: Database Configuration
- **Docker Mode (Recommended):** Uses containerized PostgreSQL
- **External Database:** Connect to existing PostgreSQL instance

### Step 4: Admin Account
Create your administrator account:
- Full name
- Email address
- Username
- Password (8+ characters)
- Company name (optional)

### Step 5: Email Configuration (Optional)
Configure SMTP for sending emails:
- SMTP host and port
- Authentication credentials
- From email address
- Welcome email option

### Step 6: Feature Configuration
Enable/disable optional features:
- Analytics tracking
- AI features (requires OpenAI API key)
- Stripe payment integration

### Step 7: Installation
Automated installation process:
1. Generate configuration files
2. Start Docker services
3. Wait for services to be ready
4. Initialize database
5. Create admin user
6. Send welcome email (if configured)

---

## Manual Setup

If you prefer manual setup:

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your configuration
nano .env

# 3. Start services
docker compose up -d

# 4. Wait for services to start
sleep 30

# 5. Access the application
open http://localhost:3000
```

---

## Troubleshooting

### Docker not running
```bash
# Start Docker Desktop or:
sudo systemctl start docker
```

### Port already in use
Edit `docker-compose.yml` to change port mappings.

### Database connection failed
Check PostgreSQL is running:
```bash
docker compose logs postgres
```

### Services not starting
View all logs:
```bash
docker compose logs -f
```

---

## Service URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| GraphQL | http://localhost:8000/graphql |

---

## Support

- Documentation: `/docs`
- API Reference: `/api/v1/docs`
- GitHub Issues: [Report a bug](https://github.com/your-org/webcraft/issues)
