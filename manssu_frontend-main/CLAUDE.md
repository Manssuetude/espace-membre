# CLAUDE.md — Frontend

Guidance pour Claude Code dans **`manssu_frontend-main/`**. Vue d'ensemble du mono-repo : `../CLAUDE.md`.

## Overview

SPA **React 18 + TypeScript + Vite** de l'espace membre/admin Manssuétude. Tailwind CSS, React Router 6, TanStack Query 5, axios, sonner. Consomme l'API FastAPI (`../manssu_backend-main/`). Déployée sur **Vercel** (`https://membres.manssuetude.com`).

## Commands

```bash
npm install          # Dépendances
npm run dev          # Dev → http://localhost:5173
npm run build        # tsc && vite build (le typecheck bloque le build)
npm run preview      # Prévisualiser le build
npm run lint         # ESLint --max-warnings 0
```

## Architecture (chaîne de données, dépendances descendantes)

```
Page (src/pages/{auth,member,admin}/)
  → Hook TanStack Query (src/services/hooks/use*.ts)
      → API module (src/services/api/<domaine>.ts)
          → apiClient axios (src/services/api/client.ts)  ← baseURL, JWT, erreurs globales
```

- **`src/services/api/client.ts`** — instance axios unique. Injecte le JWT (`localStorage.token`) ; gère les erreurs **globalement** (toasts sonner ; `401` → purge `localStorage` + redirection `/auth/login` ; `403` silencieux ; parsing des erreurs `422` FastAPI via `extractErrorMessage`).
- **`src/services/api/`** — un module de fonctions d'appel par domaine. `queryKeys.ts` centralise les clés TanStack Query (utiliser pour cache/invalidation).
- **`src/services/hooks/`** — hooks `use*` encapsulant `useQuery`/`useMutation`. Config globale du client dans `main.tsx` (`staleTime` 5 min, `retry` 1, `refetchOnWindowFocus` false).
- **`src/pages/`** — pages par rôle : `auth/` (Login, VerifyOTP, InvitationPage, CompleteProfile), `member/`, `admin/`.
- **`src/components/`** — composants réutilisables ; `layouts/` (`MemberLayout`, `AdminLayout`), `ProtectedRoute` (auth requise), `BlockGuestRoute` (bloque les invités), `admin/`, `member/`.
- **`src/contexts/`** — `AuthContext` (session, login OTP, flux invités, `useAuth`), `PageTitleContext`, `UpcomingSessionsContext`. Providers montés dans `main.tsx`.
- **`src/types/`** — types TS par domaine. **`src/utils/`** — helpers purs (dates, ressources, library, users).

Le routage complet est déclaré dans `src/App.tsx`.

## Conventions

- **TypeScript strict** (`strict`, `noUnusedLocals`, `noUnusedParameters`). Le build échoue au moindre warning ESLint (`--max-warnings 0`). Pas de `any` non justifié.
- **Data-fetching** — **toujours** via un hook TanStack Query (`src/services/hooks/`), jamais d'`apiClient`/axios direct dans un composant. Nouvel endpoint = module dans `services/api/` + hook `use*` + clé dans `queryKeys.ts`.
- **Gestion d'erreur** — déjà centralisée dans `client.ts`. Ne pas dupliquer un toast d'erreur générique ; n'ajouter un toast local que pour un message métier spécifique.
- **Styling** — Tailwind CSS uniquement (pas de CSS ad hoc hors `index.css`). Palette (`tailwind.config.js`) : `primary #dc2626`, `secondary #f97316`, `accent #3b82f6`, `warning #eab308`, `success #10b981`. Police **Inter**.
- **Notifications** — `sonner` (`<Toaster position="top-right" richColors />` monté dans `main.tsx`).
- **Routing par rôle** — protéger les pages avec `ProtectedRoute` + le layout adéquat (`MemberLayout` / `AdminLayout`) ; `BlockGuestRoute` pour interdire les invités. Suivre le pattern existant dans `App.tsx`.

## Environment (`.env`)

- `VITE_BACKEND_URL` — URL de l'API (dev `http://127.0.0.1:8000`, prod `https://api.manssuetude.com`).
- `VITE_REACT_GOOGLE_PLACES_API_KEY` — Google Places (autocomplétion d'adresses, `GooglePlacesAutocomplete`).

Les variables exposées au client **doivent** être préfixées `VITE_`.

## Déploiement

Vercel. `vercel.json` réécrit toutes les routes vers `/index.html` (SPA). Build = `npm run build`.

## Documentation

`PROJECT_OVERVIEW.md`, `api_docs/`, `README.md`.

## Git Commits

Never include `Co-Authored-By` or any Claude attribution in commit messages. Commits must only show the human author.
