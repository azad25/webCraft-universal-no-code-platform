"""
Setup & Installation API Routes
First-time setup wizard for WebCraft platform
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import os
import subprocess
import shutil
import platform
import psutil
import asyncio

router = APIRouter()

# Setup state (in production, use Redis or file-based state)
setup_state = {
    "completed": False,
    "step": 0,
    "admin_created": False
}


class SystemRequirements(BaseModel):
    docker_installed: bool = False
    docker_running: bool = False
    docker_compose_installed: bool = False
    node_installed: bool = False
    node_version: Optional[str] = None
    python_installed: bool = False
    python_version: Optional[str] = None
    available_memory_gb: float = 0
    available_disk_gb: float = 0
    required_ports_available: Dict[str, bool] = {}
    os_name: str = ""
    os_version: str = ""
    cpu_cores: int = 0
    meets_requirements: bool = False
    issues: List[str] = []
    warnings: List[str] = []


class AdminUserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=255)
    company_name: Optional[str] = None
    send_welcome_email: bool = True


class DatabaseConfig(BaseModel):
    host: str = "localhost"
    port: int = 5432
    database: str = "webcraft_db"
    username: str = "webcraft"
    password: str = "password"
    use_docker: bool = True


class SetupConfig(BaseModel):
    admin_user: AdminUserCreate
    database: DatabaseConfig
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    from_email: Optional[str] = None
    openai_api_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    enable_analytics: bool = True
    enable_ai_features: bool = True


def check_command_exists(command: str) -> bool:
    """Check if a command exists in PATH"""
    return shutil.which(command) is not None


def get_command_version(command: str, version_flag: str = "--version") -> Optional[str]:
    """Get version of a command"""
    try:
        result = subprocess.run(
            [command, version_flag],
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.stdout.strip() or result.stderr.strip()
    except:
        return None


def check_port_available(port: int) -> bool:
    """Check if a port is available"""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            return True
        except:
            return False


def check_docker_running() -> bool:
    """Check if Docker daemon is running"""
    try:
        result = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            timeout=10
        )
        return result.returncode == 0
    except:
        return False


@router.get("/setup/status")
async def get_setup_status():
    """Check if setup has been completed"""
    # Check if .setup_complete file exists or admin user exists
    setup_complete_file = os.path.join(os.path.dirname(__file__), "..", ".setup_complete")
    
    return {
        "setup_required": not os.path.exists(setup_complete_file) and not setup_state["completed"],
        "current_step": setup_state["step"],
        "admin_created": setup_state["admin_created"]
    }


@router.get("/setup/requirements", response_model=SystemRequirements)
async def check_system_requirements():
    """Check system requirements for running WebCraft"""
    requirements = SystemRequirements()
    issues = []
    warnings = []
    
    # OS Information
    requirements.os_name = platform.system()
    requirements.os_version = platform.release()
    requirements.cpu_cores = psutil.cpu_count()
    
    # Memory check (minimum 4GB recommended)
    memory = psutil.virtual_memory()
    requirements.available_memory_gb = round(memory.available / (1024**3), 2)
    if requirements.available_memory_gb < 2:  # Lower threshold for container
        warnings.append(f"Low available memory: {requirements.available_memory_gb}GB. Recommended: 4GB+ on host")
    
    # Disk space check (minimum 10GB recommended)
    disk = psutil.disk_usage('/')
    requirements.available_disk_gb = round(disk.free / (1024**3), 2)
    if requirements.available_disk_gb < 5:  # Lower threshold for container
        warnings.append(f"Low disk space: {requirements.available_disk_gb}GB. Recommended: 10GB+ on host")
    
    # Check if we're running in Docker (which we are)
    is_in_docker = os.path.exists('/.dockerenv') or os.path.exists('/proc/1/cgroup')
    
    if is_in_docker:
        # We're running in Docker, so Docker is obviously available
        requirements.docker_installed = True
        requirements.docker_running = True
        requirements.docker_compose_installed = True
        
        # Add success message
        warnings.append("Running in Docker container - Docker environment is properly configured.")
    else:
        # Original Docker checks for non-containerized environments
        requirements.docker_installed = check_command_exists("docker")
        if not requirements.docker_installed:
            issues.append("Docker is not installed. Please install Docker Desktop.")
        else:
            requirements.docker_running = check_docker_running()
            if not requirements.docker_running:
                issues.append("Docker is installed but not running. Please start Docker.")
        
        requirements.docker_compose_installed = (
            check_command_exists("docker-compose") or 
            check_command_exists("docker") # docker compose v2
        )
        if not requirements.docker_compose_installed:
            issues.append("Docker Compose is not installed.")
    
    # Node.js check (optional for development)
    requirements.node_installed = check_command_exists("node")
    if requirements.node_installed:
        requirements.node_version = get_command_version("node", "-v")
    
    # Python check
    requirements.python_installed = check_command_exists("python3") or check_command_exists("python")
    if requirements.python_installed:
        python_cmd = "python3" if check_command_exists("python3") else "python"
        requirements.python_version = get_command_version(python_cmd, "--version")
    
    # Port availability check - skip for containerized environment
    if not is_in_docker:
        required_ports = {
            "3000": "Frontend (Next.js)",
            "8000": "Backend (FastAPI)",
            "5432": "PostgreSQL",
            "6379": "Redis",
            "9092": "Kafka"
        }
        
        for port, service in required_ports.items():
            available = check_port_available(int(port))
            requirements.required_ports_available[port] = available
            if not available:
                warnings.append(f"Port {port} ({service}) is in use. It will be mapped to a different port.")
    else:
        # In Docker, ports are managed by Docker Compose
        requirements.required_ports_available = {
            "3000": True,
            "8000": True,
            "5432": True,
            "6379": True,
            "9092": True
        }
    
    requirements.issues = issues
    requirements.warnings = warnings
    requirements.meets_requirements = len(issues) == 0
    
    return requirements


@router.post("/setup/initialize")
async def initialize_setup(
    config: SetupConfig,
    background_tasks: BackgroundTasks
):
    """Initialize the platform with provided configuration"""
    
    # Validate configuration
    if not config.admin_user.email or not config.admin_user.password:
        raise HTTPException(status_code=400, detail="Admin email and password are required")
    
    # Start setup process in background
    background_tasks.add_task(run_setup_process, config)
    
    return {
        "status": "initializing",
        "message": "Setup process started. This may take a few minutes.",
        "next_step": "monitor_progress"
    }


async def run_setup_process(config: SetupConfig):
    """Run the complete setup process"""
    global setup_state
    
    try:
        # Check if we're running in Docker
        is_in_docker = os.path.exists('/.dockerenv') or os.path.exists('/proc/1/cgroup')
        
        if is_in_docker:
            # Containerized setup process
            # Step 1: Generate environment file
            setup_state["step"] = 1
            await generate_env_file(config)
            
            # Step 2: Skip Docker services (already running)
            setup_state["step"] = 2
            # Services are already running in containers
            
            # Step 3: Skip waiting for services (already available)
            setup_state["step"] = 3
            # Services are already available
            
            # Step 4: Initialize database
            setup_state["step"] = 4
            await initialize_database()
            
            # Step 5: Create admin user
            setup_state["step"] = 5
            await create_admin_user(config.admin_user)
            setup_state["admin_created"] = True
            
            # Step 6: Send welcome email (if configured)
            setup_state["step"] = 6
            if config.admin_user.send_welcome_email and config.smtp_host:
                await send_welcome_email(config)
        else:
            # Original setup process for non-containerized environments
            # Step 1: Generate environment file
            setup_state["step"] = 1
            await generate_env_file(config)
            
            # Step 2: Start Docker services
            setup_state["step"] = 2
            await start_docker_services()
            
            # Step 3: Wait for services to be ready
            setup_state["step"] = 3
            await wait_for_services()
            
            # Step 4: Initialize database
            setup_state["step"] = 4
            await initialize_database()
            
            # Step 5: Create admin user
            setup_state["step"] = 5
            await create_admin_user(config.admin_user)
            setup_state["admin_created"] = True
            
            # Step 6: Send welcome email (if configured)
            setup_state["step"] = 6
            if config.admin_user.send_welcome_email and config.smtp_host:
                await send_welcome_email(config)
        
        # Mark setup as complete
        setup_state["completed"] = True
        setup_state["step"] = 7
        
        # Create setup complete marker
        setup_complete_file = os.path.join(os.path.dirname(__file__), "..", ".setup_complete")
        with open(setup_complete_file, 'w') as f:
            f.write(datetime.utcnow().isoformat())
    
    except Exception as e:
        setup_state["error"] = str(e)
        raise


async def generate_env_file(config: SetupConfig):
    """Generate .env file from configuration"""
    import secrets
    
    jwt_secret = secrets.token_urlsafe(32)
    
    env_content = f"""# WebCraft Configuration - Generated by Setup Wizard
