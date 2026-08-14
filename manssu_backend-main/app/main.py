import logging
import time
import json
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import Message
from starlette.responses import StreamingResponse
import io
from app.core.config import settings

# Create logs directory if it doesn't exist
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# Configure file logging
log_file = log_dir / f"app_{datetime.now().strftime('%Y%m%d')}.log"
file_handler = logging.FileHandler(log_file, encoding='utf-8')
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
file_handler.setFormatter(file_formatter)

# Configure console logging
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
console_handler.setFormatter(console_formatter)

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(file_handler)
root_logger.addHandler(console_handler)

logger = logging.getLogger(__name__)
logger.info(f"Logging to file: {log_file.absolute()}")

# Import routers
from app.api.v1 import auth, users, sessions, themes, resources, polls, feedbacks, locations, dashboard, invites, activity_templates, questionnaires, commissions, library

app = FastAPI(
    title="MANSSU API",
    description="Backend API for MANSSU platform",
    version="1.0.0"
)


# Helper function to read request body
async def read_request_body(request: Request) -> bytes:
    """Read request body and restore it for the request"""
    body = await request.body()
    async def receive() -> Message:
        return {"type": "http.request", "body": body}
    request._receive = receive
    return body

# Helper function to read response body
async def read_response_body(response) -> bytes:
    """Read response body"""
    if hasattr(response, 'body'):
        return response.body
    return b""

