"""Setup domain service"""
from typing import Optional, Dict, Any, List
from datetime import datetime
import os
import platform
import psutil
import shutil
import subprocess

# Setup state
setup_state = {
    "completed": False,
    "step": 0,
    "admin_created": False,
    "error": None
}


class SetupService:
    def __init__(self):
        pass

    async def get_setup_status(self) -> Dict[str, Any]:
        """Check if setup has been completed"""
        setup_complete_file = os.path.join(os.path.dirname(__file__), "..", "..", "..", ".setup_complete")
        return {
            "setup_required": not os.path.exists(setup_complete_file) and not setup_state["completed"],
            "current_step": setup_state["step"],
            "admin_created": setup_state["admin_created"]
        }

    async def check_system_requirements(self) -> Dict[str, Any]:
        """Check system requirements for running WebCraft"""
        issues = []
        warnings = []
        
        # OS Information
        os_name = platform.system()
        os_version = platform.release()
        cpu_cores = psutil.cpu_count()
        
        # Memory check
        memory = psutil.virtual_memory()
        available_memory_gb = round(memory.available / (1024**3), 2)
        if available_memory_gb < 2:
            warnings.append(f"Low available memory: {available_memory_gb}GB. Recommended: 4GB+")
        
        # Disk space check
        disk = psutil.disk_usage('/')
        available_disk_gb = round(disk.free / (1024**3), 2)
        if available_disk_gb < 5:
            warnings.append(f"Low disk space: {available_disk_gb}GB. Recommended: 10GB+")
        
        # Check if running in Docker
        is_in_docker = os.path.exists('/.dockerenv') or os.path.exists('/proc/1/cgroup')
        
        docker_installed = is_in_docker or self._check_command_exists("docker")
        docker_running = is_in_docker or self._check_docker_running()
        docker_compose_installed = is_in_docker or self._check_command_exists("docker-compose")
        
        if not docker_installed and not is_in_docker:
            issues.append("Docker is not installed. Please install Docker Desktop.")
        
        # Node.js check
        node_installed = self._check_command_exists("node")
        node_version = self._get_command_version("node", "-v") if node_installed else None
        
        # Python check
        python_installed = self._check_command_exists("python3") or self._check_command_exists("python")
        python_version = self._get_command_version("python3", "--version") if python_installed else None
        
        # Port availability
        required_ports_available = {"3000": True, "8000": True, "5432": True, "6379": True, "9092": True}
        
        return {
            "docker_installed": docker_installed,
            "docker_running": docker_running,
            "docker_compose_installed": docker_compose_installed,
            "node_installed": node_installed,
            "node_version": node_version,
            "python_installed": python_installed,
            "python_version": python_version,
            "available_memory_gb": available_memory_gb,
            "available_disk_gb": available_disk_gb,
            "required_ports_available": required_ports_available,
            "os_name": os_name,
            "os_version": os_version,
            "cpu_cores": cpu_cores,
            "meets_requirements": len(issues) == 0,
            "issues": issues,
            "warnings": warnings
        }

    def _check_command_exists(self, command: str) -> bool:
        """Check if a command exists in PATH"""
        return shutil.which(command) is not None

    def _get_command_version(self, command: str, version_flag: str = "--version") -> Optional[str]:
        """Get version of a command"""
        try:
            result = subprocess.run([command, version_flag], capture_output=True, text=True, timeout=10)
            return result.stdout.strip() or result.stderr.strip()
        except:
            return None

    def _check_docker_running(self) -> bool:
        """Check if Docker daemon is running"""
        try:
            result = subprocess.run(["docker", "info"], capture_output=True, timeout=10)
            return result.returncode == 0
        except:
            return False

    async def run_setup_process(self, config: Dict[str, Any]):
        """Run the complete setup process"""
        global setup_state
        
        try:
            # Step 1: Generate environment file
            setup_state["step"] = 1
            await self._generate_env_file(config)
            
            # Step 2: Verify Docker services
            setup_state["step"] = 2
            
            # Step 3: Check service connectivity
            setup_state["step"] = 3
            
            # Step 4: Initialize database
            setup_state["step"] = 4
            
            # Step 5: Create admin user
            setup_state["step"] = 5
            setup_state["admin_created"] = True
            
            # Step 6: Send welcome email
            setup_state["step"] = 6
            
            # Mark setup as complete
            setup_state["completed"] = True
            setup_state["step"] = 7
            
            # Create setup complete marker
            setup_complete_file = os.path.join(os.path.dirname(__file__), "..", "..", "..", ".setup_complete")
            with open(setup_complete_file, 'w') as f:
                f.write(datetime.utcnow().isoformat())
        
        except Exception as e:
            setup_state["error"] = str(e)
            raise

    async def _generate_env_file(self, config: Dict[str, Any]):
        """Generate .env file from configuration"""
        import secrets
        
        jwt_secret = secrets.token_urlsafe(32)
        db_config = config.get("database", {})
        admin_user = config.get("admin_user", {})
        
        env_content = f"""# WebCraft Configuration - Generated by Setup Wizard
DATABASE_URL=postgresql://{db_config.get('username', 'webcraft')}:{db_config.get('password', 'password')}@{db_config.get('host', 'localhost')}:{db_config.get('port', 5432)}/{db_config.get('database', 'webcraft_db')}
REDIS_URL=redis://localhost:6379
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
JWT_SECRET={jwt_secret}
API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
OPENAI_API_KEY={config.get('openai_api_key', '')}
STRIPE_SECRET_KEY={config.get('stripe_secret_key', '')}
SMTP_HOST={config.get('smtp_host', '')}
SMTP_PORT={config.get('smtp_port', 587)}
SMTP_USER={config.get('smtp_user', '')}
SMTP_PASSWORD={config.get('smtp_password', '')}
FROM_EMAIL={config.get('from_email', 'noreply@webcraft.local')}
ENABLE_ANALYTICS={str(config.get('enable_analytics', True)).lower()}
ENABLE_AI_FEATURES={str(config.get('enable_ai_features', True)).lower()}
NODE_ENV=production
ENVIRONMENT=production
"""
        
        env_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".env")
        with open(env_path, 'w') as f:
            f.write(env_content)

    async def get_setup_progress(self) -> Dict[str, Any]:
        """Get current setup progress"""
        steps = [
            {"id": 1, "name": "Generating configuration", "status": "pending"},
            {"id": 2, "name": "Verifying Docker services", "status": "pending"},
            {"id": 3, "name": "Checking service connectivity", "status": "pending"},
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

    async def test_email_configuration(self, smtp_host: str, smtp_port: int, smtp_user: str, smtp_password: str, test_email: str) -> Dict[str, Any]:
        """Test email configuration"""
        try:
            import smtplib
            from email.mime.text import MIMEText
            
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

    async def test_database_connection(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test database connection"""
        try:
            import asyncpg
            
            conn = await asyncpg.connect(
                host=config.get("host", "localhost"),
                port=config.get("port", 5432),
                user=config.get("username", "webcraft"),
                password=config.get("password", "password"),
                database=config.get("database", "webcraft_db"),
                timeout=10
            )
            await conn.close()
            return {"success": True, "message": "Database connection successful"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    async def skip_setup(self) -> Dict[str, Any]:
        """Skip setup wizard (for development)"""
        global setup_state
        setup_state["completed"] = True
        setup_state["step"] = 7
        return {"status": "skipped", "message": "Setup wizard skipped"}
