# Manssuétude - Vue d'ensemble du projet

## 📋 Description du projet

**Manssuétude** est une application web React/TypeScript pour la gestion d'une association. Elle permet aux membres de participer à des sessions, proposer des thèmes, répondre à des sondages, et partager des ressources. Les administrateurs peuvent gérer tous ces aspects ainsi que les membres de l'association.

## 🏗️ Architecture technique

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query) pour la gestion des données serveur
- **HTTP Client**: Axios
- **Notifications**: Sonner (toast notifications)
- **Build Tool**: Vite

## 👥 Rôles utilisateurs

### 1. **Guest** (Invité)
- Accès limité : peut voir les sessions et sondages, mais pas le dashboard, feedback, ou propositions de thèmes
- Statut temporaire avant validation par un admin

### 2. **Member** (Membre)
- Accès complet à l'espace membre
- Peut proposer des thèmes (quand la fenêtre est ouverte)
- Peut répondre aux sondages
- Peut donner du feedback
- Peut s'inscrire aux sessions
- Peut consulter les ressources

### 3. **Admin** (Administrateur)
- Accès à l'espace membre + espace admin
- Peut gérer les membres (mais pas les autres admins)
- Peut créer et gérer les sessions
- Peut créer et gérer les sondages
- Peut valider/rejeter les propositions de thèmes
- Peut gérer les ressources
- Peut consulter les feedbacks

### 4. **Super Admin** (Super Administrateur)
- Tous les droits d'admin
- Peut gérer les autres administrateurs
- Peut ouvrir/fermer les fenêtres de propositions de thèmes
- Accès complet à toutes les fonctionnalités

## 📱 Pages et menus - Espace Membre

