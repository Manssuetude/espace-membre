# Audit de conformité — Espace Membre Manssuétude

**Date de l'audit :** 2026-08-20
**Périmètre :** espace membre uniquement (auth, profil, sessions, feedbacks, bibliothèque, questionnaires, ressources). Association française → RGPD + droit français + recommandations CNIL en priorité.
**Méthode :** analyse exhaustive du code source (backend FastAPI + frontend React), sans test en conditions réelles — le fichier `.env` backend local pointait vers la base Supabase de **production** (`ENVIRONMENT=production`), donc aucun serveur n'a été démarré ni aucun compte de test créé, pour ne pas risquer d'écrire dans les données réelles des membres.

> Ce score et ces constats ne constituent pas une certification juridique. Aucun problème majeur supplémentaire n'a été identifié au-delà de ceux listés ci-dessous, sous réserve des informations disponibles et de l'évolution de la réglementation — la conformité finale doit être validée par un professionnel du droit compétent.

---

## A. Résumé exécutif — les 5 problèmes majeurs

1. **IDOR en écriture** : `PATCH /resources/{resource_id}` (backend `app/api/v1/resources.py:211-234`) permet à n'importe quel membre authentifié de modifier une ressource créée par un autre membre — aucune vérification de propriétaire.
2. **Aucune protection contre le bruteforce du code OTP** : ni compteur d'échecs, ni verrouillage, ni rate limiting sur `/auth/send-otp` / `/auth/verify-otp`. Le code (6 chiffres, 10 min de validité) est en plus stocké **en clair** en base (`app/models/otp.py:13`).
3. **Journalisation qui capture des données ultra-sensibles en clair** : le middleware de logging (`app/main.py:121-207`) logue l'intégralité des corps de requête ET de réponse — y compris le code OTP, le **JWT complet** renvoyé à la connexion, et les données de profil (téléphone, adresse, bio).
4. **Aucune page légale ni bandeau de consentement** : pas de mentions légales, pas de politique de confidentialité, pas de politique cookies, aucun composant de gestion du consentement — alors que des traceurs tiers (Vercel Analytics, Google Fonts, Font Awesome CDN, script Google Maps/Places) se chargent sans condition dès l'arrivée sur le site.
5. **Aucun droit RGPD self-service** : pas d'export de données, pas de suppression de compte par le membre lui-même (seul un admin peut faire un *hard delete* SQL), pas de gestion des consentements dans l'espace « Profil ».

---

## B. Tableau de conformité

| Domaine | Statut | Score | Problèmes principaux |
|---|---|---:|---|
| RGPD | 🔴 Insuffisant | 8/25 | Pas de politique de confidentialité, pas de droits self-service, logs contenant des données personnelles et le JWT |
| Cookies / ePrivacy | 🔴 Insuffisant | 3/15 | Aucun bandeau, traceurs chargés avant tout consentement |
| Sécurité | 🟠 Risques importants | 7/20 | Pas de rate limiting OTP, OTP en clair, JWT en localStorage sans révocation, aucun header de sécurité, IDOR, logs qui fuient des secrets, `.env` dev pointant sur la prod |
| Mentions légales | 🔴 Absent | 0/10 | Aucune page trouvée |
| Accessibilité | 🟠 Risques importants | 5/15 | `FormInput` sans `htmlFor`/`id` sur tous les formulaires membre, champs OTP non labellisés, icônes décoratives non masquées |
| Droit de la consommation | ⚪ Non applicable (a priori) | 4/5 | Aucun paiement/abonnement identifié dans le périmètre audité — à confirmer sur le reste du site |
| DSA | ⚪ Probablement hors champ | 4/5 | Pas de contenu public/plateforme ouverte identifié — à confirmer sur le statut exact de l'association |
| PI / droit à l'image | 🟠 À vérifier | 2/5 | Règlement intérieur traite le sujet en séance, mais avatars servis depuis un bucket Google externe non identifié |

**Score global : 33/100 — site fortement non conforme**, sous réserve des informations disponibles et de l'évolution de la réglementation. Ce score ne doit pas être présenté comme une certification juridique.

