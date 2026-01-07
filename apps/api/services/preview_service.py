"""
Preview Service - Dynamic preview server management
Handles live preview URLs with dynamic port allocation
"""

import asyncio
import socket
import subprocess
import os
import json
import uuid
import shutil
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from pathlib import Path
from enum import Enum
import threading
import signal


class PreviewStatus(str, Enum):
    STARTING = "starting"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"


@dataclass
class PreviewInstance:
    id: str
    app_id: str
    user_id: str
    port: int
    status: PreviewStatus
    url: str
    process_pid: Optional[int] = None
    build_dir: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(hours=2))
    last_accessed: datetime = field(default_factory=datetime.utcnow)
    error_message: Optional[str] = None


class PreviewService:
    """Service for managing live preview instances"""
    
    # Port range for preview servers
    PORT_RANGE_START = 10000
    PORT_RANGE_END = 20000
    
    # Maximum concurrent previews per user
    MAX_PREVIEWS_PER_USER = 5
    
    # Preview expiration time (hours)
    PREVIEW_EXPIRATION_HOURS = 2
    
    def __init__(self):
        self._previews: Dict[str, PreviewInstance] = {}
        self._port_allocations: Dict[int, str] = {}  # port -> preview_id
        self._user_previews: Dict[str, List[str]] = {}  # user_id -> [preview_ids]
        self._lock = threading.Lock()
        
        # Base URL for preview servers
        self._base_url = os.getenv("PREVIEW_BASE_URL", "http://localhost")
        self._preview_domain = os.getenv("PREVIEW_DOMAIN", "preview.webcraft.local")
        
        # Build directory
        self._builds_dir = Path(os.getenv("PREVIEW_BUILDS_DIR", "/tmp/webcraft-previews"))
        self._builds_dir.mkdir(parents=True, exist_ok=True)
        
        # Start cleanup task
        self._start_cleanup_task()
    
    def _find_available_port(self) -> int:
        """Find an available port in the configured range"""
        with self._lock:
            for port in range(self.PORT_RANGE_START, self.PORT_RANGE_END):
                if port not in self._port_allocations:
                    # Double-check port is actually available
                    if self._is_port_available(port):
                        return port
        raise RuntimeError("No available ports for preview")
    
    def _is_port_available(self, port: int) -> bool:
        """Check if a port is available"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return True
        except OSError:
            return False
    
    def _allocate_port(self, preview_id: str) -> int:
        """Allocate a port for a preview"""
        port = self._find_available_port()
        with self._lock:
            self._port_allocations[port] = preview_id
        return port
    
    def _release_port(self, port: int):
        """Release an allocated port"""
        with self._lock:
            if port in self._port_allocations:
                del self._port_allocations[port]
    
    async def create_preview(
        self,
        app_id: str,
        user_id: str,
        app_config: Dict[str, Any],
        pages: List[Dict[str, Any]]
    ) -> PreviewInstance:
        """Create a new preview instance for an app"""
        
        # Check user's preview limit
        user_preview_ids = self._user_previews.get(user_id, [])
        if len(user_preview_ids) >= self.MAX_PREVIEWS_PER_USER:
            # Stop oldest preview
            oldest_id = user_preview_ids[0]
            await self.stop_preview(oldest_id)
        
        # Check if preview already exists for this app
        existing = self._find_preview_by_app(app_id, user_id)
        if existing:
            # Refresh existing preview
            return await self.refresh_preview(existing.id, app_config, pages)
        
        preview_id = str(uuid.uuid4())[:12]
        port = self._allocate_port(preview_id)
        
        preview = PreviewInstance(
            id=preview_id,
            app_id=app_id,
            user_id=user_id,
            port=port,
            status=PreviewStatus.STARTING,
            url=self._generate_preview_url(preview_id, port)
        )
        
        self._previews[preview_id] = preview
        
        # Track user's previews
        if user_id not in self._user_previews:
            self._user_previews[user_id] = []
        self._user_previews[user_id].append(preview_id)
        
        try:
            # Build and start the preview server
            await self._build_preview(preview, app_config, pages)
            await self._start_preview_server(preview)
            
            preview.status = PreviewStatus.RUNNING
            
        except Exception as e:
            preview.status = PreviewStatus.ERROR
            preview.error_message = str(e)
            self._release_port(port)
        
        return preview
    
    def _generate_preview_url(self, preview_id: str, port: int) -> str:
        """Generate the preview URL"""
        # Option 1: Direct port access (development)
        if os.getenv("ENVIRONMENT") == "development":
            return f"{self._base_url}:{port}"
        
        # Option 2: Subdomain-based (production with reverse proxy)
        return f"https://{preview_id}.{self._preview_domain}"
    
    def _find_preview_by_app(self, app_id: str, user_id: str) -> Optional[PreviewInstance]:
        """Find existing preview for an app"""
        for preview in self._previews.values():
            if preview.app_id == app_id and preview.user_id == user_id:
                if preview.status == PreviewStatus.RUNNING:
                    return preview
        return None
    
    async def _build_preview(
        self,
        preview: PreviewInstance,
        app_config: Dict[str, Any],
        pages: List[Dict[str, Any]]
    ):
        """Build the preview app files"""
        
        build_dir = self._builds_dir / preview.id
        build_dir.mkdir(parents=True, exist_ok=True)
        preview.build_dir = str(build_dir)
        
        # Create package.json
        package_json = {
            "name": f"preview-{preview.id}",
            "version": "1.0.0",
            "private": True,
            "scripts": {
                "dev": f"next dev -p {preview.port}",
                "build": "next build",
                "start": f"next start -p {preview.port}"
            },
            "dependencies": {
                "next": "14.0.4",
                "react": "^18.2.0",
                "react-dom": "^18.2.0"
            }
        }
        
        (build_dir / "package.json").write_text(json.dumps(package_json, indent=2))
        
        # Create next.config.js
        next_config = """
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true }
}
module.exports = nextConfig
"""
        (build_dir / "next.config.js").write_text(next_config)
        
        # Create app directory structure
        app_dir = build_dir / "app"
        app_dir.mkdir(exist_ok=True)
        
        # Create layout.tsx
        layout_content = self._generate_layout(app_config)
        (app_dir / "layout.tsx").write_text(layout_content)
        
        # Create globals.css
        globals_css = self._generate_global_styles(app_config)
        (app_dir / "globals.css").write_text(globals_css)
        
        # Generate pages
        for page in pages:
            await self._generate_page(app_dir, page)
        
        # Install dependencies (in production, use pre-built image)
        if os.getenv("PREVIEW_INSTALL_DEPS", "true") == "true":
            process = await asyncio.create_subprocess_exec(
                "npm", "install", "--legacy-peer-deps",
                cwd=str(build_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await process.wait()
    
    def _generate_layout(self, app_config: Dict[str, Any]) -> str:
        """Generate the root layout file"""
        title = app_config.get("name", "Preview")
        
        return f'''
import './globals.css'

export const metadata = {{
  title: '{title}',
  description: 'WebCraft Preview'
}}

export default function RootLayout({{
  children,
}}: {{
  children: React.ReactNode
}}) {{
  return (
    <html lang="en">
      <body>{{children}}</body>
    </html>
  )
}}
'''
    
    def _generate_global_styles(self, app_config: Dict[str, Any]) -> str:
        """Generate global CSS styles"""
        return '''
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}
'''
    
    async def _generate_page(self, app_dir: Path, page: Dict[str, Any]):
        """Generate a page file from page configuration"""
        
        path = page.get("path", "/")
        widgets = page.get("widgets", [])
        
        # Determine page directory
        if path == "/":
            page_dir = app_dir
            filename = "page.tsx"
        else:
            # Create nested directory for path
            path_parts = path.strip("/").split("/")
            page_dir = app_dir
            for part in path_parts:
                page_dir = page_dir / part
            page_dir.mkdir(parents=True, exist_ok=True)
            filename = "page.tsx"
        
        # Generate page content from widgets
        content = self._generate_page_content(page, widgets)
        (page_dir / filename).write_text(content)
    
    def _generate_page_content(self, page: Dict[str, Any], widgets: List[Dict]) -> str:
        """Generate page content from widgets"""
        
        title = page.get("title", "Page")
        
        # Simple widget rendering (in production, use full widget system)
        widget_jsx = []
        for widget in widgets:
            widget_type = widget.get("type", "text")
            props = widget.get("props", {})
            
            if widget_type == "text":
                text = props.get("text", "")
                widget_jsx.append(f'<p>{text}</p>')
            elif widget_type == "heading":
                text = props.get("text", "")
                level = props.get("level", "h2")
                widget_jsx.append(f'<{level}>{text}</{level}>')
            elif widget_type == "image":
                src = props.get("src", "")
                alt = props.get("alt", "")
                widget_jsx.append(f'<img src="{src}" alt="{alt}" />')
            elif widget_type == "button":
                text = props.get("text", "Button")
                widget_jsx.append(f'<button className="px-4 py-2 bg-blue-500 text-white rounded">{text}</button>')
            elif widget_type == "container":
                widget_jsx.append('<div className="container mx-auto px-4">')
                # Recursively render children
                children = widget.get("children", [])
                for child in children:
                    child_jsx = self._generate_page_content({"widgets": [child]}, [child])
                    widget_jsx.append(child_jsx)
                widget_jsx.append('</div>')
            else:
                # Generic widget placeholder
                widget_jsx.append(f'<div className="p-4 border rounded">{widget_type} widget</div>')
        
        widgets_content = "\n        ".join(widget_jsx) if widget_jsx else '<p>Empty page</p>'
        
        return f'''
export default function Page() {{
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        {widgets_content}
      </div>
    </main>
  )
}}
'''
    
    async def _start_preview_server(self, preview: PreviewInstance):
        """Start the Next.js development server for preview"""
        
        if not preview.build_dir:
            raise RuntimeError("Build directory not set")
        
        # Start the dev server
        process = await asyncio.create_subprocess_exec(
            "npm", "run", "dev",
            cwd=preview.build_dir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            start_new_session=True
        )
        
        preview.process_pid = process.pid
        
        # Wait for server to be ready (check port)
        for _ in range(30):  # 30 second timeout
            await asyncio.sleep(1)
            if not self._is_port_available(preview.port):
                return  # Server is running
        
        raise RuntimeError("Preview server failed to start")
    
    async def stop_preview(self, preview_id: str) -> bool:
        """Stop a preview instance"""
        
        preview = self._previews.get(preview_id)
        if not preview:
            return False
        
        try:
            # Kill the process
            if preview.process_pid:
                try:
                    os.killpg(os.getpgid(preview.process_pid), signal.SIGTERM)
                except ProcessLookupError:
                    pass
            
            # Clean up build directory
            if preview.build_dir and os.path.exists(preview.build_dir):
                shutil.rmtree(preview.build_dir, ignore_errors=True)
            
            # Release port
            self._release_port(preview.port)
            
            # Remove from tracking
            preview.status = PreviewStatus.STOPPED
            
            # Remove from user's previews
            user_previews = self._user_previews.get(preview.user_id, [])
            if preview_id in user_previews:
                user_previews.remove(preview_id)
            
            del self._previews[preview_id]
            
            return True
            
        except Exception as e:
            preview.status = PreviewStatus.ERROR
            preview.error_message = str(e)
            return False
    
    async def refresh_preview(
        self,
        preview_id: str,
        app_config: Dict[str, Any],
        pages: List[Dict[str, Any]]
    ) -> PreviewInstance:
        """Refresh an existing preview with new content"""
        
        preview = self._previews.get(preview_id)
        if not preview:
            raise ValueError("Preview not found")
        
        # Stop current server
        if preview.process_pid:
            try:
                os.killpg(os.getpgid(preview.process_pid), signal.SIGTERM)
            except ProcessLookupError:
                pass
        
        # Rebuild and restart
        preview.status = PreviewStatus.STARTING
        
        try:
            await self._build_preview(preview, app_config, pages)
            await self._start_preview_server(preview)
            preview.status = PreviewStatus.RUNNING
            preview.last_accessed = datetime.utcnow()
            preview.expires_at = datetime.utcnow() + timedelta(hours=self.PREVIEW_EXPIRATION_HOURS)
        except Exception as e:
            preview.status = PreviewStatus.ERROR
            preview.error_message = str(e)
        
        return preview
    
    def get_preview(self, preview_id: str) -> Optional[PreviewInstance]:
        """Get a preview instance by ID"""
        preview = self._previews.get(preview_id)
        if preview:
            preview.last_accessed = datetime.utcnow()
        return preview
    
    def get_user_previews(self, user_id: str) -> List[PreviewInstance]:
        """Get all previews for a user"""
        preview_ids = self._user_previews.get(user_id, [])
        return [self._previews[pid] for pid in preview_ids if pid in self._previews]
    
    def get_app_preview(self, app_id: str, user_id: str) -> Optional[PreviewInstance]:
        """Get the active preview for an app"""
        return self._find_preview_by_app(app_id, user_id)
    
    def _start_cleanup_task(self):
        """Start background task to clean up expired previews"""
        async def cleanup_loop():
            while True:
                await asyncio.sleep(300)  # Check every 5 minutes
                await self._cleanup_expired_previews()
        
        # Start in background (would use proper task management in production)
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(cleanup_loop())
        except RuntimeError:
            pass
    
    async def _cleanup_expired_previews(self):
        """Clean up expired preview instances"""
        now = datetime.utcnow()
        expired = [
            pid for pid, preview in self._previews.items()
            if preview.expires_at < now
        ]
        
        for preview_id in expired:
            await self.stop_preview(preview_id)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get preview service statistics"""
        return {
            "active_previews": len([p for p in self._previews.values() if p.status == PreviewStatus.RUNNING]),
            "total_previews": len(self._previews),
            "allocated_ports": len(self._port_allocations),
            "port_range": f"{self.PORT_RANGE_START}-{self.PORT_RANGE_END}"
        }


# Global preview service instance
_preview_service: Optional[PreviewService] = None


def get_preview_service() -> PreviewService:
    """Get or create the preview service instance"""
    global _preview_service
    if _preview_service is None:
        _preview_service = PreviewService()
    return _preview_service