### Menu de navigation (Sidebar)
1. **Tableau de bord** (`/`)
   - Statistiques (membres actifs, sessions effectuées, nouvelles ressources, taux de participation)
   - Prochaines sessions (2 prochaines)
   - Sondages actifs
   - Ressources récentes
   - Actions rapides :
     - Proposer un thème
     - Répondre à un sondage
     - Voir calendrier
     - Donner un feedback
     - **Inviter un membre** (nouveau - ouvre modal de demande d'invitation)

2. **Sessions** (`/sessions`)
   - Liste de toutes les sessions (à venir, en cours, passées)
   - Filtres par statut
   - Inscription aux sessions
   - Détails de chaque session

3. **Sondages** (`/sondages`)
   - Sondages actifs (en cours)
   - Sondages passés
   - Participation aux sondages
   - Résultats des sondages (si visibles)

4. **Proposer un thème** (`/proposer-theme` ou `/themes` → redirige vers `/proposer-theme`)
   - Formulaire de proposition (quand la fenêtre est ouverte)
   - Liste des thèmes proposés par l'utilisateur
   - Liste des thèmes approuvés
   - Affichage du statut de la fenêtre (ouverte/fermée)

5. **Feedback** (`/feedback`)
   - Formulaire pour soumettre un feedback
   - Options : anonyme ou avec identité
   - Feedback lié à une session (optionnel)

6. **Ressources** (`/ressources`)
   - Liste de toutes les ressources partagées
   - Filtres par type (fichier, vidéo, audio, dossier)
   - Filtres par session
   - Accès aux liens externes (Google Drive, YouTube, etc.)

7. **Profil** (`/profil`)
   - Informations personnelles
   - Modification du profil
   - Historique des participations
   - Historique des sondages
   - Historique des feedbacks

### Restrictions pour les Guests
- Pas d'accès au dashboard (`/`)
- Pas d'accès au feedback (`/feedback`)
- Pas d'accès à la proposition de thèmes (`/proposer-theme`)

## 🛠️ Pages et menus - Espace Admin

### Menu de navigation (AdminSidebar)
1. **Tableau de bord** (`/admin`)
   - Statistiques globales
   - Thèmes en attente de validation
   - Ressources en attente de validation
   - Feedbacks récents
   - Sondages actifs
   - Actions rapides de validation

2. **Sessions** (`/admin/sessions`)
   - Liste de toutes les sessions
   - Création de nouvelles sessions (`/admin/sessions/create`)
   - Détails et édition des sessions (`/admin/sessions/:id`)
   - Gestion des groupes de travail
   - Gestion des ressources de session
   - Gestion des sondages liés aux sessions

3. **Sondages** (`/admin/sondages`)
   - Liste de tous les sondages
   - Création de nouveaux sondages (`/admin/sondages/create`)
   - Détails et gestion des sondages (`/admin/sondages/:id`)
   - Résultats et statistiques
   - Gestion des participants

4. **Gestion des thèmes** (`/admin/themes`)
   - Liste de toutes les propositions de thèmes
   - Filtres par statut (pending, approved, rejected)
   - Validation/rejet des propositions
   - Gestion des fenêtres de propositions (super admin uniquement)
   - Historique des thèmes

5. **Ressources** (`/admin/ressources`)
   - Liste de toutes les ressources
   - Validation/rejet des ressources proposées
   - Ajout de nouvelles ressources (`/admin/ressources/add`)
   - Ressources des sessions passées (`/admin/ressources/past`)
   - Gestion des catégories

6. **Membres** (`/admin/membres`)
   - Liste de tous les membres
   - Filtres par statut, rôle, recherche
   - Détails d'un membre (`/admin/membres/:id`)
   - Création de membres
   - Modification des membres
   - Suspension/activation des membres
   - **Gestion des demandes d'invitation** (nouveau)
   - Gestion des invitations directes
   - Statistiques des membres

7. **Feedbacks** (`/admin/feedbacks`)
   - Liste de tous les feedbacks
   - Filtres par statut, catégorie, session
   - Détails des feedbacks
   - Marquage comme lu/résolu
   - Analyse des feedbacks

## 🔐 Authentification

### Flux d'authentification
1. **Login** (`/auth/login`)
   - Saisie de l'email
   - Envoi d'un code OTP par email

2. **Vérification OTP** (`/auth/verify-otp`)
   - Saisie du code reçu par email
   - Connexion et redirection selon le rôle

3. **Complétion du profil** (première connexion)
   - Complétion des informations personnelles
   - Upload de photo (optionnel)

4. **Invitation** (`/invitation/:code`)
   - Acceptation d'une invitation via code
   - Création de compte

## 📊 Fonctionnalités principales

### 1. Sessions
- **Création** : Admins peuvent créer des sessions avec thème, date, lieu, objectifs
- **Inscription** : Membres peuvent s'inscrire aux sessions
- **Groupes de travail** : Organisation des participants en groupes
- **Ressources** : Documents, vidéos, liens partagés pour chaque session
- **Sondages** : Sondages liés aux sessions (dates, thèmes, etc.)

### 2. Thèmes
- **Fenêtre de propositions** : Périodes où les membres peuvent proposer des thèmes
- **Validation** : Admins valident ou rejettent les propositions
- **Limite** : Nombre maximum de propositions par membre par fenêtre
- **Statuts** : pending → approved/rejected → current (utilisé dans une session)

### 3. Sondages
- **Types** : Anonyme ou avec identité
- **Options** : Choix multiples possibles
- **Résultats** : Visibles en temps réel ou cachés
- **Liaison** : Peuvent être liés à une session ou indépendants

### 4. Ressources
- **Types** : Fichiers, vidéos, audio, dossiers
- **Liens externes** : Google Drive, YouTube, etc.
- **Validation** : Admins valident les ressources proposées
- **Catégories** : Organisation par catégories

### 5. Feedbacks
- **Types** : Suggestion, Compliment, etc.
- **Anonymat** : Option pour feedback anonyme
- **Liaison** : Peut être lié à une session spécifique
- **Gestion** : Admins peuvent marquer comme lu/résolu

### 6. Invitations
- **Invitations directes** : Admins peuvent inviter directement
- **Demandes d'invitation** : Membres peuvent demander à inviter quelqu'un
  - Le membre remplit un formulaire (email, nom, raison, session)
  - L'admin valide ou rejette la demande
  - Si approuvée, une invitation est créée

## 🎨 Design System

### Couleurs
- **Primary**: `#dc2626` (Rouge)
- **Secondary**: `#f97316` (Orange)
- **Accent**: `#3b82f6` (Bleu)
- **Warning**: `#eab308` (Jaune)
- **Success**: `#10b981` (Vert)

### Typographie
- Police: **Inter** (Google Fonts)

### Composants réutilisables
- `StatCard` : Cartes de statistiques
- `SessionCard` : Cartes de sessions
- `ResourceCard` : Cartes de ressources
- `QuickActionButton` : Boutons d'actions rapides
- `Dropdown` : Menus déroulants
- `FormInput` : Champs de formulaire
- `Modal` : Modales diverses
- `Pagination` : Pagination de listes

## 📁 Structure des fichiers

```
src/
├── components/          # Composants réutilisables
│   ├── layouts/       # Layouts (MemberLayout, AdminLayout)
│   ├── member/         # Composants spécifiques membres
│   ├── admin/          # Composants spécifiques admins
│   └── ...             # Composants communs
├── pages/              # Pages de l'application
│   ├── member/         # Pages espace membre
│   ├── admin/          # Pages espace admin
│   └── auth/           # Pages d'authentification
├── services/           # Services API et hooks
│   ├── api/           # Clients API (axios)
│   └── hooks/         # React Query hooks
├── types/              # Définitions TypeScript
├── contexts/           # Contextes React (Auth, PageTitle, etc.)
└── utils/              # Utilitaires
```

## 🔄 Flux de données

1. **React Query** gère le cache et les requêtes serveur
2. **Axios** pour les appels HTTP
3. **Context API** pour l'authentification et les titres de page
4. **Local State** (useState) pour les états de composants

## 🚀 Routes principales

### Routes publiques
- `/auth/login` - Connexion
- `/auth/verify-otp` - Vérification OTP
- `/invitation/:code` - Acceptation invitation

### Routes membres (protégées)
- `/` - Dashboard
- `/sessions` - Liste sessions
- `/sessions/:id` - Détail session
- `/sondages` - Sondages
- `/proposer-theme` - Proposer thème
- `/themes` - Redirige vers `/proposer-theme`
- `/feedback` - Feedback
- `/ressources` - Ressources
- `/profil` - Profil

### Routes admin (protégées)
- `/admin` - Dashboard admin
- `/admin/sessions` - Gestion sessions
- `/admin/sessions/create` - Créer session
- `/admin/sessions/:id` - Détail session
- `/admin/sondages` - Gestion sondages
- `/admin/sondages/create` - Créer sondage
- `/admin/sondages/:id` - Détail sondage
- `/admin/themes` - Gestion thèmes
- `/admin/ressources` - Gestion ressources
- `/admin/ressources/add` - Ajouter ressource
- `/admin/ressources/past` - Ressources passées
- `/admin/membres` - Gestion membres
- `/admin/membres/:id` - Détail membre
- `/admin/feedbacks` - Gestion feedbacks

## 📝 Notes importantes

1. **Guests** : Les utilisateurs avec le rôle "guest" ont un accès limité et ne peuvent pas accéder au dashboard, feedback, ou propositions de thèmes.

2. **Fenêtre de propositions** : Les membres ne peuvent proposer des thèmes que pendant les périodes où la fenêtre est ouverte par un super admin.

3. **Validation** : Les admins doivent valider les propositions de thèmes et ressources avant qu'elles ne soient visibles par tous.

4. **Invitations** : Deux méthodes :
   - Invitation directe par admin
   - Demande d'invitation par membre (validée par admin)

5. **Sessions** : Les sessions peuvent être en ligne ou en présentiel, avec gestion des lieux via Google Places API.

6. **Ressources** : Actuellement, les ressources utilisent des liens externes (Google Drive, YouTube, etc.) plutôt que des uploads de fichiers directs.


