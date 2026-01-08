"""
Email Service for WebCraft Platform
Handles transactional emails, marketing campaigns, and newsletters
"""

import os
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
        self.development_mode = os.getenv("ENVIRONMENT") == "development"
        
        logger.info(f"Initializing EmailService - Environment: {os.getenv('ENVIRONMENT')}")
        logger.info(f"SendGrid API Key present: {bool(os.getenv('SENDGRID_API_KEY'))}")
        logger.info(f"SMTP Host: {os.getenv('SMTP_HOST')}")
        logger.info(f"SMTP User: {os.getenv('SMTP_USER')}")
        
        # Try SendGrid first
        if not self.development_mode and os.getenv("SENDGRID_API_KEY"):
            try:
                self.sendgrid_client = SendGridAPIClient(settings.SENDGRID_API_KEY)
                self.from_email = Email(settings.FROM_EMAIL, settings.FROM_NAME)
                self.email_backend = "sendgrid"
                logger.info("Email backend: SendGrid configured successfully")
            except Exception as e:
                logger.error(f"SendGrid configuration failed: {e}")
                self.sendgrid_client = None
                self.from_email = None
                self.email_backend = "smtp"
        # Try SMTP if SendGrid not available
        elif not self.development_mode and os.getenv("SMTP_HOST") and os.getenv("SMTP_USER"):
            self.sendgrid_client = None
            self.from_email = None
            self.email_backend = "smtp"
            self.smtp_config = {
                "hostname": settings.SMTP_HOST,
                "port": settings.SMTP_PORT,
                "username": settings.SMTP_USER,
                "password": settings.SMTP_PASSWORD,
                "use_tls": settings.SMTP_PORT in [587, 25],
                "start_tls": settings.SMTP_PORT == 587
            }
            logger.info("Email backend: SMTP configured successfully")
        else:
            # Development mode - just log emails
            self.sendgrid_client = None
            self.from_email = None
            self.email_backend = "development"
            self.development_mode = True
            logger.info("Email backend: Development mode (logging only)")
        
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
        
        # Development mode - just log the email
        if self.email_backend == "development":
            logger.info(f"[DEV MODE] Email would be sent to: {to_email}")
            logger.info(f"[DEV MODE] Subject: {subject}")
            logger.info(f"[DEV MODE] Template: {template}")
            logger.info(f"[DEV MODE] Template Data: {template_data}")
            
            return {
                "success": True,
                "message_id": f"dev-{datetime.now().timestamp()}",
                "status": "development_mode"
            }
        
        # Use SMTP backend
        if self.email_backend == "smtp":
            return await self._send_smtp_email(
                to_email, subject, template, template_data, 
                from_email, from_name, attachments
            )
        
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
            logger.error(f"Failed to send email to {to_email} using template {template}: {e}")
            
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
    
    async def _send_smtp_email(
        self,
        to_email: str,
        subject: str,
        template: str,
        template_data: Dict[str, Any],
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Send email using SMTP"""
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{from_name or settings.FROM_NAME} <{from_email or settings.FROM_EMAIL}>"
            message["To"] = to_email
            
            # Render template
            if template.endswith(".html") or "/" in template:
                # Custom template
                html_content = await self._render_template(template, template_data)
            else:
                # Simple template
                html_content = await self._render_simple_template(template, template_data)
            
            # Add HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Add attachments
            if attachments:
                for att in attachments:
                    # Handle attachments if needed
                    pass
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=self.smtp_config["hostname"],
                port=self.smtp_config["port"],
                username=self.smtp_config["username"],
                password=self.smtp_config["password"],
                use_tls=self.smtp_config["use_tls"],
                start_tls=self.smtp_config["start_tls"]
            )
            
            logger.info(f"SMTP email sent successfully to {to_email}")
            
            return {
                "success": True,
                "message_id": f"smtp-{datetime.now().timestamp()}",
                "backend": "smtp"
            }
            
        except Exception as e:
            logger.error(f"SMTP email failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "backend": "smtp"
            }
    
    async def _render_simple_template(
        self,
        template_type: str,
        data: Dict[str, Any]
    ) -> str:
        """Render simple email templates"""
        
        if template_type == EmailTemplate.EMAIL_VERIFICATION:
            return f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Verify Your Email</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to WebCraft!</h1>
                        <p>Please verify your email address</p>
                    </div>
                    <div class="content">
                        <p>Hi there!</p>
                        <p>Thanks for signing up for WebCraft. To complete your registration, please verify your email address by clicking the button below:</p>
                        <p style="text-align: center;">
                            <a href="{data.get('verification_url', '#')}" class="button">Verify Email Address</a>
                        </p>
                        <p>This link will expire in {data.get('expires_in', '24 hours')}.</p>
                        <p>If you didn't create an account with WebCraft, you can safely ignore this email.</p>
                        <p>Best regards,<br>The WebCraft Team</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 WebCraft. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        
        elif template_type == EmailTemplate.WELCOME:
            return f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Welcome to WebCraft</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚀 Welcome to WebCraft!</h1>
                    </div>
                    <div class="content">
                        <p>Hi {data.get('name', 'there')}!</p>
                        <p>Welcome to WebCraft! We're excited to have you on board.</p>
                        <p>You can now start building amazing apps with our no-code platform.</p>
                        <p style="text-align: center;">
                            <a href="{data.get('dashboard_url', '#')}" class="button">Go to Dashboard</a>
                        </p>
                        <p>If you have any questions, feel free to reach out to our support team.</p>
                        <p>Happy building!<br>The WebCraft Team</p>
                    </div>
                </div>
            </body>
            </html>
            """
        
        else:
            # Generic template
            return f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>WebCraft Notification</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>WebCraft Notification</h2>
                    <p>This is a notification from WebCraft.</p>
                    <pre>{data}</pre>
                </div>
            </body>
            </html>
            """

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