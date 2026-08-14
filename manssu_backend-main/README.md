# MANSSU Backend API

FastAPI backend for the MANSSU platform.

## Project Structure

```
manssu_backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── database.py             # Database connection
│   ├── dependencies.py         # Shared dependencies
│   ├── models/                 # SQLAlchemy models
│   ├── schemas/                # Pydantic schemas
│   ├── api/                    # API routes
│   │   └── v1/                 # API version 1
│   ├── core/                   # Core functionality
│   └── services/               # Business logic
├── alembic/                    # Database migrations
├── tests/                      # Test files
├── uploads/                    # File uploads directory
├── .env                        # Environment variables
├── requirements.txt            # Python dependencies
└── alembic.ini                # Alembic configuration
```

## Setup

### 1. Virtual Environment

The project uses a virtual environment (`.venv`). Activate it:

```bash
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate     # On Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Copy `.env` and configure the following variables:

#### Environment Configuration
- `ENVIRONMENT` - Set to `"development"` to use local database, `"production"` to use Supabase (default: `"development"`)

#### Local Database (Development)
- `LOCAL_DB_HOST` - Local PostgreSQL host (default: `"localhost"`)
- `LOCAL_DB_USER` - Local database user (default: `"postgres"`)
- `LOCAL_DB_PASSWORD` - Local database password
- `LOCAL_DB_PORT` - Local database port (default: `5432`)
- `LOCAL_DB_NAME` - Local database name (default: `"manssu_local"`)

#### Supabase Database (Production)
- `DB_USER`, `DB_PASSWORD`, `SUPABASE_HOST`, `DB_PORT`, `DB_NAME` - Supabase database credentials (used when `ENVIRONMENT=production`)

#### Other Configuration
- `SECRET_KEY` - JWT secret key (auto-generated if not set)
- `SMTP_*` - Email configuration for OTP sending
- `CORS_ORIGINS` - Allowed CORS origins

**Note**: When `ENVIRONMENT=development`, the app uses the local database. When `ENVIRONMENT=production`, it uses Supabase.

### 4. Database Migrations

Create initial migration:

```bash
alembic revision --autogenerate -m "Initial migration"
```

Run migrations:

```bash
alembic upgrade head
```

### 5. Run the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development

### Running Tests

```bash
pytest
```

### Creating Migrations

```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## API Endpoints

All endpoints are prefixed with `/api/v1/`.

See the [Backend Guide](./docs/BACKEND_GUIDE.md) for detailed API documentation.

## Technologies

- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **Pydantic** - Data validation
- **PostgreSQL** - Database (local in development, Supabase in production)
- **JWT** - Authentication
- **OTP** - One-time password authentication

## License

Private project

