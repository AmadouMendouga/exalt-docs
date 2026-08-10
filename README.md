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
SESSION_SECRET=
INSTITUT_WHATSAPP=+237691927372
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Facultatif — voir "Évolution phase 2" plus bas
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_NAME=
WHATSAPP_TEMPLATE_LANG=fr
```

- `ADMIN_PASSWORD` : mot de passe unique de l'espace `/admin`, utilisé
  uniquement pour la connexion — choisir une valeur longue et aléatoire.
- `SESSION_SECRET` : secret distinct utilisé pour signer (HMAC) le cookie de
  session admin. Doit être une valeur longue et aléatoire, différente
  d'`ADMIN_PASSWORD` (ex. `openssl rand -hex 32`). Ne jamais la réutiliser
  comme mot de passe : changer l'une ne doit pas invalider ou compromettre
  l'autre.
- `NEXT_PUBLIC_SITE_URL` : URL publique du site, utilisée pour construire le
  contenu des QR codes (`{NEXT_PUBLIC_SITE_URL}/d/{slug}`).
- `SUPABASE_SERVICE_ROLE_KEY` ne doit **jamais** être préfixée `NEXT_PUBLIC_`
  et n'est utilisée que dans du code serveur (routes API, actions serveur).
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`,
  `WHATSAPP_TEMPLATE_LANG` : facultatives. Si absentes, l'envoi WhatsApp
  reste manuel (lien `wa.me`, phase 1). Voir "Évolution phase 2" plus bas
  pour leur obtention et pour la création du template Meta.

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
3. Renseigner les 6 variables obligatoires ci-dessus (et les 4 variables
   WhatsApp si la phase 2 est déjà configurée) dans
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
(`envoyerNotification`). Tant que les 4 variables `WHATSAPP_*` ne sont pas
renseignées, la fonction construit un lien `wa.me` ouvert manuellement
(phase 1). Dès qu'elles sont définies, le serveur envoie automatiquement le
message via l'API Graph de Meta, à la création d'un document et à chaque
régénération de code — sans aucune autre modification de code.

### Prérequis côté Meta

1. **Numéro WhatsApp dédié**, jamais utilisé dans l'application WhatsApp
   grand public (l'inscription à la Cloud API le déconnecte définitivement
   de l'app mobile).
2. **WhatsApp Business Account (WABA)** créé et lié à un compte
   **Meta Business** vérifié (vérification d'entreprise requise pour lever
   les limites d'envoi).
3. **Token permanent** : créer un *System User* dans Meta Business Suite
   (Paramètres de l'entreprise > Utilisateurs > Utilisateurs système), lui
   attribuer le WABA avec la permission `whatsapp_business_messaging`, puis
   générer un token sans expiration → `WHATSAPP_TOKEN`.
   (Un token obtenu depuis l'explorateur d'API Graph expire sous 24h à 60
   jours selon le type — ne pas l'utiliser en production.)
4. **Phone Number ID** : Meta Business Suite > WhatsApp > Numéros de
   téléphone API — copier l'ID (différent du numéro affiché) →
   `WHATSAPP_PHONE_NUMBER_ID`.
5. **Template de message** : comme l'institut initie la conversation, le
   texte libre est interdit — un template doit être créé et approuvé dans
   Meta Business Suite > WhatsApp > Modèles de message, catégorie
   **Utility** ou **Authentication**. Le corps doit contenir **exactement 4
   variables, dans cet ordre** :
   `{{1}}` prénom · `{{2}}` titre du document · `{{3}}` lien du document ·
   `{{4}}` code d'accès.
   Une fois approuvé (délai Meta variable, quelques minutes à 24h) :
   - nom exact du template → `WHATSAPP_TEMPLATE_NAME`
   - langue choisie à la création (ex. `fr`) → `WHATSAPP_TEMPLATE_LANG`

### Bascule

Ajouter les 4 variables dans Vercel (Production **et** Preview) puis
redéployer. Aucune configuration Vercel additionnelle requise. Pour revenir
au mode manuel, il suffit de supprimer (ou vider) l'une des 4 variables.