---

## C. Problèmes critiques (détail)

### [CRITIQUE] IDOR en écriture sur les ressources
**Réglementation concernée :** RGPD (intégrité des données, art. 5.1.f) / sécurité applicative
**Problème :** `PATCH /resources/{resource_id}` n'exige que `Depends(get_current_user)` (tout membre connecté), sans comparer `resource.created_by` à l'appelant. `ResourceService.update_resource` charge la ressource par id seul et applique les modifications.
**Risque :** N'importe quel membre peut altérer le contenu (lien, description, session de rattachement) d'une ressource créée par un autre membre — intégrité des contenus compromise, vecteur de désinformation ou de sabotage interne.
**Élément concerné :** `manssu_backend-main/app/api/v1/resources.py:211-234`, `app/services/resource_service.py:235-264`.
**Correction recommandée :** Ajouter une vérification `resource.created_by == current_user.id or current_user.role in (admin, super_admin)` avant toute modification, sur le modèle de ce qui existe déjà pour la bibliothèque (`_ensure_owner_or_admin`, `library.py:32-39`).
**Priorité :** Immédiate.

### [CRITIQUE] Aucune protection contre le bruteforce de l'OTP
**Réglementation concernée :** RGPD art. 32 (sécurité du traitement) / recommandations CNIL sur l'authentification
**Problème :** Aucun compteur de tentatives, aucun verrouillage de compte, aucune limite de débit sur `/auth/send-otp` et `/auth/verify-otp`. Un attaquant connaissant l'e-mail d'un membre peut tenter les 10⁶ combinaisons du code pendant sa fenêtre de validité de 10 minutes, ou spammer l'envoi d'OTP (coût Resend, déni de service léger).
**Risque :** Prise de contrôle de compte par bruteforce, épuisement du quota d'envoi d'e-mails, usurpation d'identité de membre.
**Élément concerné :** `app/services/auth_service.py:22-153`, `app/api/v1/auth.py`.
**Correction recommandée :** Limiter le nombre de tentatives de vérification par OTP émis (ex. 5 max, puis invalidation), limiter la fréquence de renvoi (ex. 1 par minute), envisager un throttling par IP/e-mail (`slowapi` ou équivalent). Stocker le code hashé plutôt qu'en clair, comparer en temps constant.
**Priorité :** Immédiate.

### [CRITIQUE] Fuite de secrets et de données personnelles dans les logs applicatifs
**Réglementation concernée :** RGPD art. 5.1.f et 32 (confidentialité et sécurité du traitement)
**Problème :** Le middleware de logging journalise l'intégralité des corps de requête et de réponse. Cela inclut le code OTP envoyé par le membre, le **JWT complet** retourné à `/auth/verify-otp` (valable 7 jours), et toutes les données de profil (téléphone, adresse, bio). Seuls les headers `Authorization`/`Cookie` sont exclus — pas le corps.
**Risque :** Toute personne ayant accès aux fichiers de logs (`logs/app_YYYYMMDD.log`) ou aux logs console Vercel peut usurper n'importe quel compte membre pendant 7 jours en rejouant un JWT trouvé dans les logs, ou lire des données personnelles en clair. C'est une violation potentielle de données au sens de l'art. 4.12 RGPD si ces logs sont exposés.
**Élément concerné :** `app/main.py:74-227` (LoggingMiddleware).
**Correction recommandée :** Exclure systématiquement le corps des routes d'authentification (`/auth/*`), masquer/tronquer les champs sensibles (`accessToken`, `code`, `phone`, `address`) dans les payloads loggués, définir une politique de rétention/purge des logs.
**Priorité :** Immédiate.