# Request Logging Middleware
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        request_id = f"{int(time.time() * 1000)}"
        
        # Handle OPTIONS requests FIRST - before reading body or anything else
        if request.method == "OPTIONS":
            logger.info("=" * 80)
            logger.info(f"OPTIONS REQUEST [{request_id}] {request.url.path}")
            logger.info(f"Client: {request.client.host}:{request.client.port}" if request.client else "unknown")
            origin = request.headers.get("origin")
            logger.info(f"Origin: {origin}")
            logger.info(f"Allowed origins: {settings.CORS_ORIGINS}")
            
            # Check if origin is allowed
            origin_allowed = False
            if origin and origin in settings.CORS_ORIGINS:
                logger.info(f"✓ Origin {origin} is allowed")
                origin_allowed = True
            elif "*" in settings.CORS_ORIGINS:
                logger.info("✓ Wildcard origin allowed")
                origin_allowed = True
            else:
                logger.warning(f"✗ Origin {origin} is NOT in allowed list")
            
            # Let CORS middleware handle it, but log what happens
            try:
                response = await call_next(request)
                process_time = time.time() - start_time
                logger.info(f"OPTIONS RESPONSE [{request_id}] {response.status_code} - {process_time:.3f}s")
                logger.info(f"Response Headers: {json.dumps(dict(response.headers), indent=2)}")
                logger.info("=" * 80)
                return response
            except Exception as e:
                logger.error(f"ERROR in OPTIONS handler: {str(e)}", exc_info=True)
                # Return a proper OPTIONS response even on error
                return Response(
                    status_code=200,
                    headers={
                        "Access-Control-Allow-Origin": origin if origin_allowed else settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "*",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                        "Access-Control-Allow-Headers": "*",
                        "Access-Control-Allow-Credentials": "true",
                    }
                )
        
        # For non-OPTIONS requests, read body and log normally
        request_body = b""
        try:
            request_body = await read_request_body(request)
        except Exception as e:
            logger.warning(f"Could not read request body: {e}")
        
        # Parse request body if JSON
        request_payload = None
        if request_body:
            try:
                request_payload = json.loads(request_body.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                request_payload = request_body.decode('utf-8', errors='replace')
        
        # Build comprehensive request log
        request_log = {
            "request_id": request_id,
            "method": request.method,
            "path": str(request.url.path),
            "query_params": dict(request.query_params),
            "headers": dict(request.headers),
            "client": f"{request.client.host}:{request.client.port}" if request.client else "unknown",
            "body": request_payload if request_payload else None,
            "body_raw": request_body.decode('utf-8', errors='replace') if request_body else None
        }
        
        logger.info("=" * 80)
        logger.info(f"REQUEST [{request_id}] {request.method} {request.url.path}")
        logger.info(f"Client: {request_log['client']}")
        logger.info(f"Query Params: {json.dumps(request_log['query_params'], indent=2)}")
        logger.info(f"Headers: {json.dumps({k: v for k, v in request_log['headers'].items() if k.lower() not in ['authorization', 'cookie']}, indent=2)}")
        if request_payload:
            logger.info(f"Request Body: {json.dumps(request_payload, indent=2, ensure_ascii=False)}")
        elif request_body:
            logger.info(f"Request Body (raw): {request_log['body_raw'][:500]}")  # Limit to 500 chars
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Capture response body
            response_body = b""
            response_payload = None
            
            # Try to capture response body
            if isinstance(response, StreamingResponse):
                # For streaming responses, capture what we can
                response_payload = "[Streaming response - body not fully captured]"
            elif hasattr(response, 'body'):
                # Direct access to body (JSONResponse, etc.)
                response_body = response.body
                try:
                    response_payload = json.loads(response_body.decode('utf-8'))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    response_payload = response_body.decode('utf-8', errors='replace')[:2000]
            else:
                # Try to read from body_iterator if available
                try:
                    if hasattr(response, 'body_iterator'):
                        chunks = []
                        async for chunk in response.body_iterator:
                            chunks.append(chunk)
                        response_body = b''.join(chunks)
                        try:
                            response_payload = json.loads(response_body.decode('utf-8'))
                        except (json.JSONDecodeError, UnicodeDecodeError):
                            response_payload = response_body.decode('utf-8', errors='replace')[:2000]
                        # Recreate the response with the body we read
                        response = Response(
                            content=response_body,
                            status_code=response.status_code,
                            headers=dict(response.headers),
                            media_type=response.media_type if hasattr(response, 'media_type') else None
                        )
                except Exception as e:
                    logger.warning(f"Could not capture response body: {e}")
            
            # Build comprehensive response log
            response_headers = dict(response.headers) if hasattr(response, 'headers') else {}
            
            logger.info(f"RESPONSE [{request_id}] {response.status_code} - {process_time:.3f}s")
            logger.info(f"Response Headers: {json.dumps(response_headers, indent=2)}")
            if response_payload:
                if isinstance(response_payload, str) and "not captured" in response_payload:
                    logger.info(f"Response Body: {response_payload}")
                else:
                    logger.info(f"Response Body: {json.dumps(response_payload, indent=2, ensure_ascii=False)}")
            logger.info("=" * 80)
            
            return response
        except Exception as e:
            process_time = time.time() - start_time
            error_log = {
                "request_id": request_id,
                "error": str(e),
                "error_type": type(e).__name__,
                "process_time": f"{process_time:.3f}s"
            }
            logger.error(f"ERROR [{request_id}] {str(e)}")
            logger.error(f"Error Type: {type(e).__name__}")
            logger.error(f"Request failed after {process_time:.3f}s")
            logger.error("=" * 80)
            logger.exception("Full exception traceback:")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"success": False, "message": "Internal server error", "request_id": request_id}
            )


