# Espace Membre Manssuétude

> Plateforme membre/administrateur de l'association Manssuétude — mono-repo API + SPA.

---

## Vision

Manssuétude est une association intellectuelle française. L'**espace membre** est l'outil interne où les adhérents gèrent leur profil, s'inscrivent aux sessions, proposent et consultent des thèmes de débat, accèdent aux ressources et à la bibliothèque, répondent aux sondages et questionnaires, et participent aux commissions/groupes de travail. Les administrateurs y pilotent l'ensemble : membres, invitations, contenus, statistiques.

C'est un projet **hobby / budget zéro** : toute l'infrastructure (hébergement, base de données, stockage, e-mail) tourne sur des offres gratuites ou à très faible coût.

---

## Structure du repo

Mono-repo Git contenant **deux applications indépendantes**, déployées séparément :

```
espace_membre/
├── manssu_backend-main/     API REST FastAPI (Python)
├── manssu_frontend-main/    SPA React + TypeScript
├── database/                 Scripts one-off DB (gitignoré, secrets locaux uniquement)
├── docs/                     Documentation transverse (workflows git, etc.)
└── .github/workflows/        CI GitHub Actions
```

Le frontend consomme **exclusivement** l'API backend via axios — aucune logique métier ni accès base de données côté client.

---

## Stack technique

