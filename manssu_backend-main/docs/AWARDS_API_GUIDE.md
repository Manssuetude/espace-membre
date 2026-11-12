## Awards API Documentation

Base URL: `/api/v1/awards` (temporary tables, read below) · `/api/v1/award-wins` (permanent).

All endpoints require authentication via Bearer token in the `Authorization` header.

### Overview

Les Awards sont une fonctionnalité **permanente** de l'Espace Membre : chaque année,
une édition traverse 6 phases pilotées par un calendrier global unique
(`award_settings`) :

```
teasing → nominations → sélection des finalistes → vote → cérémonie → palmarès
```

Entre deux éditions, les tables `award_categories`, `award_nominations`,
`award_candidates`, `award_votes` et `award_winners` sont vidées et reconstruites
via `POST /reset-all` (super admin uniquement). Les gains sont copiés avant la
remise à zéro dans `user_award_wins` (table **permanente**, jamais vidée), ce qui
permet aux badges de survivre d'une édition à l'autre.

### Roles

- **Admin / Super Admin** (`role` sur `User`) : accès complet au pilotage.
- **Commission "Vie asso"** : tout membre ou responsable d'une commission `active`
  dont le nom commence par "vie asso" (insensible à la casse) a les mêmes droits
  de pilotage qu'un admin sur les Awards, **sans** devenir admin ailleurs dans
  l'Espace Membre. Vérifié par `can_manage_awards()` (`app/services/award_service.py`)
  et exposé au frontend via `GET /am-i-award-manager`.
- **Super Admin uniquement** : `POST /reset-all`.
- **Tout membre authentifié** (y compris invité) : lecture des catégories, proposition
  de candidats, vote.

### Les 6 phases (calendrier global, `award_settings`)

| Champ | Phase ouverte |
|---|---|
| `teasing_start_at` | Teasing (révélation progressive des catégories) |
| `nomination_start_at` → `nomination_end_at` | Nominations (propositions des membres) |
| `nomination_end_at` → `vote_start_at` | Sélection des finalistes (l'organisateur construit la liste finale) |
| `vote_start_at` → `vote_end_at` | Vote |
| après `vote_end_at` | Cérémonie (préparation puis mode plein écran) |
| après publication | Palmarès |

La phase globale (`AwardEditionPhase` : `not_started / teasing / nomination /
selection / vote / ceremony_pending / published`) est calculée par
`AwardService._compute_edition_phase()` et pilote l'en-tête membre, la frise
admin et la carte tableau de bord. **Un jalon non renseigné ne bloque jamais en
amont** : si `teasing_start_at` est vide mais que `nomination_start_at` est déjà
passé (cas d'une édition démarrée avant l'ajout de ce champ), la phase saute
directement à `nomination` plutôt que de rester bloquée sur `not_started`.

Le statut par catégorie (`AwardCategoryStatus`) reste indépendant : `nomination /
curation / vote_scheduled / vote_open / awaiting_ceremony / results_published`.

### Teasing : retrait des champs, pas masquage

Pendant la phase teasing, `GET /categories` renvoie pour les non-organisateurs
`name`, `icon`, `description` à `null` tant que `reveal_at` de la catégorie n'est
pas passé — ces champs sont **retirés côté serveur**, jamais juste masqués côté
front. `revealed`, `revealAt`, `revealNumber`, `isNew` indiquent l'état de
révélation. `POST /categories/distribute-reveals` répartit les dates de
révélation également entre `teasing_start_at` et `nomination_start_at`.

### Aucune fuite de votes avant publication

`candidates` (organisateurs) et `finalists` (membres) ne portent jamais
`votes`/`percentage` tant que `category.results_published_at` est vide — **y
compris pour les organisateurs** sur `GET /categories`. Les votes réels ne sont
exposés aux organisateurs que sur les routes dédiées à la cérémonie
(`GET /ceremony/preparation`, pour trancher les égalités).

### Cérémonie

1. `GET /ceremony/preparation` : liste les catégories en attente de cérémonie
   (vote clos, liste finale non publiée), avec les votes réels et un indicateur
   `tie`.
2. `PUT /ceremony/preparation` : enregistre l'ordre de passage (`ceremonyOrder`)
   et résout les égalités (`co_winners` ou `winner` désigné). Sans égalité, le
   gagnant est déduit et enregistré automatiquement. Réécrit `award_winners`
   depuis zéro à chaque sauvegarde (idempotent).
3. `GET /ceremony` : flux plein écran, trié par `ceremonyOrder`. 409 si une
   égalité reste non tranchée.
4. `POST /publish-all-results` : publication groupée (plus de publication par
   catégorie). 400 si une égalité reste non tranchée. Copie chaque gagnant dans
   `user_award_wins` (idempotent par nom + année + cible), avec `isCoWinner` à
   `true` si plusieurs gagnants pour la catégorie.

### E-mails (3 positions, `award_settings.email_mode`)

- `off` : aucun envoi.
- `test` : envoyés uniquement aux super admins actifs, objet préfixé `[TEST]`.
- `on` : envoyés aux membres actifs concernés.

5 e-mails : teasing commencé, nominations ouvertes, vote ouvert, rappel J-1
avant la clôture du vote, résultats publiés. Chacun est envoyé **une seule fois**
par édition, grâce à un horodatage dédié (`teasing_email_sent_at`,
`nominations_open_email_sent_at`, `vote_open_email_sent_at`, `reminder_sent_at`)
vérifié par `POST /cron/tick`, appelé une fois par jour par le cron Vercel.

### Data Models

- **Temporaire (vidé à chaque `reset-all`)** : `AwardCategory`, `AwardNomination`,
  `AwardCandidate`, `AwardVote`, `AwardWinner`, les horodatages de
  `AwardSettings` (hors `edition_year`, `ceremony_session_id`, `email_mode`,
  conservés comme configuration de l'événement plutôt que comme état de test).
- **Permanent** : `UserAwardWin` (`award_name`/`award_icon` copiés, pas de FK vers
  `AwardCategory`, pour survivre à sa suppression). Un gagnant peut être un
  membre (`user_id`) ou une commission (`commission_id`), jamais les deux.

### Tests

`tests/test_awards.py` tourne contre une base Postgres locale **dédiée**
(`manssu_test`), jamais contre la base de développement/production :

```bash
createdb manssu_test        # une fois
pytest tests/test_awards.py -v
```

Couvre : droits (Vie asso = organisateur, membre lambda = 403), retrait des
champs en teasing, validation du calendrier, top 3 + égalité au seuil des
nominations, absence de fuite des votes avant publication, préparation de la
cérémonie (résolution auto si pas d'égalité, blocage si égalité non tranchée),
publication (co-lauréats, idempotence, année), e-mails (3 modes, cron envoyé
une seule fois par jalon).