# CORS Configuration - MUST be added FIRST (innermost) to handle OPTIONS before route matching
# Custom CORS origin validator to allow local network IPs
def is_origin_allowed(origin: str) -> bool:
    """Check if origin is allowed, including local network IPs"""
    if not origin:
        return False
    
    # Check exact matches first
    if origin in settings.CORS_ORIGINS:
        return True
    
    # If local network IPs are allowed, check for localhost/local network patterns
    if settings.CORS_ALLOW_LOCAL_NETWORK:
        # Extract port and protocol from origin
        try:
            from urllib.parse import urlparse
            parsed = urlparse(origin)
            port = parsed.port or (443 if parsed.scheme == 'https' else 80)
            
            # Check if it's a local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x, 127.x.x.x)
            host = parsed.hostname or ""
            if host:
                # Check if any allowed origin has the same port and is localhost
                for allowed in settings.CORS_ORIGINS:
                    allowed_parsed = urlparse(allowed)
                    allowed_port = allowed_parsed.port or (443 if allowed_parsed.scheme == 'https' else 80)
                    allowed_host = allowed_parsed.hostname or ""
                    
                    # If allowed origin is localhost and ports match, allow local network IPs
                    if allowed_host in ["localhost", "127.0.0.1"] and port == allowed_port:
                        # Allow local network IPs
                        if (host.startswith("192.168.") or 
                            host.startswith("10.") or 
                            host.startswith("172.16.") or 
                            host.startswith("172.17.") or
                            host.startswith("172.18.") or
                            host.startswith("172.19.") or
                            host.startswith("172.20.") or
                            host.startswith("172.21.") or
                            host.startswith("172.22.") or
                            host.startswith("172.23.") or
                            host.startswith("172.24.") or
                            host.startswith("172.25.") or
                            host.startswith("172.26.") or
                            host.startswith("172.27.") or
                            host.startswith("172.28.") or
                            host.startswith("172.29.") or
                            host.startswith("172.30.") or
                            host.startswith("172.31.") or
                            host.startswith("127.")):
                            return True
        except Exception:
            pass
    
    return False

# Custom CORS middleware wrapper
from starlette.middleware.cors import CORSMiddleware as BaseCORSMiddleware

class CustomCORSMiddleware(BaseCORSMiddleware):
    def is_allowed_origin(self, origin: str) -> bool:
        """Override to use custom origin validation"""
        return is_origin_allowed(origin)

logger.info(f"Configuring CORS with origins: {settings.CORS_ORIGINS}")
logger.info(f"Local network IPs allowed: {settings.CORS_ALLOW_LOCAL_NETWORK}")

# Build CORS origins list - ensure it's a list
cors_origins = list(settings.CORS_ORIGINS) if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]

# Add production API domain to allowed origins if not already present
if "https://api.manssuetude.com" not in cors_origins:
    cors_origins.append("https://api.manssuetude.com")

# If local network is allowed, use regex pattern for local network IPs + explicit origins
# Otherwise, just use explicit origins
if settings.CORS_ALLOW_LOCAL_NETWORK:
    # Use regex to allow both explicit origins and local network IPs
    # Escape dots in domain names for regex
    explicit_origins_regex = "|".join([origin.replace(".", r"\.").replace(":", r"\:") for origin in cors_origins])
    local_network_regex = rf"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+):(5173|3000)|{explicit_origins_regex}"
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=local_network_regex,
        allow_credentials=True,
        allow_methods=["*"],  # This includes OPTIONS
        allow_headers=["*"],
        expose_headers=["*"],
    )
else:
    # Use explicit origins only
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],  # This includes OPTIONS
        allow_headers=["*"],
        expose_headers=["*"],
    )

# Add logging middleware AFTER CORS (outermost)
# This way CORS handles OPTIONS first, then logging captures it
app.add_middleware(LoggingMiddleware)

# Note: OPTIONS requests are now handled directly in LoggingMiddleware
# This ensures they're processed before any route matching occurs

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(sessions.router, prefix="/api/v1/sessions", tags=["Sessions"])
app.include_router(themes.router, prefix="/api/v1/themes", tags=["Themes"])
app.include_router(resources.router, prefix="/api/v1/resources", tags=["Resources"])
app.include_router(polls.router, prefix="/api/v1/polls", tags=["Polls"])
app.include_router(feedbacks.router, prefix="/api/v1/feedbacks", tags=["Feedbacks"])
app.include_router(locations.router, prefix="/api/v1/locations", tags=["Locations"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(invites.router, prefix="/api/v1/invites", tags=["Invites"])
app.include_router(activity_templates.router, prefix="/api/v1/activity-templates", tags=["Activity Templates"])
app.include_router(questionnaires.router, prefix="/api/v1/questionnaires", tags=["Questionnaires"])
app.include_router(commissions.router, prefix="/api/v1/commissions", tags=["Commissions"])
app.include_router(library.router, prefix="/api/v1/library", tags=["Library"])


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "MANSSU API",
        "version": "1.0.0",
        "status": "running"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
