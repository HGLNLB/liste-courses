# Liste de courses

Application web mobile-first pour gérer une liste de courses personnelle.  
Hébergement prévu : **Vercel** (frontend) + **Supabase** (auth + base de données).

## Fonctionnalités

- **Catégories** : créer (+), renommer (tap sur le titre), supprimer (appui long → mode édition), réorganiser (drag & drop)
- **Couleurs** par catégorie (style Apple Notes)
- **Volets déroulants** ouverts par défaut
- **Éléments** : nom, quantité, unité, notes — ajout en bas de chaque catégorie
- **Cases à cocher** : cocher une catégorie coche tous ses éléments ; décocher un élément décoche la catégorie
- **Sections filtrées** : « À acheter » (non cochés) et « Pas besoin » (cochés)
- **Recherche** : loupe en haut à droite, scroll automatique vers l’élément
- **Session persistante** : connexion une fois, reste connecté
- **PWA** : installable sur l’écran d’accueil, cache hors ligne basique

## Démarrage local

### 1. Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Exécutez le script SQL : `supabase/schema.sql`
3. Dans **Authentication → Providers**, activez **Email**
4. (Optionnel) Désactivez la confirmation email en dev : **Authentication → Settings → Enable email confirmations** → off

### 2. Variables d’environnement

```bash
cp .env.local.example .env.local
```

Renseignez :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Lancer l’app

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) sur votre téléphone (même réseau) ou dans le navigateur.

## Déploiement Vercel

1. Poussez le repo sur GitHub
2. Importez le projet dans [Vercel](https://vercel.com)
3. Ajoutez les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Déployez

Dans Supabase → **Authentication → URL Configuration**, ajoutez l’URL Vercel en **Site URL** et **Redirect URLs**.

## Utilisation mobile

| Action | Geste |
|--------|--------|
| Créer une catégorie | Bouton **+** |
| Modifier une catégorie | Tap sur le titre |
| Mode édition catégories | Appui long sur une catégorie |
| Supprimer / déplacer catégories | En mode édition : **−** ou drag & drop |
| Quitter le mode édition | Tap ailleurs |
| Mode édition éléments | Appui long sur un élément |
| Cocher / décocher | Case à droite (hors mode édition) |
| Rechercher | Loupe en haut à droite |

## Stack

- Next.js 16 · React 19 · TypeScript · Tailwind CSS 4
- Supabase (Auth + PostgreSQL + RLS)
- @dnd-kit (drag & drop tactile)
- PWA (manifest + service worker)
