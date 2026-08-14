# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Espace Membre Manssuétude** est la plateforme membre/administrateur de l'association Manssuétude (association intellectuelle française). C'est un mono-repo à deux applications indépendantes :

- **`manssu_backend-main/`** — API REST **FastAPI** (Python), SQLAlchemy + Alembic, PostgreSQL (local en dev, Supabase en prod). Authentification par **OTP e-mail + JWT**. Stockage fichiers sur **Cloudflare R2**. Servie en prod sur `https://api.manssuetude.com`.
- **`manssu_frontend-main/`** — SPA **React 18 + TypeScript + Vite**, Tailwind CSS, React Router, TanStack Query, axios. Déployée sur **Vercel** (`https://membres.manssuetude.com`).

Le frontend consomme exclusivement l'API backend via axios. Aucune logique métier ni accès DB côté front.

## Commands

### Backend (`manssu_backend-main/`)

```bash
source .venv/bin/activate                  # Activer le venv (macOS/Linux)
pip install -r requirements.txt            # Installer les dépendances
uvicorn app.main:app --reload              # Dev server → http://localhost:8000
alembic revision --autogenerate -m "msg"   # Générer une migration
alembic upgrade head                       # Appliquer les migrations
pytest                                     # Tests
```

Docs auto : http://localhost:8000/docs (Swagger) · http://localhost:8000/redoc

### Frontend (`manssu_frontend-main/`)

```bash
npm install          # Installer les dépendances
npm run dev          # Dev server → http://localhost:5173
npm run build        # tsc + vite build (le typecheck est la 1re barrière)
npm run preview      # Prévisualiser le build
npm run lint         # ESLint (--max-warnings 0)
```

## Architecture

### Backend — architecture en couches (dépendances toujours descendantes)

```
API Route (app/api/v1/)         ← Route Handlers FastAPI, un fichier par domaine
  → Dependencies (app/dependencies.py)   ← auth JWT, get_current_user / _admin / _super_admin
  → Schema (app/schemas/)       ← validation Pydantic (entrée/sortie)
  → Service (app/services/)     ← logique métier
      → Model (app/models/)     ← SQLAlchemy ORM
          → Database (app/database.py)   ← session PostgreSQL
```

- **`app/api/v1/`** — un routeur par domaine, montés dans `app/main.py` sous `/api/v1/<domaine>`. Chaque route valide (Pydantic), vérifie l'auth (dépendances), délègue au service, renvoie un schéma.
- **`app/services/`** — logique métier ; un service par domaine (`*_service.py`). Seule couche autorisée à orchestrer plusieurs models.
- **`app/models/`** — modèles SQLAlchemy, un fichier par entité.
- **`app/schemas/`** — schémas Pydantic (validation + sérialisation), un fichier par domaine.
- **`app/core/`** — `config.py` (settings pydantic), `security.py` (JWT/hash), `cache.py`, `exceptions.py` (exceptions HTTP custom).
- **`app/main.py`** — app FastAPI, middleware CORS (avec support IP réseau local), middleware de logging verbeux (requêtes/réponses vers `logs/app_YYYYMMDD.log`), montage des routeurs.

### Frontend — SPA par rôle

```
Page (src/pages/{auth,member,admin}/)
  → Hook TanStack Query (src/services/hooks/use*.ts)
      → API module (src/services/api/*.ts)
          → apiClient axios (src/services/api/client.ts)  ← baseURL, JWT, gestion erreurs globale
```