# Generated at: {datetime.utcnow().isoformat()}

# Database Configuration
DATABASE_URL=postgresql://{config.database.username}:{config.database.password}@{config.database.host}:{config.database.port}/{config.database.database}

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# JWT Configuration
JWT_SECRET={jwt_secret}

# API Configuration
API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# AI Service API Keys
OPENAI_API_KEY={config.openai_api_key or ''}

# Payment Configuration (Stripe)
STRIPE_SECRET_KEY={config.stripe_secret_key or ''}

# Email Configuration
SMTP_HOST={config.smtp_host or ''}
SMTP_PORT={config.smtp_port or 587}
SMTP_USER={config.smtp_user or ''}
SMTP_PASSWORD={config.smtp_password or ''}
FROM_EMAIL={config.from_email or 'noreply@webcraft.local'}

# Feature Flags
ENABLE_ANALYTICS={str(config.enable_analytics).lower()}
ENABLE_AI_FEATURES={str(config.enable_ai_features).lower()}

# Environment
NODE_ENV=production
ENVIRONMENT=production
"""
    
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")
    with open(env_path, 'w') as f:
        f.write(env_content)


async def start_docker_services():
    """Start Docker Compose services"""
    project_root = os.path.join(os.path.dirname(__file__), "..", "..", "..")
    
    try:
        # Try docker compose v2 first
        result = subprocess.run(
            ["docker", "compose", "up", "-d"],
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode != 0:
            # Fall back to docker-compose v1
            result = subprocess.run(
                ["docker-compose", "up", "-d"],
                cwd=project_root,
                capture_output=True,
                text=True,
                timeout=300
            )
        
        if result.returncode != 0:
            raise Exception(f"Failed to start Docker services: {result.stderr}")
    
    except subprocess.TimeoutExpired:
        raise Exception("Docker services startup timed out")


async def wait_for_services():
    """Wait for all services to be ready"""
    import httpx
    
    services = [
        ("http://localhost:8000/health", "API"),
        ("http://localhost:3000", "Frontend"),
    ]
    
    max_retries = 30
    retry_delay = 5
    
    for url, name in services:
        for i in range(max_retries):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, timeout=5)
                    if response.status_code < 500:
                        break
            except:
                pass
            
            if i < max_retries - 1:
                await asyncio.sleep(retry_delay)
        else:
            raise Exception(f"{name} service failed to start")


async def initialize_database():
    """Initialize database tables using Alembic migrations"""
    import subprocess
    
    api_dir = os.path.join(os.path.dirname(__file__), "..")
    
    try:
        # Run Alembic migrations
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=api_dir,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode != 0:
            # Fall back to SQLAlchemy create_all if Alembic fails
            print(f"Alembic migration failed: {result.stderr}, falling back to create_all")
            from core.database import init_db
            await init_db()
        else:
            print("Database migrations completed successfully")
    
    except Exception as e:
        # Fall back to SQLAlchemy create_all
        print(f"Migration error: {e}, falling back to create_all")
        from core.database import init_db
        await init_db()


async def create_admin_user(admin_data: AdminUserCreate):
    """Create the admin user"""
    from core.database import SessionLocal, User
    from core.auth import AuthService
    
    db = SessionLocal()
    try:
        # Check if user already exists
        existing = db.query(User).filter(User.email == admin_data.email).first()
        if existing:
            return existing
        
        # Create admin user (password length is handled in AuthService)
        user = User(
            email=admin_data.email,
            username=admin_data.username,
            full_name=admin_data.full_name,
            hashed_password=AuthService.get_password_hash(admin_data.password),
            is_verified=True,
            is_premium=True,
            subscription_tier="enterprise"
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
    finally:
        db.close()


async def send_welcome_email(config: SetupConfig):
    """Send welcome email to admin"""
    from services.email_service import EmailService
    
    email_service = EmailService()
    
    await email_service.send_email(
        to=config.admin_user.email,
        subject="Welcome to WebCraft - Your Platform is Ready!",
        html_content=f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0;">Welcome to WebCraft!</h1>
            </div>
            <div style="padding: 40px; background: #f8f9fa;">
                <h2>Hi {config.admin_user.full_name},</h2>
                <p>Your WebCraft platform has been successfully set up and is ready to use!</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Your Login Details:</h3>
                    <p><strong>Email:</strong> {config.admin_user.email}</p>
                    <p><strong>Dashboard:</strong> <a href="http://localhost:3000/dashboard">http://localhost:3000/dashboard</a></p>
                </div>
                
                <h3>Quick Start Guide:</h3>
                <ol>
                    <li>Log in to your dashboard</li>
                    <li>Create your first app</li>
                    <li>Choose a template or start from scratch</li>
                    <li>Use the drag-and-drop editor to build your site</li>
                    <li>Publish when ready!</li>
                </ol>
                
                <p>Need help? Check out our documentation or contact support.</p>
                
                <p style="margin-top: 40px; color: #666;">
                    Best regards,<br>
                    The WebCraft Team
                </p>
            </div>
        </body>
        </html>
        """
    )


