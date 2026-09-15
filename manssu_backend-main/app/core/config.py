from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union
from urllib.parse import quote_plus
import secrets


class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"  # "development" or "production"
    
    # Database - Supabase (production)
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    SUPABASE_HOST: str = ""
    DB_PORT: int = 5432
    DB_NAME: str = "postgres"
    
    # Database - Local (development)
    LOCAL_DB_HOST: str = "localhost"
    LOCAL_DB_USER: str = "postgres"
    LOCAL_DB_PASSWORD: str = ""
    LOCAL_DB_PORT: int = 5432
    LOCAL_DB_NAME: str = "manssu_local"
    
    @property
    def DATABASE_URL(self) -> str:
        """Construct PostgreSQL connection URL from components.
        Uses local database in development, Supabase in production.
        """
        if self.ENVIRONMENT.lower() == "development":
            # Use local database
            user = quote_plus(self.LOCAL_DB_USER)
            password = quote_plus(self.LOCAL_DB_PASSWORD)
            return f"postgresql://{user}:{password}@{self.LOCAL_DB_HOST}:{self.LOCAL_DB_PORT}/{self.LOCAL_DB_NAME}"
        else:
            # Use Supabase database
            user = quote_plus(self.DB_USER)
            password = quote_plus(self.DB_PASSWORD)
            return f"postgresql://{user}:{password}@{self.SUPABASE_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    # JWT
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days (7 * 24 * 60 = 10080 minutes)
    
    # OTP
    OTP_EXPIRY_MINUTES: int = 10
    OTP_LENGTH: int = 6
    
    # Email (for OTP sending) - MailerSend
    MAILERSEND_API_KEY: str = ""
    MAILERSEND_FROM_EMAIL: str = "contact@pumpyfamilylife.com"
    MAILERSEND_FROM_NAME: str = "Manssuétude"
    
    # Resend Email Configuration
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "noreply@manssuetude.com"
    RESEND_FROM_NAME: str = "Manssuétude"
    
    # CORS - can be comma-separated string or list
    # Supports localhost and local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://localhost:3000,https://membre.manssuetude.com"
    CORS_ALLOW_LOCAL_NETWORK: bool = True  # Allow local network IPs (192.168.x.x, etc.)
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    UPLOAD_DIR: str = "./uploads"
    
    # Cloudflare R2 Storage
    USE_R2: bool = True
    CLOUDFLARE_TOKEN_VALUE: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_ENDPOINT_URL: str = ""
    R2_BUCKET_NAME: str = ""
    R2_PUBLIC_BASE_URL: str = ""
    R2_SIGNED_URL_EXPIRATION: int = 3600
    
    # Google Places API (optional)
    GOOGLE_PLACES_API_KEY: str = ""
    
    # Frontend URL for invite links
    FRONTEND_BASE_URL: str = "http://localhost:8080"

    # Secret used to authenticate Vercel Cron requests (awards vote reminder)
    CRON_SECRET: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Generate a secret key if not provided
def get_secret_key() -> str:
    """Generate a secure secret key for JWT if not set in environment"""
    settings = Settings()
    if not settings.SECRET_KEY:
        return secrets.token_urlsafe(32)
    return settings.SECRET_KEY


settings = Settings()

# Override SECRET_KEY if not set
if not settings.SECRET_KEY:
    settings.SECRET_KEY = get_secret_key()
