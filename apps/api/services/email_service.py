"""
Email Service for WebCraft Platform
Handles transactional emails, marketing campaigns, and newsletters
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Mail, Email, To, Content, Attachment, 
    FileContent, FileName, FileType, Disposition,
    TemplateId, DynamicTemplateData, Category,
    Personalization, Asm, GroupId, GroupsToDisplay
)
import base64
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path

from core.config import settings
from core.logging import get_logger
from core.kafka_client import event_publisher, EventType

logger = get_logger(__name__)

# Email templates directory
TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "email"


class EmailTemplate:
    """Email template definitions"""
    
    # Transactional
    WELCOME = "welcome"
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"
    PASSWORD_CHANGED = "password_changed"
    
    # Account
    SUBSCRIPTION_CREATED = "subscription_created"
    SUBSCRIPTION_CANCELLED = "subscription_cancelled"
    PAYMENT_SUCCEEDED = "payment_succeeded"
    PAYMENT_FAILED = "payment_failed"
    
    # App
    APP_PUBLISHED = "app_published"
    APP_DEPLOYMENT_FAILED = "app_deployment_failed"
    DOMAIN_CONFIGURED = "domain_configured"
    
    # Collaboration
    TEAM_INVITATION = "team_invitation"
    COMMENT_NOTIFICATION = "comment_notification"
    
    # Marketing
    NEWSLETTER = "newsletter"
    PRODUCT_UPDATE = "product_update"
    PROMOTIONAL = "promotional"
    
    # System
    SECURITY_ALERT = "security_alert"
    USAGE_WARNING = "usage_warning"


class EmailService:
    """
    Production-grade email service with:
    - SendGrid integration
    - Template rendering
    - Batch sending
    - Analytics tracking
    - Unsubscribe handling
    """
    
    def __init__(self):
        self.sendgrid_client = SendGridAPIClient(settings.SENDGRID_API_KEY)
        self.from_email = Email(settings.FROM_EMAIL, settings.FROM_NAME)
        
        # Initialize Jinja2 for custom templates
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(TEMPLATES_DIR)),
            autoescape=select_autoescape(['html', 'xml']),
            enable_async=True
        )
        
        # SendGrid template IDs (configure in SendGrid dashboard)
        self.sendgrid_templates = {
            EmailTemplate.WELCOME: "d-xxxxx",
            EmailTemplate.EMAIL_VERIFICATION: "d-xxxxx",
            EmailTemplate.PASSWORD_RESET: "d-xxxxx",
            EmailTemplate.SUBSCRIPTION_CREATED: "d-xxxxx",
            EmailTemplate.APP_PUBLISHED: "d-xxxxx",
            EmailTemplate.NEWSLETTER: "d-xxxxx",
        }
        
        # Unsubscribe group IDs
        self.unsubscribe_groups = {
            "transactional": 12345,
            "marketing": 12346,
            "newsletter": 12347,
            "product_updates": 12348,
        }
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        template: str,
        template_data: Dict[str, Any],
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        categories: Optional[List[str]] = None,
        unsubscribe_group: Optional[str] = None,
        send_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Send a single email using SendGrid
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            template: Template name or SendGrid template ID
            template_data: Data for template rendering
            from_email: Override sender email
            from_name: Override sender name
            attachments: List of attachments
            categories: Email categories for analytics
            unsubscribe_group: Unsubscribe group name
            send_at: Schedule send time
        
        Returns:
            Send result with message ID
        """
        try:
            # Create message
            message = Mail()
            
            # Set sender
            if from_email:
                message.from_email = Email(from_email, from_name or settings.FROM_NAME)
            else:
                message.from_email = self.from_email
            
            # Set recipient
            message.to = To(to_email)
            
            # Set subject
            message.subject = subject
            
            # Check if using SendGrid template
            if template.startswith("d-"):
                message.template_id = TemplateId(template)
                message.dynamic_template_data = DynamicTemplateData(template_data)
            elif template in self.sendgrid_templates:
                message.template_id = TemplateId(self.sendgrid_templates[template])
                message.dynamic_template_data = DynamicTemplateData(template_data)
            else:
                # Render custom template
                html_content = await self._render_template(template, template_data)
                message.content = Content("text/html", html_content)
            
            # Add attachments
            if attachments:
                for att in attachments:
                    attachment = Attachment(
                        FileContent(base64.b64encode(att["content"]).decode()),
                        FileName(att["filename"]),
                        FileType(att.get("type", "application/octet-stream")),
                        Disposition("attachment")
                    )
                    message.attachment = attachment
            
            # Add categories for analytics
            if categories:
                for cat in categories:
                    message.category = Category(cat)
            
            # Set unsubscribe group
            if unsubscribe_group and unsubscribe_group in self.unsubscribe_groups:
                message.asm = Asm(
                    GroupId(self.unsubscribe_groups[unsubscribe_group]),
                    GroupsToDisplay([
                        self.unsubscribe_groups[unsubscribe_group]
                    ])
                )
            
            # Schedule send
            if send_at:
                message.send_at = int(send_at.timestamp())
            
            # Send email
            response = self.sendgrid_client.send(message)
            
            # Log success
            logger.info(
                f"Email sent successfully",
                to=to_email,
                template=template,
                status_code=response.status_code
            )
            
            # Publish event
            await event_publisher.publish_user_event(
                EventType.EMAIL_SENT,
                user_id=to_email,  # Using email as identifier
                data={
                    "template": template,
                    "subject": subject,
                    "status_code": response.status_code
                }
            )
            
            return {
                "success": True,
                "message_id": response.headers.get("X-Message-Id"),
                "status_code": response.status_code
            }
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}", to=to_email, template=template)
            
            # Publish failure event
            await event_publisher.publish_user_event(
                EventType.EMAIL_FAILED,
                user_id=to_email,
                data={
                    "template": template,
                    "error": str(e)
                }
            )
            
            return {
                "success": False,
                "error": str(e)
            }
    
    async def send_batch(
        self,
        recipients: List[Dict[str, Any]],
        subject: str,
        template: str,
        common_data: Dict[str, Any] = None,
        categories: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Send batch emails with personalization
        
        Args:
            recipients: List of {email, data} dicts
            subject: Email subject
            template: Template name
            common_data: Data common to all recipients
            categories: Email categories
        
        Returns:
            Batch send results
        """
        try:
            message = Mail()
            message.from_email = self.from_email
            message.subject = subject
            
            # Set template
            if template in self.sendgrid_templates:
                message.template_id = TemplateId(self.sendgrid_templates[template])
            
            # Add personalizations for each recipient
            for recipient in recipients:
                personalization = Personalization()
                personalization.add_to(To(recipient["email"]))
                
                # Merge common data with recipient-specific data
                template_data = {**(common_data or {}), **(recipient.get("data", {}))}
                personalization.dynamic_template_data = template_data
                
                message.add_personalization(personalization)
            
            # Add categories
            if categories:
                for cat in categories:
                    message.category = Category(cat)
            
            # Send batch
            response = self.sendgrid_client.send(message)
            
            logger.info(
                f"Batch email sent",
                recipient_count=len(recipients),
                template=template,
                status_code=response.status_code
            )
            
            return {
                "success": True,
                "recipient_count": len(recipients),
                "status_code": response.status_code
            }
            
        except Exception as e:
            logger.error(f"Failed to send batch email: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _render_template(
        self,
        template_name: str,
        data: Dict[str, Any]
    ) -> str:
        """Render Jinja2 template"""
        try:
            template = self.jinja_env.get_template(f"{template_name}.html")
            return await template.render_async(**data)
        except Exception as e:
            logger.error(f"Template rendering failed: {e}")
            raise
    
    # ==================== Transactional Emails ====================
    
    async def send_welcome_email(
        self,
        email: str,
        name: str,
        verification_url: str
    ) -> Dict[str, Any]:
        """Send welcome email to new user"""
        return await self.send_email(
            to_email=email,
            subject="Welcome to WebCraft! 🚀",
            template=EmailTemplate.WELCOME,
            template_data={
                "name": name,
                "verification_url": verification_url,
                "dashboard_url": f"https://{settings.BASE_DOMAIN}/dashboard"
            },
            categories=["transactional", "welcome"]
        )
    
    async def send_verification_email(
        self,
        email: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Send email verification link"""
        from core.auth import AuthService
        
        # Generate verification token
        token = AuthService.create_access_token(
            data={"sub": str(user_id), "type": "email_verification"},
            expires_delta=timedelta(hours=24)
        )
        
        verification_url = f"https://{settings.BASE_DOMAIN}/verify-email?token={token}"
        
        return await self.send_email(
            to_email=email,
            subject="Verify your email address",
            template=EmailTemplate.EMAIL_VERIFICATION,
            template_data={
                "verification_url": verification_url,
                "expires_in": "24 hours"
            },
            categories=["transactional", "verification"]
        )
    
    async def send_password_reset_email(
        self,
        email: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Send password reset link"""
        from core.auth import AuthService
        from datetime import timedelta
        
        # Generate reset token
        token = AuthService.create_access_token(
            data={"sub": str(user_id), "type": "password_reset"},
            expires_delta=timedelta(hours=1)
        )
        
        reset_url = f"https://{settings.BASE_DOMAIN}/reset-password?token={token}"
        
        return await self.send_email(
            to_email=email,
            subject="Reset your password",
            template=EmailTemplate.PASSWORD_RESET,
            template_data={
                "reset_url": reset_url,
                "expires_in": "1 hour"
            },
            categories=["transactional", "password_reset"]
        )
    
    async def send_app_published_email(
        self,
        email: str,
        app_name: str,
        app_url: str,
        domain: str
    ) -> Dict[str, Any]:
        """Send notification when app is published"""
        return await self.send_email(
            to_email=email,
            subject=f"🎉 {app_name} is now live!",
            template=EmailTemplate.APP_PUBLISHED,
            template_data={
                "app_name": app_name,
                "app_url": app_url,
                "domain": domain,
                "dashboard_url": f"https://{settings.BASE_DOMAIN}/dashboard"
            },
            categories=["transactional", "deployment"]
        )
    
    async def send_payment_succeeded_email(
        self,
        email: str,
        name: str,
        plan: str,
        amount: float,
        invoice_url: str
    ) -> Dict[str, Any]:
        """Send payment confirmation"""
        return await self.send_email(
            to_email=email,
            subject="Payment received - Thank you!",
            template=EmailTemplate.PAYMENT_SUCCEEDED,
            template_data={
                "name": name,
                "plan": plan,
                "amount": f"${amount:.2f}",
                "invoice_url": invoice_url
            },
            categories=["transactional", "payment"]
        )
    
    # ==================== Marketing Emails ====================
    
    async def send_newsletter(
        self,
        recipients: List[Dict[str, Any]],
        subject: str,
        content: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send newsletter to subscribers"""
        return await self.send_batch(
            recipients=recipients,
            subject=subject,
            template=EmailTemplate.NEWSLETTER,
            common_data=content,
            categories=["marketing", "newsletter"]
        )
    
    async def send_product_update(
        self,
        recipients: List[Dict[str, Any]],
        update_title: str,
        features: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Send product update announcement"""
        return await self.send_batch(
            recipients=recipients,
            subject=f"New in WebCraft: {update_title}",
            template=EmailTemplate.PRODUCT_UPDATE,
            common_data={
                "update_title": update_title,
                "features": features
            },
            categories=["marketing", "product_update"]
        )
    
    # ==================== Team/Collaboration Emails ====================
    
    async def send_team_invitation(
        self,
        email: str,
        inviter_name: str,
        organization_name: str,
        role: str,
        invitation_url: str
    ) -> Dict[str, Any]:
        """Send team invitation email"""
        return await self.send_email(
            to_email=email,
            subject=f"{inviter_name} invited you to join {organization_name}",
            template=EmailTemplate.TEAM_INVITATION,
            template_data={
                "inviter_name": inviter_name,
                "organization_name": organization_name,
                "role": role,
                "invitation_url": invitation_url
            },
            categories=["transactional", "invitation"]
        )


# Global email service instance
email_service = EmailService()


# Import timedelta for token generation
from datetime import timedelta