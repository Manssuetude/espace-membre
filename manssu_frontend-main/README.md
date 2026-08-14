# Manssuétude - Frontend

Application React pour l'espace membre et administrateur de l'association Manssuétude.

## 🚀 Installation

```bash
npm install
```

## 🏃 Démarrage

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📁 Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── layouts/       # Layouts (MemberLayout, AdminLayout)
│   ├── Sidebar.tsx    # Barre latérale de navigation
│   ├── Header.tsx      # En-tête avec profil utilisateur
│   ├── StatCard.tsx   # Carte de statistique
│   ├── SessionCard.tsx # Carte de session
│   └── ...
├── pages/              # Pages de l'application
│   └── member/        # Pages de l'espace membre
│       └── Dashboard.tsx
└── App.tsx            # Point d'entrée de l'application
```

## 🎨 Design System

### Couleurs
- **Primary**: `#dc2626` (Rouge)
- **Secondary**: `#f97316` (Orange)
- **Accent**: `#3b82f6` (Bleu)
- **Warning**: `#eab308` (Jaune)
- **Success**: `#10b981` (Vert)

### Typographie
- Police: **Inter** (Google Fonts)

## 🛠️ Technologies

- React 18
- TypeScript
- Tailwind CSS
- React Router
- Vite