### [HAUTE] Aucune page légale, aucun bandeau de consentement
**Réglementation concernée :** RGPD (information/transparence, art. 12-14) / ePrivacy / droit français (loi confiance économie numérique)
**Problème :** Recherche exhaustive côté frontend : aucune page « Mentions légales », « Politique de confidentialité », « Politique cookies », aucun composant de type CookieBanner/ConsentManager. Aucune route correspondante dans `App.tsx`.
**Risque :** Absence totale d'information légale obligatoire ; impossibilité pour un membre d'exercer ses droits faute de savoir qui contacter ; sanction CNIL possible (mise en demeure, amende).
**Élément concerné :** Ensemble du frontend, absence de `src/pages/legal/*`.
**Correction recommandée :** Créer les pages minimales (voir section E), un bandeau de consentement bloquant réellement le chargement des scripts non essentiels tant que le consentement n'est pas donné, avec refus aussi simple que l'acceptation.
**Priorité :** Haute.

### [HAUTE] Aucun droit RGPD self-service dans l'espace membre
**Réglementation concernée :** RGPD art. 15, 17, 20 (accès, effacement, portabilité)
**Problème :** `AccountActionsSidebar.tsx` ne propose qu'un bouton « Se déconnecter ». La suppression de compte n'existe que côté admin (`DELETE /users/{id}`), avec un **hard delete SQL direct** (`user_service.py:460-485`), sans anonymisation. Aucun export de données, aucune gestion des consentements.
**Risque :** Un membre ne peut pas exercer seul ses droits d'accès/effacement/portabilité ; dépendance totale à une action manuelle d'un administrateur, non traçable comme processus RGPD.
**Élément concerné :** `src/components/member/AccountActionsSidebar.tsx`, `app/services/user_service.py:460-485`.
**Correction recommandée :** Ajouter dans « Mon profil » : téléchargement d'un export JSON/PDF des données, demande de suppression de compte (avec confirmation), page de gestion des consentements. Basculer la suppression vers une anonymisation (ou un vrai *soft delete* avec purge différée) plutôt qu'un `DELETE` SQL immédiat, pour préserver l'intégrité des données liées (ex. votes de sondages, historique de sessions) sans exposer l'identité.
**Priorité :** Haute.

### [HAUTE] JWT stocké en `localStorage`, sans révocation possible
**Réglementation concernée :** RGPD art. 32 / bonnes pratiques OWASP
**Problème :** Le token (7 jours de validité) et les données utilisateur sont stockés en `localStorage` (`client.ts:19`, `AuthContext.tsx:40,109,129`), donc lisibles par tout script JS exécuté sur la page — exposé en cas de faille XSS. Le `POST /auth/logout` ne fait que renvoyer un succès sans invalider le token côté serveur (`auth.py:87-98`, commentaire explicite « currently just returns success »).
**Risque :** Un JWT volé (XSS, extension malveillante, poste partagé) reste valide 7 jours même après déconnexion ou changement de mot de passe/OTP.
**Élément concerné :** `src/services/api/client.ts`, `src/contexts/AuthContext.tsx`, `app/api/v1/auth.py:87-98`.
**Correction recommandée :** À terme, migrer vers un cookie `httpOnly` + `Secure` + `SameSite=Strict/Lax` pour le token plutôt que `localStorage` ; en attendant, réduire la durée de vie du token et implémenter une liste de révocation (blacklist en base ou cache) consultée à chaque requête sensible.
**Priorité :** Haute (structurel, à planifier).

