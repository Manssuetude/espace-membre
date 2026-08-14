import logging
from urllib.parse import urlsplit, urlunsplit
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

# Log which database is being used
db_url = settings.DATABASE_URL
# Mask password in logs for security
parsed = urlsplit(db_url)
if parsed.password:
    netloc = f"{parsed.username}:***@{parsed.hostname}"
    if parsed.port:
        netloc += f":{parsed.port}"
    masked_url = urlunsplit((parsed.scheme, netloc, parsed.path, parsed.query, parsed.fragment))
else:
    masked_url = db_url

logger.info(f"🔌 Database connection: {settings.ENVIRONMENT.upper()} environment")
logger.info(f"   Using database: {masked_url}")

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,
    max_overflow=10
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency function to get database session.
    Used with FastAPI's Depends().
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