- **`src/services/api/client.ts`** — instance axios unique. Injecte le JWT (`localStorage.token`), gère les erreurs globalement (toasts sonner ; 401 → purge + redirection `/auth/login` ; 403 silencieux ; parsing des erreurs 422 FastAPI).
- **`src/services/api/`** — un module par domaine (fonctions d'appel API). `queryKeys.ts` centralise les clés TanStack Query.
- **`src/services/hooks/`** — hooks `use*` encapsulant TanStack Query (cache, invalidation).
- **`src/pages/`** — pages par rôle : `auth/`, `member/`, `admin/`.
- **`src/components/`** — composants réutilisables, dont `layouts/` (`MemberLayout`, `AdminLayout`), `ProtectedRoute`, `BlockGuestRoute`.
- **`src/contexts/`** — `AuthContext` (session, login OTP, invités), `PageTitleContext`, `UpcomingSessionsContext`.
- **`src/types/`** — types TS par domaine. **`src/utils/`** — helpers purs (dates, ressources, users…).

## Domaines fonctionnels

Domaines miroir entre back (`api/v1/`, `services/`, `models/`) et front (`services/api/`, `pages/`) :
**auth/users**, **sessions** (+ session_invites), **themes**, **resources** (+ feedbacks), **polls/sondages**, **questionnaires**, **commissions** (+ work_groups), **library/bibliothèque** (avec prêts), **locations**, **invites** (invitation_requests), **activity_templates/formats**, **dashboard**.

## Key Conventions

### Backend
- **Python + FastAPI**, SQLAlchemy 2.0, Pydantic v2. Validation à la frontière via schemas Pydantic.
- **Auth** — OTP e-mail (6 chiffres, expiration 10 min) → JWT (`HS256`, 7 jours). Dépendances : `get_current_user`, `get_current_admin`, `get_current_super_admin`, `get_optional_user`.
- **Rôles** — `role` sur `User` : `super_admin` > `admin` > membre. Statut utilisateur : seul `status == "active"` est authentifié. **Ne pas réintroduire d'accès admin par défaut.**
- **Exceptions** — utiliser les exceptions custom de `app/core/exceptions.py` (`UnauthorizedException`, `ForbiddenException`, …).
- **Migrations** — toute évolution de schéma passe par une révision Alembic (`app/models/` → `alembic revision --autogenerate`). Ne jamais modifier la DB à la main.
- **E-mail** — OTP/invitations via Resend, voir `app/services/email_service.py`.
- **Fichiers** — uploads sur Cloudflare R2 via `app/services/r2_storage_service.py` (`USE_R2=True`).

### Frontend
- **TypeScript strict** (`strict`, `noUnusedLocals`, `noUnusedParameters`). Le build échoue au moindre warning ESLint.
- **Data-fetching** — toujours via un hook TanStack Query (`src/services/hooks/`), jamais d'appel axios direct dans un composant. Nouvel endpoint = module dans `services/api/` + hook + clé dans `queryKeys.ts`.
- **Styling** — Tailwind CSS uniquement. Palette (voir `tailwind.config.js`) : `primary #dc2626`, `secondary #f97316`, `accent #3b82f6`, `warning #eab308`, `success #10b981`. Police **Inter**.
- **Notifications** — `sonner` (toasts). Les erreurs API sont déjà gérées globalement dans `client.ts` — ne pas dupliquer un toast d'erreur générique.
- **Routing** — routes par rôle protégées par `ProtectedRoute` (auth) et `BlockGuestRoute` (bloque les invités). Layouts `MemberLayout` / `AdminLayout`.

## Environment Variables

### Backend (`.env`)
- `ENVIRONMENT` — `development` (DB locale) ou `production` (Supabase).
- DB locale : `LOCAL_DB_HOST/USER/PASSWORD/PORT/NAME`. DB prod : `DB_USER`, `DB_PASSWORD`, `SUPABASE_HOST`, `DB_PORT`, `DB_NAME`.
- `SECRET_KEY` (JWT ; auto-généré si absent), `ACCESS_TOKEN_EXPIRE_MINUTES`.
- E-mail : `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`.
- `CORS_ORIGINS` (CSV), `CORS_ALLOW_LOCAL_NETWORK`.
- R2 : `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT_URL`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`.
- `FRONTEND_BASE_URL` (liens d'invitation), `GOOGLE_PLACES_API_KEY`.

### Frontend (`.env`)
- `VITE_BACKEND_URL` — URL de l'API (dev `http://127.0.0.1:8000`, prod `https://api.manssuetude.com`).
- `VITE_REACT_GOOGLE_PLACES_API_KEY` — Google Places (autocomplétion d'adresses).

## Database

PostgreSQL. Modèles dans `app/models/`, migrations versionnées dans `alembic/versions/` (appliquer avec `alembic upgrade head`). En dev, base locale `manssu_local` ; en prod, Supabase. Entités principales : User, Session (+ SessionInvite), Theme, Resource, Feedback, Poll, Questionnaire, Commission (+ WorkGroup), Library, Location, InvitationRequest, ActivityTemplate, OTP.

## Documentation

- **Backend** — guides détaillés par domaine dans `manssu_backend-main/docs/` : `BACKEND_GUIDE.md`, `AUTH_AND_USER_API_GUIDE.md`, `INVITATION_FLOW.md`, `SESSIONS_API_GUIDE.md`, `THEMES_API_GUIDE.md`, `RESOURCES_AND_FEEDBACK_API_GUIDE.md`, `POLLS_API_GUIDE.md`, `QUESTIONNAIRES_API.md`, `COMMISSIONS_API.md`, `LIBRARY_API_GUIDE.md`, `LOCATIONS_API_GUIDE.md`, `ACTIVITY_TEMPLATES_API.md`, `GUEST_USER_RESTRICTIONS.md`.
- **Frontend** — `manssu_frontend-main/PROJECT_OVERVIEW.md`, `api_docs/`, `README.md`.

## Git Commits

Never include `Co-Authored-By` or any Claude attribution in commit messages. Commits must only show the human author.