| Couche              | Technologie                                                                 |
| -------------------- | ------------------------------------------------------------------------------ |
| Frontend             | React 18, TypeScript (strict), Vite, Tailwind CSS, React Router, TanStack Query, axios |
| Backend               | FastAPI (Python), SQLAlchemy 2.0, Alembic, Pydantic v2                        |
| Base de données       | PostgreSQL — locale en dev, [Supabase](https://supabase.com) en production    |
| Authentification      | OTP e-mail (code à 6 chiffres, expiration 10 min) → JWT (`HS256`, 7 jours)     |
| Stockage fichiers     | Cloudflare R2 (compatible S3)                                                  |
| Emails transactionnels| [Resend](https://resend.com) (API HTTP)                                       |
| Hébergement           | Vercel — 2 projets serverless séparés (root directory par app)                |
| CI                    | GitHub Actions (`.github/workflows/ci.yml`)                                   |
| Qualité frontend      | ESLint (0 warning toléré), Prettier, Husky (pre-commit/pre-push)              |

### Domaines de production

| App      | Domaine                                          |
| --------- | --------------------------------------------------- |
| Backend   | `https://apis.manssuetude.com`                      |
| Frontend  | `https://membre.manssuetude.com` (+ `https://membres.manssuetude.com`) |

---

## Architecture

### Backend (`manssu_backend-main/`) — couches à dépendances descendantes

```
API Route (app/api/v1/<domaine>.py)
  → Dependencies (app/dependencies.py)     ← get_current_user / _admin / _super_admin
  → Schema (app/schemas/<domaine>.py)      ← validation & sérialisation Pydantic
  → Service (app/services/<domaine>_service.py)  ← logique métier, seule couche orchestrant plusieurs models
      → Model (app/models/<entité>.py)     ← SQLAlchemy ORM
          → Database (app/database.py)     ← session PostgreSQL
```

`app/core/` regroupe la config (`config.py`, settings Pydantic), la sécurité (JWT/hash), le cache et les exceptions custom. `app/main.py` monte l'app FastAPI, le middleware CORS (avec support réseau local en dev) et les routeurs.

### Frontend (`manssu_frontend-main/`) — SPA par rôle

```
Page (src/pages/{auth,member,admin}/)
  → Hook TanStack Query (src/services/hooks/use*.ts)
      → Module API (src/services/api/*.ts)
          → apiClient axios (src/services/api/client.ts)  ← JWT, erreurs globales (toasts, 401 → logout)
```

Routes protégées par rôle (`ProtectedRoute`, `BlockGuestRoute`), layouts dédiés (`MemberLayout`, `AdminLayout`).

### Domaines fonctionnels (miroir back ↔ front)

`auth/users` · `sessions` (+ invitations de session) · `themes` · `resources` (+ feedbacks) · `polls/sondages` · `questionnaires` · `commissions` (+ work groups) · `library/bibliothèque` (+ prêts) · `locations` · `invites` (demandes d'invitation) · `activity_templates` · `dashboard`.

### Rôles & authentification

- Auth sans mot de passe : OTP envoyé par e-mail (Resend), échangé contre un JWT valable 7 jours
- Rôles hiérarchiques sur `User.role` : `super_admin` > `admin` > membre
- Seuls les comptes `status == "active"` sont authentifiés ; pas d'accès admin par défaut

---

## Installation rapide

### Backend

```bash
cd manssu_backend-main
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # renseigner les variables (voir la section ci-dessous)
alembic upgrade head
uvicorn app.main:app --reload
```

API sur `http://localhost:8000` — Swagger `/docs`, ReDoc `/redoc`.

### Frontend

```bash
cd manssu_frontend-main
npm install
cp .env.example .env   # VITE_BACKEND_URL=http://127.0.0.1:8000
npm run dev
```

SPA sur `http://localhost:5173`.

---

## Variables d'environnement

Détail complet dans les `.env.example` de chaque app :

- **Backend** — DB (locale ou Supabase), `SECRET_KEY`, Resend (`RESEND_API_KEY`/`FROM_EMAIL`/`FROM_NAME`), CORS, R2 (`R2_*`), `FRONTEND_BASE_URL`, Google Places
- **Frontend** — `VITE_BACKEND_URL`, `VITE_REACT_GOOGLE_PLACES_API_KEY`

⚠️ Aucun `.env` réel n'est commité (gitignoré dans les deux apps). Les secrets de production vivent uniquement dans les variables d'environnement des projets Vercel.

---

## Scripts utiles

**Backend** (`manssu_backend-main/`)

| Commande                                    | Description                |
| --------------------------------------------- | ----------------------------- |
| `uvicorn app.main:app --reload`               | Lance l'API en local          |
| `alembic revision --autogenerate -m "msg"`    | Génère une migration         |
| `alembic upgrade head`                        | Applique les migrations      |
| `pytest`                                      | Lance les tests               |

**Frontend** (`manssu_frontend-main/`)

| Commande                | Description                       |
| ------------------------- | ------------------------------------ |
| `npm run dev`              | Lance Vite en local                  |
| `npm run build`            | `tsc --noEmit` + build Vite prod     |
| `npm run preview`          | Prévisualise le build                |
| `npm run lint`             | ESLint (`--max-warnings 0`)          |
| `npm run format:check`     | Vérifie le formatage Prettier        |

---

## Git, CI et déploiement

Modèle de branches : `main` (protégée, production) / `front` (travail frontend) / `back` (travail backend). Détail complet — conventions de commit, PR, checks CI obligatoires, hooks Husky : [`docs/WORKFLOWS.md`](docs/WORKFLOWS.md).

- `main` exige une **pull request** pour merger (pas de push direct, y compris admins) et les checks CI `frontend` + `backend` au vert
- Chaque push (branche ou PR) déclenche la CI : lint + format + build côté frontend, compilation côté backend
- Un merge dans `main` déclenche le déploiement automatique des deux projets Vercel

---

## Documentation complète

| Document                                                                       | Description                              |
| ---------------------------------------------------------------------------------- | -------------------------------------------- |
| [docs/WORKFLOWS.md](docs/WORKFLOWS.md)                                             | Branches, commits, PR, CI, hooks Husky     |
| [manssu_backend-main/docs/](manssu_backend-main/docs/)                             | Guides API détaillés par domaine (auth, sessions, thèmes, ressources, sondages, questionnaires, commissions, bibliothèque, locations, invitations, templates d'activité, restrictions invités) |
| [manssu_frontend-main/PROJECT_OVERVIEW.md](manssu_frontend-main/PROJECT_OVERVIEW.md) | Vue d'ensemble frontend                    |
