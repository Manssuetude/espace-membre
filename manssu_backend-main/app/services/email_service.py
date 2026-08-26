"""
Email service for sending transactional emails via Resend or MailerSend API.
"""
import logging
import requests
from typing import Optional, List
from html import unescape
import re

from app.core.config import settings

logger = logging.getLogger(__name__)


def strip_tags(html: str) -> str:
    """
    Strip HTML tags from a string.
    
    Args:
        html: HTML string
        
    Returns:
        Plain text string
    """
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', html)
    # Decode HTML entities
    text = unescape(text)
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


class MailerSendEmailService:
    """
    Service for sending transactional emails via MailerSend API.
    """
    
    API_BASE_URL = "https://api.mailersend.com/v1"
    EMAIL_ENDPOINT = f"{API_BASE_URL}/email"
    
    def __init__(self):
        self.api_key = getattr(settings, 'MAILERSEND_API_KEY', '')
        self.from_email = getattr(settings, 'MAILERSEND_FROM_EMAIL', 'contact@pumpyfamilylife.com')
        self.from_name = getattr(settings, 'MAILERSEND_FROM_NAME', 'Manssuétude')
        
        logger.info(f"📧 MailerSendEmailService initialized")
        logger.info(f"   From: {self.from_name} <{self.from_email}>")
        logger.info(f"   API Key: {'✅ Configured' if self.api_key else '❌ Not configured'}")
        
        if not self.api_key:
            logger.warning("⚠️ MAILERSEND_API_KEY not configured in settings - emails will not be sent")
    
    def _send_email(
        self,
        to_email: str,
        to_name: Optional[str] = None,
        subject: str = "",
        html_content: str = "",
        text_content: Optional[str] = None,
        reply_to: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> bool:
        """
        Send an email via MailerSend API.
        
        Args:
            to_email: Recipient email address
            to_name: Recipient name (optional)
            subject: Email subject
            html_content: HTML email body
            text_content: Plain text email body (optional, auto-generated from HTML if not provided)
            reply_to: Reply-to email address (optional)
            tags: List of tags for tracking (optional)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        logger.info("=" * 80)
        logger.info(f"📧 Sending email via MailerSend")
        logger.info(f"   To: {to_name or '(no name)'} <{to_email}>")
        logger.info(f"   Subject: {subject}")
        logger.info(f"   From: {self.from_name} <{self.from_email}>")
        
        if not self.api_key:
            logger.error("❌ Cannot send email: MAILERSEND_API_KEY not configured")
            return False
        
        if not to_email:
            logger.error("❌ Cannot send email: recipient email is required")
            return False
        
        # Generate text content from HTML if not provided
        if not text_content:
            text_content = strip_tags(html_content)
            logger.debug(f"   Generated text content from HTML ({len(text_content)} chars)")
        else:
            logger.debug(f"   Using provided text content ({len(text_content)} chars)")
        
        logger.debug(f"   HTML content length: {len(html_content)} chars")
        
        # Prepare payload
        payload = {
            "from": {
                "email": self.from_email,
                "name": self.from_name
            },
            "to": [
                {
                    "email": to_email,
                    "name": to_name or ""
                }
            ],
            "subject": subject,
            "html": html_content,
            "text": text_content
        }
        
        # Add reply-to if provided
        if reply_to:
            payload["reply_to"] = {
                "email": reply_to,
                "name": self.from_name
            }
            logger.debug(f"   Reply-To: {reply_to}")
        
        # Add tags if provided
        if tags:
            payload["tags"] = tags
            logger.debug(f"   Tags: {', '.join(tags)}")
        
        # Prepare headers (for logging, don't expose full API key)
        headers_for_logging = {
            "Authorization": f"Bearer {self.api_key[:10]}..." if len(self.api_key) > 10 else "Bearer ***",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        }
        
        # Actual headers for request (with full API key)
        request_headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
        }
        
        logger.info(f"   Endpoint: {self.EMAIL_ENDPOINT}")
        logger.debug(f"   Headers: {', '.join([k for k in headers_for_logging.keys()])}")
        logger.debug(f"   Payload size: {len(str(payload))} chars")
        
        try:
            logger.info(f"   Sending request to MailerSend API...")
            response = requests.post(
                self.EMAIL_ENDPOINT,
                json=payload,
                headers=request_headers,
                timeout=30
            )
            
            logger.info(f"   Response Status: {response.status_code}")
            logger.debug(f"   Response Headers: {dict(response.headers)}")
            
            if response.status_code == 202:
                logger.info(f"✅ Email sent successfully to {to_email}")
                logger.info(f"   Subject: {subject}")
                logger.debug(f"   Response Body: {response.text[:200] if response.text else 'No body'}")
                logger.info("=" * 80)
                return True
            else:
                logger.error(f"❌ Failed to send email to {to_email}")
                logger.error(f"   Status Code: {response.status_code}")
                logger.error(f"   Response: {response.text}")
                logger.error("=" * 80)
                return False
                
        except requests.exceptions.Timeout as e:
            logger.error(f"❌ Timeout sending email to {to_email}: {str(e)}")
            logger.error("=" * 80)
            return False
        except requests.exceptions.ConnectionError as e:
            logger.error(f"❌ Connection error sending email to {to_email}: {str(e)}")
            logger.error("=" * 80)
            return False
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Request error sending email to {to_email}: {str(e)}")
            logger.error(f"   Error type: {type(e).__name__}")
            logger.error("=" * 80)
            return False
        except Exception as e:
            logger.error(f"❌ Unexpected error sending email to {to_email}: {str(e)}")
            logger.error(f"   Error type: {type(e).__name__}")
            import traceback
            logger.error(f"   Traceback: {traceback.format_exc()}")
            logger.error("=" * 80)
            return False
    
    def _render_otp_template(
        self,
        name: str,
        otp_code: str,
        expiration_minutes: int
    ) -> str:
        """
        Render OTP email template for MANSSU platform (French only).
        
        Args:
            name: Recipient name
            otp_code: OTP code
            expiration_minutes: OTP expiration in minutes
            
        Returns:
            str: Rendered HTML content
        """
        # Red color scheme for MANSSU branding
        primary_color = "#dc2626"  # Red-600
        background_color = "#fef2f2"  # Red-50
        border_color = "#fca5a5"  # Red-300
        text_color = "#1f2937"  # Gray-800
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: {text_color}; margin: 0; padding: 0; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: {primary_color}; margin: 0; font-size: 28px; font-weight: 700;">{self.from_name}</h1>
                    </div>
                    <h2 style="color: {text_color}; font-size: 24px; font-weight: 600; margin-bottom: 20px;">Votre code de vérification</h2>
                    <p style="color: {text_color}; font-size: 16px; margin-bottom: 10px;">Bonjour {name},</p>
                    <p style="color: {text_color}; font-size: 16px; margin-bottom: 30px;">Votre code de vérification est :</p>
                    <div style="background-color: {background_color}; border: 2px solid {border_color}; padding: 30px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 30px 0; border-radius: 8px; color: {primary_color};">
                        {otp_code}
                    </div>
                    <p style="color: {text_color}; font-size: 14px; margin-bottom: 10px;">Ce code expire dans <strong>{expiration_minutes} minutes</strong>.</p>
                    <p style="color: #6b7280; font-size: 14px; margin-bottom: 30px;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">Cordialement,<br><strong style="color: {primary_color};">L'équipe {self.from_name}</strong></p>
                </div>
                <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
            </div>
        </body>
        </html>
        """
        return html
    
    # ==================== OTP & Authentication Emails ====================
    
    def send_otp_email(
        self,
        to_email: str,
        to_name: str,
        otp_code: str
    ) -> bool:
        """
        Send OTP code email (French only).
        
        Args:
            to_email: Recipient email
            to_name: Recipient name
            otp_code: OTP code to send
            
        Returns:
            bool: True if sent successfully
        """
        logger.info(f"🔐 Preparing OTP email")
        logger.info(f"   Recipient: {to_name} <{to_email}>")
        logger.info(f"   OTP Code: {otp_code}")
        
        expiration_minutes = settings.OTP_EXPIRY_MINUTES
        logger.debug(f"   OTP Expiration: {expiration_minutes} minutes")
        
        # Render HTML template
        logger.debug("   Rendering email template...")
        html_content = self._render_otp_template(
            name=to_name,
            otp_code=otp_code,
            expiration_minutes=expiration_minutes
        )
        
        if not html_content:
            logger.error("❌ Failed to render email template")
            return False
        
        logger.debug(f"   Template rendered successfully ({len(html_content)} chars)")
        
        subject = f"Votre code de vérification - {self.from_name}"
        logger.info(f"   Subject: {subject}")
        
        # Send email
        result = self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["otp", "verification"]
        )
        
        if result:
            logger.info(f"✅ OTP email sent successfully to {to_email}")
        else:
            logger.error(f"❌ Failed to send OTP email to {to_email}")
        
        return result
    
    # ==================== Notification Emails ====================
    
    def send_theme_window_opened_email(
        self,
        to_email: str,
        to_name: str,
        end_date: str
    ) -> bool:
        """Send email notification when theme window is opened"""
        subject = f"Fenêtre de proposition de thèmes ouverte - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Fenêtre de proposition de thèmes ouverte",
            message=f"Une nouvelle fenêtre de proposition de thèmes est maintenant ouverte. Vous pouvez soumettre vos propositions jusqu'au {end_date}.",
            action_text="Proposer un thème",
            action_url=None  # Frontend URL would go here
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["theme-window", "notification"]
        )
    
    def send_theme_window_closed_email(
        self,
        to_email: str,
        to_name: str
    ) -> bool:
        """Send email notification when theme window is closed"""
        subject = f"Fenêtre de proposition de thèmes fermée - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Fenêtre de proposition de thèmes fermée",
            message="La fenêtre de proposition de thèmes est maintenant fermée. Les thèmes proposés sont en cours d'examen par l'équipe.",
            action_text=None,
            action_url=None
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["theme-window", "notification"]
        )
    
    def send_theme_poll_created_email(
        self,
        to_email: str,
        to_name: str,
        poll_title: str,
        poll_question: str
    ) -> bool:
        """Send email notification when theme selection poll is created"""
        subject = f"Sondage de sélection de thème créé - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Sondage de sélection de thème créé",
            message=f"Un nouveau sondage a été créé pour sélectionner le thème de la prochaine session. La fenêtre de proposition de thèmes est maintenant fermée.",
            details={
                "Titre": poll_title,
                "Question": poll_question
            },
            action_text="Participer au sondage",
            action_url="https://membre.manssuetude.com/sondages"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["theme-poll", "notification"]
        )
    
    def send_poll_created_email(
        self,
        to_email: str,
        to_name: str,
        poll_title: str,
        poll_question: str,
        end_date: str = None
    ) -> bool:
        """Send email notification when a poll is created"""
        end_date_text = f" jusqu'au {end_date}" if end_date else ""
        subject = f"Nouveau sondage : {poll_title} - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Nouveau sondage disponible",
            message=f"Un nouveau sondage a été créé{end_date_text}.",
            details={
                "Titre": poll_title,
                "Question": poll_question
            },
            action_text="Participer au sondage",
            action_url="https://membre.manssuetude.com/sondages"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["poll", "notification"]
        )
    
    def send_poll_reminder_email(
        self,
        to_email: str,
        to_name: str,
        poll_title: str,
        poll_question: str,
        end_date: str = None
    ) -> bool:
        """Send email reminder to vote on a poll"""
        end_date_text = f" jusqu'au {end_date}" if end_date else ""
        subject = f"Rappel : N'oubliez pas de voter - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Rappel de vote",
            message=f"Vous n'avez pas encore participé au sondage suivant{end_date_text}. Votre avis compte !",
            details={
                "Titre": poll_title,
                "Question": poll_question
            },
            action_text="Voter maintenant",
            action_url="https://membre.manssuetude.com/sondages"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["poll", "reminder"]
        )

    def send_library_queue_offer_email(
        self,
        to_email: str,
        to_name: str,
        book_title: str,
        offer_expires_at: Optional[str] = None,
    ) -> bool:
        """Send email when user is next in queue for a book."""
        expires_text = f" avant le {offer_expires_at}" if offer_expires_at else ""
        subject = f"Un livre vous attend : {book_title} - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Livre disponible pour vous",
            message=f"Bonne nouvelle ! Vous êtes prioritaire pour emprunter « {book_title} ». Merci de confirmer{expires_text}.",
            action_text="Voir la bibliothèque",
            action_url="https://membre.manssuetude.com/association/bibliotheque",
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["library", "queue-offer"]
        )

    def send_library_wishlist_match_email(
        self,
        to_email: str,
        to_name: str,
        book_title: str,
        book_author: Optional[str] = None,
    ) -> bool:
        """Send email when a wishlist item matches a newly listed book."""
        author_text = f" de {book_author}" if book_author else ""
        subject = f"Wishlist: livre trouvé - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Livre trouvé dans la bibliothèque",
            message=f"Le livre « {book_title} »{author_text} vient d'être ajouté et correspond à votre wishlist.",
            action_text="Voir le livre",
            action_url="https://membre.manssuetude.com/association/bibliotheque",
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["library", "wishlist-match"]
        )

    def send_library_loan_due_reminder_email(
        self,
        to_email: str,
        to_name: str,
        book_title: str,
        due_at: Optional[str] = None,
    ) -> bool:
        """Send loan due reminder email."""
        due_text = f" (date limite: {due_at})" if due_at else ""
        subject = f"Rappel de retour de livre - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Rappel de retour",
            message=f"Le prêt de « {book_title} » arrive bientôt à échéance{due_text}.",
            action_text="Voir mes prêts",
            action_url="https://membre.manssuetude.com/association/bibliotheque",
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["library", "due-reminder"]
        )

    def send_library_loan_created_email(
        self,
        to_email: str,
        to_name: str,
        book_title: str,
        due_at: Optional[str] = None,
        role: str = "borrower",
    ) -> bool:
        """Send email when a loan is created."""
        due_text = f" Date limite estimée : {due_at}." if due_at else ""
        if role == "owner":
            title = "Prêt créé"
            message = (
                f"Le prêt pour « {book_title} » a été créé. "
                f"Pensez à confirmer l'échange au moment de la remise.{due_text}"
            )
        else:
            title = "Votre prêt est créé"
            message = (
                f"Votre prêt pour « {book_title} » a été créé. "
                f"Le prêt sera actif dès confirmation de l'échange par les deux parties.{due_text}"
            )

        subject = f"Prêt créé : {book_title} - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title=title,
            message=message,
            action_text="Voir la bibliothèque",
            action_url="https://membre.manssuetude.com/association/bibliotheque",
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["library", "loan-created"]
        )

    def send_library_owner_request_ready_email(
        self,
        to_email: str,
        to_name: str,
        book_title: str,
        requester_name: Optional[str] = None,
    ) -> bool:
        """Send email to book owner when a request is accepted and loan can be created."""
        requester_text = f" par {requester_name}" if requester_name else ""
        subject = f"Demande prête pour prêt : {book_title} - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Demande prête",
            message=(
                f"Le livre « {book_title} » a une demande acceptée{requester_text}. "
                "Vous pouvez maintenant créer le prêt."
            ),
            action_text="Créer le prêt",
            action_url="https://membre.manssuetude.com/association/bibliotheque",
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["library", "owner-request-ready"]
        )
    
    def send_welcome_email(
        self,
        to_email: str,
        to_name: str,
        temporary_password: Optional[str] = None
    ) -> bool:
        """Send welcome email to a new user"""
        subject = f"Bienvenue sur {self.from_name} !"
        
        password_section = ""
        if temporary_password:
            password_section = f"""
            <div style="background-color: #fef2f2; border: 2px solid #fca5a5; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #dc2626;">Vos identifiants de connexion :</p>
                <p style="margin: 5px 0;"><strong>Email :</strong> {to_email}</p>
                <p style="margin: 5px 0;"><strong>Mot de passe temporaire :</strong> <span style="font-family: monospace; background-color: #fee2e2; padding: 4px 8px; border-radius: 4px;">{temporary_password}</span></p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">⚠️ Pour des raisons de sécurité, veuillez changer ce mot de passe lors de votre première connexion.</p>
            </div>
            """
        
        html_content = self._render_notification_template(
            name=to_name,
            title="Bienvenue !",
            message=f"Votre compte a été créé avec succès. Nous sommes ravis de vous accueillir dans notre communauté !",
            details=None,
            action_text="Accéder à la plateforme",
            action_url="https://membre.manssuetude.com",
            custom_content=password_section
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["welcome", "onboarding"]
        )

    def send_guest_promoted_to_member_email(
        self,
        to_email: str,
        to_name: str
    ) -> bool:
        """Send congratulations email when a guest is promoted to member"""
        subject = f"Félicitations ! Vous êtes maintenant membre - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Félicitations, vous êtes membre !",
            message="Votre compte invité a été promu en compte membre. Bienvenue officiellement dans la communauté !",
            details={
                "Nouveau statut": "Membre"
            },
            action_text="Accéder à la plateforme",
            action_url="https://membre.manssuetude.com"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["welcome", "member-upgrade"]
        )
    
    def send_account_suspended_email(
        self,
        to_email: str,
        to_name: str
    ) -> bool:
        """Send email notification when user account is suspended"""
        subject = f"Compte suspendu - {self.from_name}"
        
        contact_info = f"""
        <div style="background-color: #fef2f2; border: 2px solid #fca5a5; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #dc2626;">Besoin d'aide ?</p>
            <p style="margin: 5px 0; font-size: 14px; color: #1f2937;">Si vous avez des questions concernant cette suspension, n'hésitez pas à contacter les administrateurs :</p>
            <p style="margin: 10px 0 5px 0;"><strong style="color: #dc2626;">Email :</strong> <a href="mailto:contact@manssuetude.com" style="color: #dc2626; text-decoration: underline;">contact@manssuetude.com</a></p>
        </div>
        """
        
        html_content = self._render_notification_template(
            name=to_name,
            title="Compte suspendu",
            message=f"Votre compte a été suspendu par un administrateur. Vous ne pouvez plus accéder à la plateforme pour le moment.",
            details=None,
            action_text=None,
            action_url=None,
            custom_content=contact_info
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["account-suspension", "notification"]
        )
    
    def send_account_unsuspended_email(
        self,
        to_email: str,
        to_name: str
    ) -> bool:
        """Send email notification when user account is unsuspended"""
        subject = f"Compte réactivé - {self.from_name}"
        
        frontend_url = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:8080')
        html_content = self._render_notification_template(
            name=to_name,
            title="Compte réactivé",
            message=f"Votre compte a été réactivé par un administrateur. Vous pouvez maintenant accéder à la plateforme normalement.",
            details=None,
            action_text="Accéder à la plateforme",
            action_url=f"{frontend_url}/login",
            custom_content=None
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content,
            tags=["account-unsuspension", "notification"]
        )
    
    def _render_notification_template(
        self,
        name: str,
        title: str,
        message: str,
        details: Optional[dict] = None,
        action_text: Optional[str] = None,
        action_url: Optional[str] = None,
        custom_content: Optional[str] = None
    ) -> str:
        """Render notification email template"""
        primary_color = "#dc2626"  # Red-600
        background_color = "#fef2f2"  # Red-50
        border_color = "#fca5a5"  # Red-300
        text_color = "#1f2937"  # Gray-800
        
        details_html = ""
        if details:
            details_html = '<div style="background-color: #f9fafb; border-left: 4px solid ' + primary_color + '; padding: 15px; margin: 20px 0; border-radius: 4px;">'
            for key, value in details.items():
                details_html += f'<p style="margin: 5px 0;"><strong>{key}:</strong> {value}</p>'
            details_html += '</div>'
        
        action_button = ""
        if action_text:
            button_style = f"display: inline-block; background-color: {primary_color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;"
            if action_url:
                action_button = f'<div style="text-align: center;"><a href="{action_url}" style="{button_style}">{action_text}</a></div>'
            else:
                action_button = f'<div style="text-align: center;"><span style="{button_style}">{action_text}</span></div>'
        
        custom_html = custom_content or ""
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: {text_color}; margin: 0; padding: 0; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: {primary_color}; margin: 0; font-size: 28px; font-weight: 700;">{self.from_name}</h1>
                    </div>
                    <h2 style="color: {text_color}; font-size: 24px; font-weight: 600; margin-bottom: 20px;">{title}</h2>
                    <p style="color: {text_color}; font-size: 16px; margin-bottom: 10px;">Bonjour {name},</p>
                    <p style="color: {text_color}; font-size: 16px; margin-bottom: 20px;">{message}</p>
                    {custom_html}
                    {details_html}
                    {action_button}
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">Cordialement,<br><strong style="color: {primary_color};">L'équipe {self.from_name}</strong></p>
                </div>
                <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
            </div>
        </body>
        </html>
        """
        return html



class ResendEmailService:
    """
    Service for sending transactional emails via Resend.
    """

    API_URL = "https://api.resend.com/emails"

    def __init__(self):
        self.api_key = getattr(settings, 'RESEND_API_KEY', '')
        self.from_email = getattr(settings, 'RESEND_FROM_EMAIL', 'contact@manssuetude.com')
        self.from_name = getattr(settings, 'RESEND_FROM_NAME', 'Manssuétude')

        logger.info(f"📧 ResendEmailService initialized")
        logger.info(f"   From: {self.from_name} <{self.from_email}>")
        logger.info(f"   API Key: {'✅ Configured' if self.api_key else '❌ Not configured'}")

        if not self.api_key:
            logger.warning("⚠️ RESEND_API_KEY not configured - emails will not be sent")

    def _send_email(
        self,
        to_email: str,
        to_name: Optional[str] = None,
        subject: str = "",
        html_content: str = "",
        text_content: Optional[str] = None,
        reply_to: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> bool:
        """
        Send an email via the Resend API.

        Args:
            to_email: Recipient email address
            to_name: Recipient name (optional)
            subject: Email subject
            html_content: HTML email body
            text_content: Plain text email body (optional, auto-generated from HTML if not provided)
            reply_to: Reply-to email address (optional)
            tags: List of tags for tracking (optional, not used by Resend the same way)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        logger.info("=" * 80)
        logger.info(f"📧 Sending email via Resend")
        logger.info(f"   To: {to_name or '(no name)'} <{to_email}>")
        logger.info(f"   Subject: {subject}")
        logger.info(f"   From: {self.from_name} <{self.from_email}>")

        if not self.api_key:
            logger.error("❌ Cannot send email: RESEND_API_KEY not configured")
            return False

        if not to_email:
            logger.error("❌ Cannot send email: recipient email is required")
            return False

        # Generate text content from HTML if not provided
        if not text_content:
            text_content = strip_tags(html_content)
            logger.debug(f"   Generated text content from HTML ({len(text_content)} chars)")
        else:
            logger.debug(f"   Using provided text content ({len(text_content)} chars)")

        logger.debug(f"   HTML content length: {len(html_content)} chars")

        payload = {
            "from": f"{self.from_name} <{self.from_email}>",
            "to": [f"{to_name} <{to_email}>" if to_name else to_email],
            "subject": subject,
            "html": html_content,
            "text": text_content,
        }
        if reply_to:
            payload["reply_to"] = [reply_to]

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            logger.info(f"   Sending request to Resend API...")
            response = requests.post(self.API_URL, json=payload, headers=headers, timeout=30)
            logger.info(f"   Response Status: {response.status_code}")

            if response.status_code in (200, 201):
                logger.info(f"✅ Email sent successfully via Resend to {to_email}")
                logger.info("=" * 80)
                return True
            else:
                logger.error(f"❌ Failed to send email to {to_email}")
                logger.error(f"   Status Code: {response.status_code}")
                logger.error(f"   Response: {response.text}")
                logger.error("=" * 80)
                return False

        except requests.exceptions.Timeout as e:
            logger.error(f"❌ Timeout sending email to {to_email}: {str(e)}")
            logger.error("=" * 80)
            return False
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Request error sending email to {to_email}: {str(e)}")
            logger.error("=" * 80)
            return False
        except Exception as e:
            logger.error(f"❌ Unexpected error sending email: {e}")
            logger.exception("Full exception traceback:")
            logger.error("=" * 80)
            return False
    
    def send_otp_email(self, to_email: str, to_name: str, otp_code: str) -> bool:
        """Send OTP code email"""
        if not self.api_key:
            logger.warning("=" * 80)
            logger.warning(f"🔑 DEV MODE (no RESEND_API_KEY) — OTP for {to_email}: {otp_code}")
            logger.warning("=" * 80)
            return True
        subject = f"Code de vérification - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Code de vérification",
            message=f"Votre code de vérification est :",
            details={"Code": f"<strong style='font-size: 24px; color: #dc2626;'>{otp_code}</strong>"},
            action_text=None,
            action_url=None,
            custom_content="<p style='color: #6b7280; font-size: 14px;'>Ce code est valide pendant 10 minutes.</p>"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def send_session_rating_reminder_email(
        self,
        to_email: str,
        to_name: str,
        session_title: str,
        session_date: Optional[str],
        session_id: str
    ) -> bool:
        """Send reminder email to rate a session to attendees."""
        date_text = f" du {session_date}" if session_date else ""
        subject = f"Merci pour votre présence - Donnez votre avis sur la session - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Merci d'être venu !",
            message=f"Merci d'avoir participé à la session « {session_title} »{date_text}. Nous serions ravis d'avoir votre avis.",
            details={
                "Session": session_title,
                "Date": session_date or "—"
            },
            action_text="Noter la session",
            action_url=f"https://membre.manssuetude.com/sessions/{session_id}"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )

    def send_feedback_created_email(
        self,
        to_email: str,
        to_name: str,
        subject_line: str,
        category: str,
        feedback_type: str,
        rating: Optional[int] = None
    ) -> bool:
        """Send email to admins when a new feedback is created."""
        subject = f"Nouveau feedback reçu - {self.from_name}"
        details = {
            "Sujet": subject_line,
            "Catégorie": category,
            "Type": feedback_type,
        }
        if rating is not None:
            details["Note"] = str(rating)

        html_content = self._render_notification_template(
            name=to_name,
            title="Nouveau feedback",
            message="Un nouveau feedback a été soumis par un membre.",
            details=details,
            action_text="Voir les feedbacks",
            action_url="https://membre.manssuetude.com/feedbacks"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def send_questionnaire_published_email(
        self,
        to_email: str,
        to_name: str,
        questionnaire_title: str,
        end_date: Optional[str] = None
    ) -> bool:
        """Send email when a questionnaire is published."""
        end_date_text = f" jusqu'au {end_date}" if end_date else ""
        subject = f"Nouveau questionnaire : {questionnaire_title} - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Nouveau questionnaire",
            message=f"Un nouveau questionnaire est disponible{end_date_text}. Merci de prendre quelques minutes pour le compléter.",
            details={
                "Titre": questionnaire_title
            },
            action_text="Répondre au questionnaire",
            action_url="https://membre.manssuetude.com/questionnaires"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def send_theme_window_opened_email(
        self,
        to_email: str,
        to_name: str,
        end_date: str
    ) -> bool:
        """Send email notification when theme window opens"""
        subject = f"Fenêtre de propositions de thèmes ouverte - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Fenêtre de propositions ouverte",
            message=f"La fenêtre de propositions de thèmes est maintenant ouverte jusqu'au {end_date}. Partagez vos idées !",
            action_text="Proposer un thème",
            action_url="https://membre.manssuetude.com/themes"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def send_theme_window_closed_email(
        self,
        to_email: str,
        to_name: str
    ) -> bool:
        """Send email notification when theme window closes"""
        subject = f"Fenêtre de propositions de thèmes fermée - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Fenêtre de propositions fermée",
            message="La fenêtre de propositions de thèmes est maintenant fermée. Merci pour vos contributions !",
            action_text="Voir les thèmes",
            action_url="https://membre.manssuetude.com/proposer-theme"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def send_theme_poll_created_email(
        self,
        to_email: str,
        to_name: str,
        poll_title: str,
        poll_question: str
    ) -> bool:
        """Send email when theme selection poll is created"""
        subject = f"Sondage de sélection de thème créé - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Sondage créé",
            message=f"Un sondage a été créé pour sélectionner le thème de la prochaine session : '{poll_title}'. La fenêtre de propositions est maintenant fermée.",
            details={
                "Titre": poll_title,
                "Question": poll_question
            },
            action_text="Voter maintenant",
            action_url="https://membre.manssuetude.com/sondages"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def send_poll_created_email(
        self,
        to_email: str,
        to_name: str,
        poll_title: str,
        poll_question: str,
        end_date: Optional[str] = None
    ) -> bool:
        """Send email when a new poll is created"""
        end_date_text = f" jusqu'au {end_date}" if end_date else ""
        subject = f"Nouveau sondage : {poll_title} - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Nouveau sondage",
            message=f"Un nouveau sondage a été créé{end_date_text} :",
            details={
                "Titre": poll_title,
                "Question": poll_question
            },
            action_text="Voter maintenant",
            action_url="https://membre.manssuetude.com/sondages"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def send_poll_reminder_email(
        self,
        to_email: str,
        to_name: str,
        poll_title: str,
        poll_question: str,
        end_date: str = None
    ) -> bool:
        """Send reminder email for poll"""
        end_date_text = f" jusqu'au {end_date}" if end_date else ""
        subject = f"Rappel : Sondage à compléter - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Rappel de sondage",
            message=f"Vous n'avez pas encore voté pour le sondage '{poll_title}'{end_date_text}.",
            details={"Question": poll_question},
            action_text="Voter maintenant",
            action_url="https://membre.manssuetude.com/sondages"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )

    def send_library_queue_offer_email(
        self,
        to_email: str,
        to_name: str,
        book_title: str,
        offer_expires_at: Optional[str] = None,
    ) -> bool:
        """Send email when user is next in queue for a book."""
        expires_text = f" avant le {offer_expires_at}" if offer_expires_at else ""
        subject = f"Un livre vous attend : {book_title} - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Livre disponible pour vous",
            message=f"Bonne nouvelle ! Vous êtes prioritaire pour emprunter « {book_title} ». Merci de confirmer{expires_text}.",
            action_text="Voir la bibliothèque",
            action_url="https://membre.manssuetude.com/association/bibliotheque",
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )

    def send_library_wishlist_match_email(
        self,
        to_email: str,
        to_name: str,
        book_title: str,
        book_author: Optional[str] = None,
    ) -> bool:
        """Send email when a wishlist item matches a newly listed book."""
        author_text = f" de {book_author}" if book_author else ""
        subject = f"Wishlist: livre trouvé - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Livre trouvé dans la bibliothèque",
            message=f"Le livre « {book_title} »{author_text} vient d'être ajouté et correspond à votre wishlist.",
            action_text="Voir le livre",
            action_url="https://membre.manssuetude.com/association/bibliotheque",
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )

    def send_library_loan_due_reminder_email(
        self,
        to_email: str,
        to_name: str,
        book_title: str,
        due_at: Optional[str] = None,
    ) -> bool:
        """Send loan due reminder email."""
        due_text = f" (date limite: {due_at})" if due_at else ""
        subject = f"Rappel de retour de livre - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Rappel de retour",
            message=f"Le prêt de « {book_title} » arrive bientôt à échéance{due_text}.",
            action_text="Voir mes prêts",
            action_url="https://membre.manssuetude.com/association/bibliotheque",
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )

    def send_library_loan_created_email(
        self,
        to_email: str,
        to_name: str,
        book_title: str,
        due_at: Optional[str] = None,
        role: str = "borrower",
    ) -> bool:
        """Send email when a loan is created."""
        due_text = f" Date limite estimée : {due_at}." if due_at else ""
        if role == "owner":
            title = "Prêt créé"
            message = (
                f"Le prêt pour « {book_title} » a été créé. "
                f"Pensez à confirmer l'échange au moment de la remise.{due_text}"
            )
        else:
            title = "Votre prêt est créé"
            message = (
                f"Votre prêt pour « {book_title} » a été créé. "
                f"Le prêt sera actif dès confirmation de l'échange par les deux parties.{due_text}"
            )

        subject = f"Prêt créé : {book_title} - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title=title,
            message=message,
            action_text="Voir la bibliothèque",
            action_url="https://membre.manssuetude.com/association/bibliotheque",
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )

    def send_library_owner_request_ready_email(
        self,
        to_email: str,
        to_name: str,
        book_title: str,
        requester_name: Optional[str] = None,
    ) -> bool:
        """Send email to book owner when a request is accepted and loan can be created."""
        requester_text = f" par {requester_name}" if requester_name else ""
        subject = f"Demande prête pour prêt : {book_title} - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Demande prête",
            message=(
                f"Le livre « {book_title} » a une demande acceptée{requester_text}. "
                "Vous pouvez maintenant créer le prêt."
            ),
            action_text="Créer le prêt",
            action_url="https://membre.manssuetude.com/association/bibliotheque",
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def send_welcome_email(
        self,
        to_email: str,
        to_name: str,
        temporary_password: Optional[str] = None
    ) -> bool:
        """Send welcome email to a new user"""
        subject = f"Bienvenue sur {self.from_name} !"
        
        password_section = ""
        if temporary_password:
            password_section = f"""
            <div style="background-color: #fef2f2; border: 2px solid #fca5a5; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #dc2626;">Vos identifiants de connexion :</p>
                <p style="margin: 5px 0;"><strong>Email :</strong> {to_email}</p>
                <p style="margin: 5px 0;"><strong>Mot de passe temporaire :</strong> <span style="font-family: monospace; background-color: #fee2e2; padding: 4px 8px; border-radius: 4px;">{temporary_password}</span></p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">⚠️ Pour des raisons de sécurité, veuillez changer ce mot de passe lors de votre première connexion.</p>
            </div>
            """
        
        html_content = self._render_notification_template(
            name=to_name,
            title="Bienvenue !",
            message=f"Votre compte a été créé avec succès. Nous sommes ravis de vous accueillir dans notre communauté !",
            details=None,
            action_text="Accéder à la plateforme",
            action_url="https://membre.manssuetude.com",
            custom_content=password_section
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )

    def send_guest_promoted_to_member_email(
        self,
        to_email: str,
        to_name: str
    ) -> bool:
        """Send congratulations email when a guest is promoted to member"""
        subject = f"Félicitations ! Vous êtes maintenant membre - {self.from_name}"
        html_content = self._render_notification_template(
            name=to_name,
            title="Félicitations, vous êtes membre !",
            message="Votre compte invité a été promu en compte membre. Bienvenue officiellement dans la communauté !",
            details={
                "Nouveau statut": "Membre"
            },
            action_text="Accéder à la plateforme",
            action_url="https://membre.manssuetude.com"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def send_email_changed_notification(
        self,
        to_email: str,
        to_name: str,
        old_email: str,
        new_email: str
    ) -> bool:
        """Send email notification when user's email address is changed"""
        subject = f"Modification de votre adresse email - {self.from_name}"
        
        email_info = f"""
        <div style="background-color: #f0f9ff; border: 2px solid #93c5fd; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #1e40af;">Votre adresse email a été modifiée :</p>
            <p style="margin: 5px 0;"><strong>Ancienne adresse :</strong> {old_email}</p>
            <p style="margin: 5px 0;"><strong>Nouvelle adresse :</strong> <span style="color: #1e40af; font-weight: 600;">{new_email}</span></p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Vous recevrez désormais tous les emails à cette nouvelle adresse.</p>
        </div>
        """
        
        html_content = self._render_notification_template(
            name=to_name,
            title="Adresse email modifiée",
            message=f"Votre adresse email a été modifiée par un administrateur. Vous recevrez désormais tous les emails à votre nouvelle adresse.",
            details=None,
            action_text="Accéder à la plateforme",
            action_url="https://membre.manssuetude.com",
            custom_content=email_info
        )
        return self._send_email(
            to_email=new_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def send_account_suspended_email(
        self,
        to_email: str,
        to_name: str
    ) -> bool:
        """Send email notification when user account is suspended"""
        subject = f"Compte suspendu - {self.from_name}"
        
        contact_info = f"""
        <div style="background-color: #fef2f2; border: 2px solid #fca5a5; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #dc2626;">Besoin d'aide ?</p>
            <p style="margin: 5px 0; font-size: 14px; color: #1f2937;">Si vous avez des questions concernant cette suspension, n'hésitez pas à contacter les administrateurs :</p>
            <p style="margin: 10px 0 5px 0;"><strong style="color: #dc2626;">Email :</strong> <a href="mailto:contact@manssuetude.com" style="color: #dc2626; text-decoration: underline;">contact@manssuetude.com</a></p>
        </div>
        """
        
        html_content = self._render_notification_template(
            name=to_name,
            title="Compte suspendu",
            message=f"Votre compte a été suspendu par un administrateur. Vous ne pouvez plus accéder à la plateforme pour le moment.",
            details=None,
            action_text=None,
            action_url=None,
            custom_content=contact_info
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def send_account_unsuspended_email(
        self,
        to_email: str,
        to_name: str
    ) -> bool:
        """Send email notification when user account is unsuspended"""
        subject = f"Compte réactivé - {self.from_name}"
        
        frontend_url = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:8080')
        html_content = self._render_notification_template(
            name=to_name,
            title="Compte réactivé",
            message=f"Votre compte a été réactivé par un administrateur. Vous pouvez maintenant accéder à la plateforme normalement.",
            details=None,
            action_text="Accéder à la plateforme",
            action_url=f"{frontend_url}/login",
            custom_content=None
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    # ==================== Commission Emails ====================
    
    def send_commission_application_created_email(
        self,
        to_email: str,
        to_name: str,
        applicant_name: str,
        commission_name: str,
        commission_id: str
    ) -> bool:
        """Send email to leader/admins when a new commission application is submitted"""
        subject = f"Nouvelle candidature pour la commission {commission_name} - {self.from_name}"
        frontend_url = getattr(settings, 'FRONTEND_BASE_URL', 'https://membre.manssuetude.com')
        html_content = self._render_notification_template(
            name=to_name,
            title="Nouvelle candidature",
            message=f"Une nouvelle candidature a été soumise pour rejoindre la commission « {commission_name} ».",
            details={
                "Candidat": applicant_name,
                "Commission": commission_name
            },
            action_text="Voir la candidature",
            action_url=f"{frontend_url}/admin/commissions"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def send_commission_application_approved_email(
        self,
        to_email: str,
        to_name: str,
        commission_name: str,
        commission_id: str
    ) -> bool:
        """Send email to applicant when their application is approved"""
        subject = f"Candidature approuvée - Commission {commission_name} - {self.from_name}"
        frontend_url = getattr(settings, 'FRONTEND_BASE_URL', 'https://membre.manssuetude.com')
        html_content = self._render_notification_template(
            name=to_name,
            title="Candidature approuvée !",
            message=f"Félicitations ! Votre candidature pour rejoindre la commission « {commission_name} » a été approuvée. Vous êtes maintenant membre de cette commission.",
            details={
                "Commission": commission_name
            },
            action_text="Voir les commissions",
            action_url=f"{frontend_url}/commissions"
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def send_commission_application_rejected_email(
        self,
        to_email: str,
        to_name: str,
        commission_name: str,
        rejection_reason: Optional[str] = None
    ) -> bool:
        """Send email to applicant when their application is rejected"""
        subject = f"Candidature non retenue - Commission {commission_name} - {self.from_name}"
        
        reason_text = ""
        if rejection_reason:
            reason_text = f"""
            <div style="background-color: #fef2f2; border: 2px solid #fca5a5; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #dc2626;">Motif :</p>
                <p style="margin: 5px 0; font-size: 14px; color: #1f2937;">{rejection_reason}</p>
            </div>
            """
        
        html_content = self._render_notification_template(
            name=to_name,
            title="Candidature non retenue",
            message=f"Nous avons le regret de vous informer que votre candidature pour la commission « {commission_name} » n'a pas été retenue.",
            details={
                "Commission": commission_name
            },
            action_text=None,
            action_url=None,
            custom_content=reason_text
        )
        return self._send_email(
            to_email=to_email,
            to_name=to_name,
            subject=subject,
            html_content=html_content
        )
    
    def _render_notification_template(
        self,
        name: str,
        title: str,
        message: str,
        details: Optional[dict] = None,
        action_text: Optional[str] = None,
        action_url: Optional[str] = None,
        custom_content: Optional[str] = None
    ) -> str:
        """Render notification email template"""
        primary_color = "#dc2626"  # Red-600
        background_color = "#fef2f2"  # Red-50
        border_color = "#fca5a5"  # Red-300
        text_color = "#1f2937"  # Gray-800
        
        details_html = ""
        if details:
            details_html = '<div style="background-color: #f9fafb; border-left: 4px solid ' + primary_color + '; padding: 15px; margin: 20px 0; border-radius: 4px;">'
            for key, value in details.items():
                details_html += f'<p style="margin: 5px 0;"><strong>{key}:</strong> {value}</p>'
            details_html += '</div>'
        
        action_button = ""
        if action_text:
            button_style = f"display: inline-block; background-color: {primary_color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;"
            if action_url:
                action_button = f'<div style="text-align: center;"><a href="{action_url}" style="{button_style}">{action_text}</a></div>'
            else:
                action_button = f'<div style="text-align: center;"><span style="{button_style}">{action_text}</span></div>'
        
        custom_html = custom_content or ""
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: {text_color}; margin: 0; padding: 0; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: {primary_color}; margin: 0; font-size: 28px; font-weight: 700;">{self.from_name}</h1>
                    </div>
                    <h2 style="color: {text_color}; font-size: 24px; font-weight: 600; margin-bottom: 20px;">{title}</h2>
                    <p style="color: {text_color}; font-size: 16px; margin-bottom: 10px;">Bonjour {name},</p>
                    <p style="color: {text_color}; font-size: 16px; margin-bottom: 20px;">{message}</p>
                    {custom_html}
                    {details_html}
                    {action_button}
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">Cordialement,<br><strong style="color: {primary_color};">L'équipe {self.from_name}</strong></p>
                </div>
                <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">Ceci est un email automatique, merci de ne pas y répondre.</p>
            </div>
        </body>
        </html>
        """
        return html


# Default email service - can be switched between SMTP and MailerSend
EmailService = ResendEmailService  # Use Resend by default