### [HAUTE] Aucun header de sécurité HTTP
**Réglementation concernée :** RGPD art. 32 / bonnes pratiques OWASP
**Problème :** `app/main.py` ne configure aucun header `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`. Seul le CORS est géré, avec `allow_credentials=True` combiné à `allow_methods=["*"]` et `allow_headers=["*"]`.
**Risque :** Exposition accrue au clickjacking (pas de `X-Frame-Options`), au MIME-sniffing, et surface XSS plus dangereuse sans CSP (le vol de JWT en `localStorage` devient trivial en cas d'injection).
**Élément concerné :** `app/main.py:230-328`.
**Correction recommandée :** Ajouter un middleware de headers de sécurité (CSP restrictive listant explicitement les domaines tiers autorisés, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`), et restreindre `allow_headers`/`allow_methods` à ce qui est réellement utilisé.
**Priorité :** Haute.

### [MOYENNE] Environnement de développement configuré pour pointer vers la production
**Réglementation concernée :** RGPD art. 32 (sécurité) / hygiène opérationnelle
**Problème :** `manssu_backend-main/.env` local a `ENVIRONMENT=production` avec les vrais identifiants Supabase, Resend et R2. `config.py` (`DATABASE_URL`) bascule automatiquement sur la base Supabase de production dès que `ENVIRONMENT != "development"`.
**Risque :** Toute manipulation locale (tests, scripts, démarrage accidentel du serveur) agit directement sur les données réelles des membres et peut envoyer de vrais e-mails. Un secret de production (mot de passe DB, clé R2, clé Resend) réside en clair sur un poste de développeur.
**Élément concerné :** `manssu_backend-main/.env`.
**Correction recommandée :** Basculer le `.env` local sur `ENVIRONMENT=development` avec une base Postgres locale dédiée, garder les identifiants de prod uniquement dans les variables d'environnement Vercel (jamais en fichier local), régénérer les secrets exposés si le poste ou le fichier a pu être partagé/synchronisé (ex. iCloud, Git, sauvegarde cloud).
**Priorité :** Haute.

### [MOYENNE] Accessibilité — formulaires du membre non labellisés programmatiquement
**Réglementation concernée :** Accessibilité (WCAG 2.1 AA — critères 1.3.1, 4.1.2)
**Problème :** Le composant générique `src/components/FormInput.tsx` (utilisé dans `Profil.tsx`, `CompleteProfile.tsx`, etc.) rend un `<label>` et un `<input>` sans `id`/`htmlFor` — association uniquement visuelle. Les 6 champs OTP (`VerifyOTP.tsx`, `InvitationPage.tsx`) n'ont ni label individuel ni `aria-label`.
**Risque :** Un utilisateur de lecteur d'écran ne peut pas identifier à quoi correspond chaque champ dans les formulaires les plus critiques de l'espace membre (profil, connexion).
**Élément concerné :** `src/components/FormInput.tsx`, `src/pages/auth/VerifyOTP.tsx`, `src/pages/auth/InvitationPage.tsx:304-317`.
**Correction recommandée :** Générer un `id` unique dans `FormInput` et le lier via `htmlFor` ; ajouter un `aria-label="Chiffre N du code"` sur chaque input OTP.
**Priorité :** Moyenne-haute.

### [FAIBLE/À VÉRIFIER] Avatars servis depuis un bucket Google externe non identifié
**Réglementation concernée :** RGPD (sous-traitance, art. 28) / propriété intellectuelle
**Problème :** Plusieurs composants construisent des URL d'avatar vers `storage.googleapis.com/uxpilot-auth.appspot.com/avatars/...` (`userUtils.ts:42,104`, `ParticipantsSidebar.tsx:18`, etc.) — un bucket qui semble être un reliquat d'un outil de prototypage tiers (« UX Pilot »), pas une infrastructure maîtrisée par l'association.
**Risque :** Requête systématique vers un tiers non identifié à chaque affichage d'avatar (fuite d'IP), absence de contrat de sous-traitance, risque de rupture de service si ce bucket tiers est fermé, statut juridique des images incertain.
**Élément concerné :** `src/utils/userUtils.ts:42,104` et autres fichiers utilisant ce domaine.
**Correction recommandée :** Confirmer l'origine de ce domaine (reliquat de prototypage à supprimer, ou service réellement utilisé à documenter/contractualiser) ; à terme héberger les avatars sur l'infrastructure R2 déjà utilisée pour le reste des fichiers.
**Priorité :** Moyenne — **Information nécessaire avant validation** : confirmer si ce bucket est un service maîtrisé par l'association.

---

## D. Corrections recommandées (synthèse)

| # | Action | Effort |
|---|---|---|
| 1 | Ajouter le contrôle de propriétaire sur `PATCH /resources/{id}` | Faible |
| 2 | Rate limiting + verrouillage sur OTP, hasher le code en base | Moyen |
| 3 | Exclure/masquer les champs sensibles du logging (token, OTP, PII) | Faible |
| 4 | Créer les pages légales + bandeau de consentement bloquant | Moyen |
| 5 | Ajouter export de données + suppression de compte self-service | Moyen |
| 6 | Ajouter headers de sécurité (CSP, HSTS, X-Frame-Options) | Faible |
| 7 | Basculer le `.env` local sur une base de dev isolée, faire tourner les secrets de prod exposés | Faible |
| 8 | Corriger `FormInput` (id/htmlFor) + labels des champs OTP | Faible |
| 9 | Clarifier/supprimer la dépendance au bucket avatar externe | Faible |
| 10 | Implémenter une vraie révocation de session (logout serveur) | Moyen-élevé |

---

## E. Pages juridiques nécessaires

- **Mentions légales** (obligatoire, absente)
- **Politique de confidentialité** (obligatoire, absente) — doit couvrir : responsable de traitement, finalités par domaine (auth, profil, sessions, feedbacks, bibliothèque, questionnaires), bases juridiques, durées de conservation, destinataires (Resend, Cloudflare R2, Supabase, Vercel), droit de réclamation CNIL, absence/présence de transfert hors UE (Vercel/Resend/Google sont des entités US — à documenter précisément)
- **Politique cookies / traceurs** (obligatoire, absente) — couvrant Vercel Analytics, Google Fonts, Font Awesome CDN, script Google Maps/Places
- **Gestionnaire de consentement (CMP)** — absent, à implémenter
- **CGU de l'espace membre** (conditions d'accès/usage du service — recommandé, distinct du règlement intérieur déjà existant)
- **CGV** : non nécessaire a priori (aucune vente/paiement identifié dans le périmètre audité)
- **Politique d'accessibilité** : à évaluer selon le statut exact de l'association (obligation renforcée si financement public)

Le **règlement intérieur** (`Reglement.tsx`) existe déjà et traite bien du droit à l'image en séance — bonne pratique à conserver, mais insuffisant pour couvrir les obligations RGPD/cookies.

---

## F. Cookies et services tiers — inventaire

| Élément | Finalité | Fournisseur | Consentement requis ? | Activé avant consentement ? | Durée | Données transmises |
|---|---|---|---|---|---|---|
| Vercel Analytics (`main.tsx:33`) | Mesure d'audience | Vercel Inc. (US) | À vérifier — exemption CNIL possible seulement si strictement anonymisé/agrégé | **Oui** (chargé sans condition sur toutes les pages) | Géré par Vercel | IP, user-agent, URL visitée, référent |
| Google Fonts (`index.html:7`) | Police Inter | Google LLC (US) | Probablement oui (jurisprudence CJUE « Munich », 2022) sauf auto-hébergement | Oui | Session | IP au chargement de la police |
| Font Awesome CDN (`index.html:8`) | Icônes | Cloudflare (cdnjs) | À évaluer | Oui | Session | IP au chargement du script |
| Google Places script (`GooglePlacesAutocomplete.tsx:96`) | Autocomplétion d'adresse (formulaires admin session) | Google LLC (US) | Oui | Oui, dès montage du composant | Session | IP, requêtes de saisie d'adresse |
| Avatars `storage.googleapis.com/uxpilot-auth...` | Affichage avatar | Origine incertaine | N/A (pas un traceur JS) mais fuite d'IP vers tiers non documenté | — | — | IP du membre à chaque affichage |

Aucun Google Analytics classique, Meta Pixel, Hotjar, Sentry ou reCAPTCHA détecté.

---

## G. Sécurité — vulnérabilités (synthèse)

- IDOR écriture sur ressources (voir C)
- Pas de rate limiting / lockout OTP (voir C)
- OTP stocké en clair
- Logs contenant JWT + PII en clair (voir C)
- Aucun header CSP/HSTS/X-Frame-Options/X-Content-Type-Options
- CORS `allow_credentials=True` + `allow_methods=["*"]` + `allow_headers=["*"]`
- JWT en `localStorage`, aucune révocation serveur au logout
- Upload de fichiers ressources sans validation de type/contenu réel (`r2_storage_service.py`) — seule la taille (10 Mo) est vérifiée
- `SECRET_KEY` auto-généré si absent en prod → risque d'incohérence entre instances serverless si non fixé explicitement sur Vercel (à vérifier dans les variables d'environnement Vercel, pas seulement le `.env` local)
- `.env` local pointant vers la production avec secrets réels (voir C)
- Adresse e-mail tierce codée en dur comme valeur par défaut (`config.py:53`, `contact@pumpyfamilylife.com`) — reliquat suspect à nettoyer

Points positifs à noter : les endpoints `/users/{id}`, feedbacks, bibliothèque et questionnaires ont un contrôle d'accès correct et cohérent (comparaison systématique à `current_user.id` ou garde `get_current_admin`) ; les URLs de fichiers bibliothèque sont signées et à durée limitée ; taille d'upload plafonnée ; pas de secret en dur dans le code applicatif.

---

## H. Accessibilité — problèmes WCAG (synthèse)

| Problème | Sévérité | Élément |
|---|---|---|
| `FormInput` sans `id`/`htmlFor` sur les formulaires membre | **Élevé** | `FormInput.tsx`, utilisé dans `Profil.tsx`, `CompleteProfile.tsx` |
| Champs OTP sans label/`aria-label` | **Élevé** | `VerifyOTP.tsx`, `InvitationPage.tsx:304-317` |
| Icônes décoratives jamais `aria-hidden` (842 occurrences, 0 `aria-hidden`) | Moyen | Ensemble du frontend |
| Pas de `<h1>` propre sur la page Profil | Moyen | `Profil.tsx` / `MemberLayout.tsx` |
| Pas de vérification de contraste / navigation clavier / zoom 200% effectuée (nécessite test manuel ou outillé, ex. axe-core, non exécuté ici) | Non évalué | — |

Points positifs : `alt` renseigné sur les images testées, focus visible via Tailwind (`focus:ring-2`) sur les champs de connexion, plusieurs formulaires (`FeedbackFormFields`, `PollOption`) utilisent correctement `htmlFor`/`id`.

---

## I. Plan d'action

**À faire immédiatement**
- Corriger l'IDOR sur `PATCH /resources/{id}`
- Ajouter rate limiting + lockout sur l'OTP, hasher le code stocké
- Retirer JWT/OTP/PII des logs applicatifs
- Basculer le `.env` local sur une base de dev isolée et faire tourner les secrets de prod potentiellement exposés (mot de passe DB, clé Resend, clés R2)

**À faire cette semaine**
- Mentions légales + politique de confidentialité minimales
- Bandeau de consentement bloquant les traceurs non essentiels
- Headers de sécurité (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Correction `FormInput` (id/htmlFor) + labels OTP

**À faire ensuite**
- Export de données + suppression de compte self-service (avec anonymisation plutôt que hard delete)
- Vraie révocation de session côté serveur (logout effectif)
- Migration progressive du JWT vers un cookie `httpOnly`/`Secure`/`SameSite`
- Clarifier l'origine du bucket avatar externe
- Audit accessibilité complet outillé (axe-core/Lighthouse) + politique d'accessibilité si applicable
- Vérifier le statut exact du transfert hors UE pour Resend/Vercel/Google et documenter les garanties (clauses contractuelles types)

---

## J. Score final

**RGPD** 8/25 · **Cookies/ePrivacy** 3/15 · **Sécurité** 7/20 · **Mentions légales** 0/10 · **Accessibilité** 5/15 · **Droit conso** 4/5 · **DSA** 4/5 · **PI/image** 2/5

## Score global : 33/100 — site fortement non conforme

Ce score reflète surtout l'absence totale de documentation légale et de gestion du consentement, combinée à des lacunes de sécurité concrètes (IDOR, OTP non protégé, fuite de secrets dans les logs). Le contrôle d'accès applicatif est globalement bien structuré par ailleurs (un seul IDOR trouvé sur un large périmètre testé).

Aucun problème majeur supplémentaire n'a été identifié au-delà de ceux listés ci-dessus, sous réserve des informations disponibles et de l'évolution de la réglementation — la conformité finale doit être validée par un professionnel du droit compétent, notamment sur le statut DSA/consommation qui dépend du reste du site (non audité ici) et sur les transferts hors UE réels des sous-traitants (Vercel, Resend).
