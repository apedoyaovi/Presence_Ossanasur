# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.







# Système de Gestion de Présence - Frontend Autonome

## Description

Ce projet est une application de gestion de présence entièrement autonome (frontend-only) qui simule le comportement d'une application complète avec backend. Il utilise React, TailwindCSS et LocalStorage pour stocker les données de manière persistante.

## Fonctionnalités

- **Système de pointage** : Scan de QR codes pour enregistrer les arrivées, départs, pauses, etc.
- **Gestion des employés** : Création, modification et suppression d'employés
- **Historique des présences** : Consultation de l'historique des pointages
- **Interface admin** : Accès sécurisé pour la gestion des employés et des pointages
- **Génération de QR codes** : Chaque employé dispose d'un QR code unique

## Technologies utilisées

- React 18
- React Router DOM
- TailwindCSS
- qrcode.react
- html5-qrcode (simulé)
- react-toastify
- lucide-react
- Vite

## Installation

1. Clonez le dépôt (si applicable) ou copiez les fichiers
2. Installez les dépendances :
```bash
npm install
```

3. Démarrez le serveur de développement :
```bash
npm run dev
```

L'application sera accessible à l'adresse `http://localhost:3000`

## Identifiants de test

Pour accéder à l'interface admin :
- Email : `admin@test.com`
 - Email : `admin@system.com`
- Mot de passe : `admin123`

## Structure du projet

```
src/
├── components/           # Composants réutilisables
│   ├── Navbar.jsx       # Barre de navigation
│   └── DashboardLayout.jsx # Layout admin
├── context/             # Contexte React
│   └── AuthContext.jsx  # Gestion de l'authentification
├── pages/               # Pages de l'application
│   ├── Accueil.jsx      # Page de pointage
│   ├── Historique.jsx   # Historique public
│   ├── AdminLogin.jsx   # Page de connexion admin
│   └── admin/           # Pages admin
│       ├── CreationEmploye.jsx
│       ├── ListeEmployes.jsx
│       └── HistoriqueAdmin.jsx
├── services/            # Services et données
│   └── mockData.js      # Données simulées et CRUD
├── utils/               # Utilitaires
└── App.jsx              # Point d'entrée principal
```

## Données simulées

L'application utilise des données simulées stockées dans le LocalStorage :

- **25 employés** avec des informations réalistes
- **60+ enregistrements de présence** sur 7 jours
- **Historique complet** avec tous les types d'actions

## Fonctionnalités clés

### Interface utilisateur
- Page de pointage avec sélection d'action
- Historique des pointages avec filtres et tris
- Téléchargement de QR code personnel

### Interface admin
- Gestion complète des employés
- Historique détaillé des pointages
- Génération et envoi de QR codes
- Statistiques et filtres avancés

### Authentification
- Système d'authentification simulé
- Protection des routes admin
- Persistance de la session

## Données stockées

L'application stocke les données suivantes dans le LocalStorage :
- `employees` : Liste des employés
- `presenceHistory` : Historique des pointages
- `authData` : Informations d'authentification
- `nextEmployeeId` : Prochain ID pour un nouvel employé
- `nextPresenceId` : Prochain ID pour un nouvel enregistrement

## Personnalisation

Pour modifier les données initiales :
1. Modifiez le fichier `src/services/mockData.js`
2. Les données seront réinitialisées au chargement de l'application si elles n'existent pas dans le LocalStorage

## Déploiement

Pour produire une version de production :
```bash
npm run build
```

Le dossier `dist` contiendra les fichiers prêts à être déployés sur n'importe quel serveur web.

## Limitations

- L'application ne dispose pas de backend réel
- Les données sont stockées localement dans le navigateur
- Le scan de QR code est simulé (pas de caméra réelle)
- Aucune synchronisation entre différents utilisateurs

## Auteur

Développé avec React et TailwindCSS pour une expérience utilisateur fluide et moderne.