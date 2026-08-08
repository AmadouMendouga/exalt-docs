# Exalt Docs

Application de consultation sécurisée de documents PDF (bon de soin, chèque
bien-être, facture, attestation) pour Exalt Institut. Voir [BRIEF.md](./BRIEF.md)
pour le cahier des charges complet.

## Stack

Next.js (App Router) · Supabase (PostgreSQL + Storage) · Vercel.

## 1. Mettre en place Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécuter le contenu de [`sql/schema.sql`](./sql/schema.sql).
   Ce script crée les tables `documents` et `journal`, active le RLS (aucune
   policy anon/authenticated — seule la clé `service_role` peut lire/écrire),
   et crée le bucket de stockage privé `documents`.
3. Récupérer dans **Project Settings > API** :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key (secrète) → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Variables d'environnement

Copier `.env.local.example` vers `.env.local` et renseigner :

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
INSTITUT_WHATSAPP=+237691927372
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- `ADMIN_PASSWORD` : mot de passe unique de l'espace `/admin`. Il sert aussi
  de secret pour signer le cookie de session — choisir une valeur longue et
  aléatoire.
- `NEXT_PUBLIC_SITE_URL` : URL publique du site, utilisée pour construire le
  contenu des QR codes (`{NEXT_PUBLIC_SITE_URL}/d/{slug}`).
- `SUPABASE_SERVICE_ROLE_KEY` ne doit **jamais** être préfixée `NEXT_PUBLIC_`
  et n'est utilisée que dans du code serveur (routes API, actions serveur).

## 3. Développement local

```bash
npm install
npm run dev
```

- `/` — page d'accueil
- `/d/[slug]` — page publique de consultation
- `/admin` — espace admin (protégé par `ADMIN_PASSWORD`)

## 4. Déploiement sur Vercel

1. Pousser le dépôt sur GitHub.
2. Importer le projet dans Vercel (offre gratuite).
3. Renseigner les 5 variables d'environnement ci-dessus dans
   **Project Settings > Environment Variables** (Production **et** Preview).
   Mettre à jour `NEXT_PUBLIC_SITE_URL` avec le domaine réel une fois attribué
   (nécessaire pour que les QR codes générés pointent vers la bonne URL).
4. Déployer. Aucune configuration Vercel additionnelle n'est requise — le
   projet est un Next.js standard (App Router, middleware/proxy inclus).

## Sécurité — points clés

- Aucun PDF n'est servi depuis un dossier public : le bucket Supabase
  `documents` est privé, et l'accès se fait via une URL signée à durée
  limitée (5 minutes), générée uniquement après validation du code d'accès.
- Le code d'accès est stocké haché (bcrypt), jamais en clair.
- Le lien (QR code) et le code d'accès (WhatsApp) transitent par deux canaux
  distincts, conformément à la règle de sécurité centrale du cahier des
  charges.
- Limitation à 5 tentatives par document, puis blocage de 15 minutes
  (voir `src/lib/rateLimit.ts`).
- Le RLS Postgres est activé sans aucune policy publique : seule la clé
  `service_role`, utilisée exclusivement côté serveur, peut accéder aux
  tables.

## Évolution phase 2 — WhatsApp automatique

L'envoi WhatsApp est isolé dans `src/lib/notifications.ts`
(`envoyerNotification`). En phase 1, cette fonction construit un lien `wa.me`
ouvert manuellement. Le passage à la Cloud API de Meta ne nécessitera de
modifier que ce fichier.