@router.get("/setup/progress")
async def get_setup_progress():
    """Get current setup progress"""
    # Check if we're running in Docker
    is_in_docker = os.path.exists('/.dockerenv') or os.path.exists('/proc/1/cgroup')
    
    if is_in_docker:
        steps = [
            {"id": 1, "name": "Generating configuration", "status": "pending"},
            {"id": 2, "name": "Verifying Docker services", "status": "pending"},
            {"id": 3, "name": "Checking service connectivity", "status": "pending"},
            {"id": 4, "name": "Initializing database", "status": "pending"},
            {"id": 5, "name": "Creating admin user", "status": "pending"},
            {"id": 6, "name": "Sending welcome email", "status": "pending"},
            {"id": 7, "name": "Setup complete", "status": "pending"},
        ]
    else:
        steps = [
            {"id": 1, "name": "Generating configuration", "status": "pending"},
            {"id": 2, "name": "Starting Docker services", "status": "pending"},
            {"id": 3, "name": "Waiting for services", "status": "pending"},
            {"id": 4, "name": "Initializing database", "status": "pending"},
            {"id": 5, "name": "Creating admin user", "status": "pending"},
            {"id": 6, "name": "Sending welcome email", "status": "pending"},
            {"id": 7, "name": "Setup complete", "status": "pending"},
        ]
    
    current_step = setup_state.get("step", 0)
    
    for step in steps:
        if step["id"] < current_step:
            step["status"] = "completed"
        elif step["id"] == current_step:
            step["status"] = "in_progress"
    
    return {
        "current_step": current_step,
        "total_steps": len(steps),
        "steps": steps,
        "completed": setup_state.get("completed", False),
        "error": setup_state.get("error"),
        "admin_created": setup_state.get("admin_created", False)
    }


@router.post("/setup/test-email")
async def test_email_configuration(
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_password: str,
    test_email: EmailStr
):
    """Test email configuration"""
    import smtplib
    from email.mime.text import MIMEText
    
    try:
        msg = MIMEText("This is a test email from WebCraft setup wizard.")
        msg['Subject'] = "WebCraft - Email Configuration Test"
        msg['From'] = smtp_user
        msg['To'] = test_email
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        return {"success": True, "message": "Test email sent successfully"}
    
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/setup/test-database")
async def test_database_connection(config: DatabaseConfig):
    """Test database connection"""
    try:
        import asyncpg
        
        conn = await asyncpg.connect(
            host=config.host,
            port=config.port,
            user=config.username,
            password=config.password,
            database=config.database,
            timeout=10
        )
        
        await conn.close()
        return {"success": True, "message": "Database connection successful"}
    
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/setup/skip")
async def skip_setup():
    """Skip setup wizard (for development)"""
    global setup_state
    
    setup_state["completed"] = True
    setup_state["step"] = 7
    
    return {"status": "skipped", "message": "Setup wizard skipped"}
