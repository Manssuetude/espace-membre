# Workflows Git — Espace Membre Manssuétude

> Conventions de branches, pull requests et commits pour le mono-repo `manssu_backend-main/` + `manssu_frontend-main/`.

---

## Branches

| Branche | Usage                                                              |
| ------- | ------------------------------------------------------------------- |
| `main`  | Version stable, **protégée**, déployée en production (backend + frontend) |
| `front` | Branche de travail pour les changements `manssu_frontend-main/`   |
| `back`  | Branche de travail pour les changements `manssu_backend-main/`    |

Pas de `develop` ni de `feature/*` : le repo est à taille réduite, donc `front` et `back` servent directement de branches de travail par domaine. Committer directement sur `front` ou `back` pour les tâches courantes ; ouvrir une branche courte à partir de l'une d'elles pour un chantier plus large si besoin de l'isoler.

**Flux type :**

1. Travailler sur `front` (changements frontend) ou `back` (changements backend)
2. Pousser → la CI se déclenche automatiquement sur la branche
3. Une fois prêt pour la prod, ouvrir une Pull Request vers `main`
4. La CI doit passer sur les deux jobs (`frontend` et `backend`) avant que la PR soit mergeable
5. Merge dans `main` → déploiement Vercel (backend + frontend, projets séparés)

---

## Pull Requests

**Chaque PR vers `main` doit inclure :**

- Objectif de la PR
- App(s) concernée(s) : backend, frontend, ou les deux
- Étapes de validation exécutées (tests manuels, `npm run build`, `alembic upgrade head` si migration, etc.)
- Captures d'écran pour les changements UI
- Notes de migration si le schéma DB change (nouvelle révision Alembic)

---

## Convention de commits

**Préfixes à utiliser :**

| Préfixe     | Usage                                       |
| ----------- | -------------------------------------------- |
| `feat:`     | Nouvelle fonctionnalité                     |
| `fix:`      | Correction de bug                           |
| `refactor:` | Refactoring sans changement de comportement |
| `docs:`     | Documentation uniquement                    |
| `test:`     | Ajout ou modification de tests              |
| `chore:`    | Maintenance, configuration, dépendances     |

---

## Checks requis avant merge sur `main`

La branche `main` est protégée sur GitHub : les deux jobs CI (`frontend`, `backend`) doivent réussir, même si la PR ne touche qu'une seule des deux apps — le mono-repo est petit, ça reste peu coûteux et ça garantit qu'aucune régression croisée ne passe.

**Frontend (`manssu_frontend-main/`) :**

```bash
npm run lint          # ESLint --max-warnings 0
npm run format:check  # Prettier
npm run build          # tsc --noEmit + vite build
```

**Backend (`manssu_backend-main/`) :**

```bash
python -m compileall -q app   # vérifie la syntaxe/l'import de tout le code
```

Détail des jobs : [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

Règles de protection appliquées sur `main` : **pull request obligatoire pour merger** (pas de push direct, même pour les admins), status checks obligatoires et à jour (`strict`), pas de force-push, pas de suppression de branche, résolution des conversations de review obligatoire.

---

## Hooks Git (Husky — frontend uniquement)

Husky n'est configuré que côté `manssu_frontend-main/` (pas d'équivalent Python côté backend, la CI `compileall` suffit à ce stade).

**Hooks configurés :**

| Hook         | Déclencheur  | Action                                                                                    |
| ------------ | ------------ | ------------------------------------------------------------------------------------------ |
| `pre-commit` | `git commit` | `lint-staged` reformate avec Prettier les fichiers `.ts/.tsx/.json/.md/.css` stagés        |
| `pre-push`   | `git push`   | Vérifie que tout le frontend est formaté (`npm run format:check`) — bloque le push sinon    |

Comme le repo est un mono-repo, les hooks Husky vivent dans `manssu_frontend-main/.husky/` et sont invoqués avec ce sous-dossier comme cible explicite (Husky v9 ne remonte pas les répertoires parents pour trouver `.git`) ; voir le script `"prepare"` dans `manssu_frontend-main/package.json`.

Si `format:check` échoue au push : lancer `npx prettier --write .` dans `manssu_frontend-main/`, re-commiter, repousser.

---

## Déploiement

`main` est la seule branche connectée aux projets Vercel de production (backend → `apis.manssuetude.com`, frontend → `membre.manssuetude.com`). Un merge dans `main` déclenche automatiquement les deux déploiements. `front` et `back` ne déploient pas automatiquement (sauf preview Vercel éventuel sur PR, à activer manuellement si souhaité).
