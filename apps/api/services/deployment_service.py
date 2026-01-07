"""
Deployment Service for WebCraft Platform
Handles app deployment, domain management, and hosting infrastructure
"""

import asyncio
import aiohttp
import json
import os
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import boto3
from kubernetes import client, config
import docker
import subprocess

from core.database import Session, App, User
from services.domain_service import DomainService
from services.cdn_service import CDNService
from services.ssl_service import SSLService

class DeploymentService:
    """Service for deploying apps to various hosting platforms"""
    
    def __init__(self, db: Session):
        self.db = db
        self.domain_service = DomainService()
        self.cdn_service = CDNService()
        self.ssl_service = SSLService()
        
        # Cloud provider configurations
        self.aws_client = boto3.client('ecs', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        self.docker_client = docker.from_env()
        
        # Kubernetes configuration
        try:
            config.load_incluster_config()  # For in-cluster deployment
        except:
            config.load_kube_config()  # For local development
        
        self.k8s_apps_v1 = client.AppsV1Api()
        self.k8s_core_v1 = client.CoreV1Api()
        self.k8s_networking_v1 = client.NetworkingV1Api()
        
        # Deployment configurations
        self.deployment_configs = {
            "vercel": {
                "api_url": "https://api.vercel.com",
                "api_token": os.getenv("VERCEL_TOKEN")
            },
            "netlify": {
                "api_url": "https://api.netlify.com",
                "api_token": os.getenv("NETLIFY_TOKEN")
            },
            "aws": {
                "region": os.getenv("AWS_REGION", "us-east-1"),
                "cluster_name": os.getenv("AWS_ECS_CLUSTER", "webcraft-cluster")
            },
            "kubernetes": {
                "namespace": os.getenv("K8S_NAMESPACE", "webcraft-apps")
            }
        }
    
    async def deploy_app(
        self,
        app: App,
        custom_domain: Optional[str] = None,
        subdomain: Optional[str] = None,
        platform: str = "kubernetes"
    ) -> Dict[str, Any]:
        """
        Deploy an app to the specified platform
        
        Args:
            app: The app to deploy
            custom_domain: Custom domain for the app
            subdomain: Subdomain under webcraft.dev
            platform: Deployment platform (kubernetes, vercel, netlify, aws)
        
        Returns:
            Deployment result with URLs and configuration
        """
        
        try:
            # Generate deployment configuration
            deployment_config = await self._generate_deployment_config(app)
            
            # Choose deployment strategy based on platform
            if platform == "kubernetes":
                result = await self._deploy_to_kubernetes(app, deployment_config)
            elif platform == "vercel":
                result = await self._deploy_to_vercel(app, deployment_config)
            elif platform == "netlify":
                result = await self._deploy_to_netlify(app, deployment_config)
            elif platform == "aws":
                result = await self._deploy_to_aws(app, deployment_config)
            else:
                raise ValueError(f"Unsupported deployment platform: {platform}")
            
            # Set up domain and SSL
            if custom_domain:
                await self._setup_custom_domain(app, custom_domain, result["service_url"])
                result["custom_domain"] = custom_domain
            
            if subdomain:
                await self._setup_subdomain(app, subdomain, result["service_url"])
                result["subdomain"] = f"{subdomain}.webcraft.dev"
            
            # Configure CDN
            cdn_result = await self.cdn_service.setup_cdn(
                app_id=str(app.id),
                origin_url=result["service_url"],
                custom_domain=custom_domain or f"{subdomain}.webcraft.dev"
            )
            result["cdn_url"] = cdn_result["cdn_url"]
            
            # Set up SSL certificate
            ssl_result = await self.ssl_service.setup_ssl(
                domain=custom_domain or f"{subdomain}.webcraft.dev"
            )
            result["ssl_enabled"] = ssl_result["success"]
            
            # Update app deployment status
            app.is_published = True
            app.custom_domain = custom_domain
            app.subdomain = subdomain
            app.config = {**app.config, "deployment": result}
            app.updated_at = datetime.utcnow()
            self.db.commit()
            
            return {
                "success": True,
                "deployment_id": result["deployment_id"],
                "url": result.get("cdn_url", result["service_url"]),
                "service_url": result["service_url"],
                "platform": platform,
                "ssl_enabled": result["ssl_enabled"],
                "cdn_enabled": True,
                "deployed_at": datetime.utcnow().isoformat()
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "platform": platform,
                "deployed_at": datetime.utcnow().isoformat()
            }
    
    async def _generate_deployment_config(self, app: App) -> Dict[str, Any]:
        """Generate deployment configuration for the app"""
        
        # Build the app's static files
        app_build = await self._build_app(app)
        
        return {
            "app_id": str(app.id),
            "app_name": app.slug,
            "app_type": app.app_type,
            "build_files": app_build["files"],
            "environment": {
                "NODE_ENV": "production",
                "NEXT_PUBLIC_APP_ID": str(app.id),
                "NEXT_PUBLIC_API_URL": os.getenv("API_URL", "https://api.webcraft.dev")
            },
            "resources": {
                "cpu": "500m",
                "memory": "512Mi",
                "replicas": 2
            },
            "health_check": {
                "path": "/health",
                "port": 3000,
                "initial_delay": 30,
                "period": 10
            }
        }
    
    async def _build_app(self, app: App) -> Dict[str, Any]:
        """Build the app's static files and assets"""
        
        build_id = str(uuid.uuid4())
        build_dir = f"/tmp/builds/{build_id}"
        
        try:
            # Create build directory
            os.makedirs(build_dir, exist_ok=True)
            
            # Generate Next.js app structure
            await self._generate_nextjs_app(app, build_dir)
            
            # Build the app
            build_result = subprocess.run(
                ["npm", "run", "build"],
                cwd=build_dir,
                capture_output=True,
                text=True
            )
            
            if build_result.returncode != 0:
                raise Exception(f"Build failed: {build_result.stderr}")
            
            # Package build files
            build_files = await self._package_build_files(build_dir)
            
            return {
                "build_id": build_id,
                "files": build_files,
                "build_time": datetime.utcnow().isoformat()
            }
        
        finally:
            # Cleanup build directory
            subprocess.run(["rm", "-rf", build_dir])
    
    async def _generate_nextjs_app(self, app: App, build_dir: str):
        """Generate Next.js application from app configuration"""
        
        # Create package.json
        package_json = {
            "name": f"webcraft-app-{app.slug}",
            "version": "1.0.0",
            "private": True,
            "scripts": {
                "dev": "next dev",
                "build": "next build",
                "start": "next start"
            },
            "dependencies": {
                "next": "14.0.4",
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "tailwindcss": "^3.4.0"
            }
        }
        
        with open(f"{build_dir}/package.json", "w") as f:
            json.dump(package_json, f, indent=2)
        
        # Create Next.js configuration
        next_config = """
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
"""
        
        with open(f"{build_dir}/next.config.js", "w") as f:
            f.write(next_config)
        
        # Generate pages from app configuration
        await self._generate_app_pages(app, build_dir)
        
        # Generate components from widgets
        await self._generate_app_components(app, build_dir)
        
        # Generate styles
        await self._generate_app_styles(app, build_dir)
    
    async def _deploy_to_kubernetes(self, app: App, config: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy app to Kubernetes cluster"""
        
        namespace = self.deployment_configs["kubernetes"]["namespace"]
        app_name = f"webcraft-app-{app.slug}"
        
        # Create namespace if it doesn't exist
        try:
            self.k8s_core_v1.create_namespace(
                body=client.V1Namespace(metadata=client.V1ObjectMeta(name=namespace))
            )
        except client.ApiException as e:
            if e.status != 409:  # Ignore if namespace already exists
                raise
        
        # Create deployment
        deployment = client.V1Deployment(
            metadata=client.V1ObjectMeta(name=app_name, namespace=namespace),
            spec=client.V1DeploymentSpec(
                replicas=config["resources"]["replicas"],
                selector=client.V1LabelSelector(
                    match_labels={"app": app_name}
                ),
                template=client.V1PodTemplateSpec(
                    metadata=client.V1ObjectMeta(labels={"app": app_name}),
                    spec=client.V1PodSpec(
                        containers=[
                            client.V1Container(
                                name=app_name,
                                image=f"webcraft/app:{app.id}",
                                ports=[client.V1ContainerPort(container_port=3000)],
                                env=[
                                    client.V1EnvVar(name=k, value=v)
                                    for k, v in config["environment"].items()
                                ],
                                resources=client.V1ResourceRequirements(
                                    requests={
                                        "cpu": config["resources"]["cpu"],
                                        "memory": config["resources"]["memory"]
                                    }
                                ),
                                liveness_probe=client.V1Probe(
                                    http_get=client.V1HTTPGetAction(
                                        path=config["health_check"]["path"],
                                        port=config["health_check"]["port"]
                                    ),
                                    initial_delay_seconds=config["health_check"]["initial_delay"],
                                    period_seconds=config["health_check"]["period"]
                                )
                            )
                        ]
                    )
                )
            )
        )
        
        # Apply deployment
        try:
            self.k8s_apps_v1.create_namespaced_deployment(
                namespace=namespace,
                body=deployment
            )
        except client.ApiException as e:
            if e.status == 409:  # Update if exists
                self.k8s_apps_v1.patch_namespaced_deployment(
                    name=app_name,
                    namespace=namespace,
                    body=deployment
                )
            else:
                raise
        
        # Create service
        service = client.V1Service(
            metadata=client.V1ObjectMeta(name=app_name, namespace=namespace),
            spec=client.V1ServiceSpec(
                selector={"app": app_name},
                ports=[
                    client.V1ServicePort(
                        port=80,
                        target_port=3000,
                        protocol="TCP"
                    )
                ],
                type="ClusterIP"
            )
        )
        
        try:
            self.k8s_core_v1.create_namespaced_service(
                namespace=namespace,
                body=service
            )
        except client.ApiException as e:
            if e.status == 409:  # Update if exists
                self.k8s_core_v1.patch_namespaced_service(
                    name=app_name,
                    namespace=namespace,
                    body=service
                )
            else:
                raise
        
        # Create ingress
        ingress = client.V1Ingress(
            metadata=client.V1ObjectMeta(
                name=app_name,
                namespace=namespace,
                annotations={
                    "kubernetes.io/ingress.class": "nginx",
                    "cert-manager.io/cluster-issuer": "letsencrypt-prod"
                }
            ),
            spec=client.V1IngressSpec(
                rules=[
                    client.V1IngressRule(
                        host=f"{app.slug}.webcraft.dev",
                        http=client.V1HTTPIngressRuleValue(
                            paths=[
                                client.V1HTTPIngressPath(
                                    path="/",
                                    path_type="Prefix",
                                    backend=client.V1IngressBackend(
                                        service=client.V1IngressServiceBackend(
                                            name=app_name,
                                            port=client.V1ServiceBackendPort(number=80)
                                        )
                                    )
                                )
                            ]
                        )
                    )
                ],
                tls=[
                    client.V1IngressTLS(
                        hosts=[f"{app.slug}.webcraft.dev"],
                        secret_name=f"{app_name}-tls"
                    )
                ]
            )
        )
        
        try:
            self.k8s_networking_v1.create_namespaced_ingress(
                namespace=namespace,
                body=ingress
            )
        except client.ApiException as e:
            if e.status == 409:  # Update if exists
                self.k8s_networking_v1.patch_namespaced_ingress(
                    name=app_name,
                    namespace=namespace,
                    body=ingress
                )
            else:
                raise
        
        return {
            "deployment_id": f"k8s-{app_name}",
            "service_url": f"https://{app.slug}.webcraft.dev",
            "platform": "kubernetes",
            "namespace": namespace,
            "service_name": app_name
        }
    
    async def _deploy_to_vercel(self, app: App, config: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy app to Vercel"""
        
        vercel_config = self.deployment_configs["vercel"]
        
        async with aiohttp.ClientSession() as session:
            # Create deployment
            deployment_data = {
                "name": f"webcraft-app-{app.slug}",
                "files": config["build_files"],
                "projectSettings": {
                    "framework": "nextjs"
                },
                "env": config["environment"]
            }
            
            async with session.post(
                f"{vercel_config['api_url']}/v13/deployments",
                headers={
                    "Authorization": f"Bearer {vercel_config['api_token']}",
                    "Content-Type": "application/json"
                },
                json=deployment_data
            ) as response:
                if response.status != 200:
                    raise Exception(f"Vercel deployment failed: {await response.text()}")
                
                result = await response.json()
                
                return {
                    "deployment_id": result["id"],
                    "service_url": f"https://{result['url']}",
                    "platform": "vercel",
                    "vercel_url": result["url"]
                }
    
    async def unpublish_app(self, app: App) -> Dict[str, Any]:
        """Unpublish an app (remove from hosting)"""
        
        try:
            deployment_config = app.config.get("deployment", {})
            platform = deployment_config.get("platform", "kubernetes")
            
            if platform == "kubernetes":
                await self._remove_from_kubernetes(app)
            elif platform == "vercel":
                await self._remove_from_vercel(app)
            elif platform == "netlify":
                await self._remove_from_netlify(app)
            
            # Update app status
            app.is_published = False
            app.updated_at = datetime.utcnow()
            self.db.commit()
            
            return {"success": True, "message": "App unpublished successfully"}
        
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def create_preview(self, app: App) -> str:
        """Create a temporary preview URL for the app"""
        
        preview_id = str(uuid.uuid4())[:8]
        preview_url = f"https://preview-{preview_id}.webcraft.dev"
        
        # Deploy to preview environment (simplified deployment)
        preview_config = await self._generate_deployment_config(app)
        preview_config["environment"]["PREVIEW_MODE"] = "true"
        
        # This would deploy to a preview cluster or use a preview service
        # For now, return a mock preview URL
        
        return preview_url
    
    async def get_deployment_status(self, app: App) -> Dict[str, Any]:
        """Get the current deployment status of an app"""
        
        if not app.is_published:
            return {"status": "not_deployed", "message": "App is not published"}
        
        deployment_config = app.config.get("deployment", {})
        platform = deployment_config.get("platform", "kubernetes")
        
        try:
            if platform == "kubernetes":
                status = await self._get_kubernetes_status(app)
            elif platform == "vercel":
                status = await self._get_vercel_status(app)
            else:
                status = {"status": "unknown", "platform": platform}
            
            return status
        
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def _get_kubernetes_status(self, app: App) -> Dict[str, Any]:
        """Get Kubernetes deployment status"""
        
        namespace = self.deployment_configs["kubernetes"]["namespace"]
        app_name = f"webcraft-app-{app.slug}"
        
        try:
            deployment = self.k8s_apps_v1.read_namespaced_deployment(
                name=app_name,
                namespace=namespace
            )
            
            return {
                "status": "running" if deployment.status.ready_replicas else "pending",
                "replicas": {
                    "desired": deployment.spec.replicas,
                    "ready": deployment.status.ready_replicas or 0,
                    "available": deployment.status.available_replicas or 0
                },
                "platform": "kubernetes",
                "last_updated": deployment.metadata.creation_timestamp.isoformat()
            }
        
        except client.ApiException as e:
            if e.status == 404:
                return {"status": "not_found", "platform": "kubernetes"}
            raise
    
    async def _setup_custom_domain(self, app: App, domain: str, service_url: str):
        """Set up custom domain for the app"""
        
        await self.domain_service.configure_domain(
            domain=domain,
            target_url=service_url,
            app_id=str(app.id)
        )
    
    async def _setup_subdomain(self, app: App, subdomain: str, service_url: str):
        """Set up subdomain under webcraft.dev"""
        
        full_domain = f"{subdomain}.webcraft.dev"
        await self.domain_service.configure_subdomain(
            subdomain=subdomain,
            target_url=service_url,
            app_id=str(app.id)
        )