# CLAUDE.md — Backend

Guidance pour Claude Code dans **`manssu_backend-main/`**. Vue d'ensemble du mono-repo : `../CLAUDE.md`.

## Overview

API REST **FastAPI** de l'espace membre Manssuétude. SQLAlchemy 2.0 + Alembic, PostgreSQL (locale en dev, Supabase en prod). Auth **OTP e-mail + JWT**. Stockage fichiers **Cloudflare R2**. Servie en prod sur `https://apis.manssuetude.com`.

## Commands

```bash
source .venv/bin/activate                  # Activer le venv (macOS/Linux)
pip install -r requirements.txt            # Dépendances
uvicorn app.main:app --reload              # Dev → http://localhost:8000
alembic revision --autogenerate -m "msg"   # Générer une migration
alembic upgrade head                       # Appliquer les migrations
pytest                                     # Tests
```

Docs auto : http://localhost:8000/docs (Swagger) · `/redoc`. Root : `/` · Santé : `/health`.

## Architecture (couches, dépendances toujours descendantes)

```
API Route (app/api/v1/<domaine>.py)        ← Route Handlers FastAPI, montés sous /api/v1/<domaine>
  → Dependencies (app/dependencies.py)     ← get_current_user / _admin / _super_admin / _optional_user
  → Schema (app/schemas/<domaine>.py)      ← validation & sérialisation Pydantic
  → Service (app/services/<domaine>_service.py)  ← logique métier
      → Model (app/models/<entité>.py)     ← SQLAlchemy ORM
          → Database (app/database.py)     ← session PostgreSQL (get_db)
```

- **`app/api/v1/`** — un routeur par domaine ; chaque route valide (Pydantic), vérifie l'auth (dépendances), délègue au service, renvoie un schéma. Nouveaux routeurs à monter dans `app/main.py`.
- **`app/services/`** — logique métier ; seule couche orchestrant plusieurs models. Les models n'appellent pas les services.
- **`app/models/`** — un modèle SQLAlchemy par entité.
- **`app/schemas/`** — Pydantic (entrée/sortie) par domaine ; `common.py` pour les schémas partagés.
- **`app/core/`** — `config.py` (settings pydantic + `DATABASE_URL` calculée selon `ENVIRONMENT`), `security.py` (JWT/hash bcrypt), `cache.py` (cachetools), `exceptions.py`.
- **`app/main.py`** — app FastAPI, middleware CORS (support IP réseau local via `CORS_ALLOW_LOCAL_NETWORK`), middleware de logging verbeux (requêtes/réponses → `logs/app_YYYYMMDD.log`), montage des routeurs.

Domaines : auth, users, sessions (+ session_invites), themes, resources (+ feedbacks), polls, questionnaires, commissions (+ work_groups), library, locations, invites (invitation_requests), activity_templates, dashboard.

## Conventions

- **FastAPI / SQLAlchemy 2.0 / Pydantic v2.** Validation à la frontière via schemas ; ne jamais accepter de dict brut non validé.
- **Auth** — OTP e-mail (6 chiffres, exp. 10 min) → JWT `HS256` valable 7 jours (`ACCESS_TOKEN_EXPIRE_MINUTES=10080`). Payload : `sub` (user id) + `email`. Récupérer l'utilisateur via les dépendances, jamais en décodant le token à la main.
- **Rôles & statut** — `User.role` : `super_admin` > `admin` > membre ; garde-fous `get_current_admin` / `get_current_super_admin`. Seul `User.status == "active"` est authentifié. **Ne pas réintroduire d'accès admin par défaut.** Restrictions invités : voir `docs/GUEST_USER_RESTRICTIONS.md`.
- **Exceptions** — lever les exceptions custom de `app/core/exceptions.py` (`UnauthorizedException`, `ForbiddenException`, …), pas de `HTTPException` brute dispersée.
- **Migrations** — toute évolution de schéma = nouvelle révision Alembic (`app/models/` modifié → `alembic revision --autogenerate` → relire le fichier généré → `alembic upgrade head`). Ne jamais modifier la DB à la main ni éditer une migration déjà appliquée.
- **E-mail** — OTP/invitations via `app/services/email_service.py` (Resend).
- **Fichiers** — uploads sur Cloudflare R2 via `app/services/r2_storage_service.py` (`USE_R2=True`) ; URLs publiques/signées, pas de stockage disque en prod.
- **Imports circulaires** — importer les models à l'intérieur des fonctions quand nécessaire (pattern déjà utilisé dans `dependencies.py`).

## Environment (`.env`)

- `ENVIRONMENT` — `development` (DB locale) | `production` (Supabase).
- DB locale : `LOCAL_DB_HOST/USER/PASSWORD/PORT/NAME`. DB prod : `DB_USER`, `DB_PASSWORD`, `SUPABASE_HOST`, `DB_PORT`, `DB_NAME`.
- `SECRET_KEY` (auto-généré si absent — **à fixer en prod**), `ACCESS_TOKEN_EXPIRE_MINUTES`.
- E-mail : `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`.
- `CORS_ORIGINS` (CSV), `CORS_ALLOW_LOCAL_NETWORK`.
- R2 : `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT_URL`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`, `R2_SIGNED_URL_EXPIRATION`.
- `FRONTEND_BASE_URL` (liens d'invitation), `GOOGLE_PLACES_API_KEY`.

## Scripts utiles

`scripts/create_super_admin.py` (bootstrap admin), `scripts/create_debate_groups.py`, `scripts/*_poll*.py`, `scripts/migrate_from_supabase.sh`.

## Documentation

Guides par domaine dans `docs/` : `BACKEND_GUIDE.md`, `AUTH_AND_USER_API_GUIDE.md`, `INVITATION_FLOW.md`, `INVITATION_REQUESTS_API.md`, `SESSIONS_API_GUIDE.md`, `THEMES_API_GUIDE.md`, `RESOURCES_AND_FEEDBACK_API_GUIDE.md`, `POLLS_API_GUIDE.md`, `QUESTIONNAIRES_API.md`, `COMMISSIONS_API.md`, `LIBRARY_API_GUIDE.md`, `LOCATIONS_API_GUIDE.md`, `ACTIVITY_TEMPLATES_API.md`, `GUEST_USER_RESTRICTIONS.md`.

## Git Commits

Never include `Co-Authored-By` or any Claude attribution in commit messages. Commits must only show the human author.
