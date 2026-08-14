# Espace Membre Manssuétude

> Plateforme membre/administrateur de l'association Manssuétude — mono-repo API + SPA.

---

## Vision

Espace membre où les adhérents de Manssuétude gèrent leur profil, consultent les sessions, thèmes, ressources, sondages, questionnaires, commissions et la bibliothèque de l'association. Les administrateurs y pilotent l'ensemble (membres, invitations, contenus, statistiques).

Le repo contient deux applications **indépendantes** déployées séparément :

| App                    | Rôle                                          |
| ----------------------- | ---------------------------------------------- |
| `manssu_backend-main/`  | API REST FastAPI, source de vérité des données |
| `manssu_frontend-main/` | SPA React consommant l'API via axios           |

Le frontend ne contient aucune logique métier ni accès DB : tout passe par l'API.

---

## Stack

| Couche            | Technologie                                                    |
| ------------------ | ---------------------------------------------------------------- |
| Frontend           | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, axios |
| Backend            | FastAPI (Python), SQLAlchemy 2.0, Alembic, Pydantic v2           |
| Base de données    | PostgreSQL — locale en dev, Supabase en prod                    |
| Authentification   | OTP e-mail (6 chiffres) + JWT (`HS256`, 7 jours)                |
| Stockage fichiers  | Cloudflare R2                                                    |
| Emails             | Resend (API HTTP)                                                |
| Déploiement        | Vercel (2 projets séparés : `apis.manssuetude.com`, `membre.manssuetude.com`) |
| CI                 | GitHub Actions (`.github/workflows/ci.yml`)                     |

---

## Installation rapide

### Backend

```bash
cd manssu_backend-main
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # renseigner les variables (voir manssu_backend-main/CLAUDE.md)
alembic upgrade head
uvicorn app.main:app --reload
```

API sur `http://localhost:8000` — docs Swagger sur `/docs`.

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

Détail complet par app :

- Backend : voir la section *Environment* de [`manssu_backend-main/CLAUDE.md`](manssu_backend-main/CLAUDE.md) (DB, `SECRET_KEY`, Resend, CORS, R2, `FRONTEND_BASE_URL`, Google Places)
- Frontend : `VITE_BACKEND_URL`, `VITE_REACT_GOOGLE_PLACES_API_KEY`

⚠️ Ne jamais commiter de fichier `.env` réel — tous sont ignorés par Git. Les secrets de production sont configurés directement dans les projets Vercel (dashboard), pas dans le repo.

---

## Scripts utiles

**Backend** (`manssu_backend-main/`)

| Commande                                  | Description                    |
| ------------------------------------------ | -------------------------------- |
| `uvicorn app.main:app --reload`            | Lance l'API en local             |
| `alembic revision --autogenerate -m "msg"` | Génère une migration            |
| `alembic upgrade head`                     | Applique les migrations         |
| `pytest`                                   | Lance les tests                 |

**Frontend** (`manssu_frontend-main/`)

| Commande                | Description                          |
| ------------------------- | --------------------------------------- |
| `npm run dev`             | Lance Vite en local                    |
| `npm run build`           | `tsc` + build Vite production          |
| `npm run preview`         | Prévisualise le build                  |
| `npm run lint`            | ESLint (`--max-warnings 0`)            |
| `npm run format:check`    | Vérifie le formatage Prettier          |

---

## Architecture rapide

**Backend** — routes → dependencies (auth) → schemas Pydantic → services (logique métier) → models SQLAlchemy → DB. Voir [`manssu_backend-main/CLAUDE.md`](manssu_backend-main/CLAUDE.md).

**Frontend** — pages par rôle (`auth/`, `member/`, `admin/`) → hooks TanStack Query → modules API axios → `apiClient` (injection JWT, gestion d'erreurs globale). Voir [`manssu_frontend-main/CLAUDE.md`](manssu_frontend-main/CLAUDE.md).

Domaines fonctionnels partagés entre back et front : auth/users, sessions, themes, resources/feedbacks, polls/sondages, questionnaires, commissions/work_groups, library, locations, invites, activity_templates, dashboard.

---

## Git & CI

Voir [`docs/WORKFLOWS.md`](docs/WORKFLOWS.md) pour le modèle de branches (`main` / `front` / `back`), les conventions de commit, les checks CI obligatoires et les hooks Husky (frontend).

`main` est protégée : PR requise, checks `frontend` + `backend` obligatoires, pas de force-push. Le merge dans `main` déclenche le déploiement Vercel des deux apps.

---

## Documentation complète

| Document                                                     | Description                              |
| --------------------------------------------------------------- | ------------------------------------------- |
| [CLAUDE.md](CLAUDE.md)                                           | Vue d'ensemble du mono-repo                |
| [manssu_backend-main/CLAUDE.md](manssu_backend-main/CLAUDE.md)   | Architecture et conventions backend        |
| [manssu_frontend-main/CLAUDE.md](manssu_frontend-main/CLAUDE.md) | Architecture et conventions frontend       |
| [docs/WORKFLOWS.md](docs/WORKFLOWS.md)                           | Branches, commits, PR, CI, hooks           |
| [manssu_backend-main/docs/](manssu_backend-main/docs/)           | Guides API par domaine                     |
| [manssu_frontend-main/PROJECT_OVERVIEW.md](manssu_frontend-main/PROJECT_OVERVIEW.md) | Vue d'ensemble frontend |

---

**Par où commencer ?** → [CLAUDE.md](CLAUDE.md), puis le `CLAUDE.md` de l'app sur laquelle tu travailles.
