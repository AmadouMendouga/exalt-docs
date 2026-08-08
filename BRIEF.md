# Exalt Docs — Cahier des charges

Application web permettant à une cliente d'accéder à un document PDF (bon de soin,
chèque bien-être, facture, attestation) en scannant un QR code puis en saisissant
un code d'accès reçu par WhatsApp.

Commanditaire : Exalt Institut — Yassa, Nkolmbong, Douala, Cameroun.

---

## 1. Principe de fonctionnement

1. Une personne de l'institut crée un document depuis l'espace admin :
   nom de la cliente, numéro WhatsApp, upload du PDF.
2. Le système génère un identifiant public (slug) et un code d'accès à 6 caractères.
3. Le QR code, imprimé sur le bon, encode l'URL publique du document.
4. Le code d'accès est transmis séparément, par WhatsApp.
5. La cliente scanne, saisit le code, consulte le PDF.

**Règle de sécurité centrale : le lien et le code ne transitent jamais par le même
canal.** Le QR seul ne donne accès à rien. Un bon perdu ou photographié est inexploitable
sans le code.

---

## 2. Stack technique

| Élément | Choix |
| --- | --- |
| Framework | Next.js (App Router) |
| Hébergement | Vercel (offre gratuite) |
| Base de données | Supabase — PostgreSQL |
| Stockage PDF | Supabase Storage, bucket **privé** |
| Génération QR | librairie `qrcode` côté serveur |
| Envoi WhatsApp | lien `wa.me` pré-rempli (phase 1) |

Contrainte impérative : **aucun PDF ne doit être servi depuis un dossier public.**
L'accès se fait uniquement par URL signée à durée limitée, générée après validation
du code.

---

## 3. Modèle de données

### Table `documents`

| Champ | Type | Note |
| --- | --- | --- |
| `id` | uuid | clé primaire |
| `slug` | text unique | identifiant public dans l'URL |
| `titre` | text | ex. « Bon de soin — 25 000 FCFA » |
| `client_nom` | text | |
| `client_whatsapp` | text | format international, ex. +237691927372 |
| `code_acces` | text | 6 caractères, stocké **haché** |
| `fichier_path` | text | chemin dans le bucket Supabase |
| `date_creation` | timestamptz | |
| `date_expiration` | timestamptz | nullable |
| `actif` | boolean | permet de révoquer un document |

### Table `journal`

| Champ | Type | Note |
| --- | --- | --- |
| `id` | uuid | |
| `document_id` | uuid | référence `documents` |
| `evenement` | text | `creation`, `tentative`, `succes`, `echec` |
| `horodatage` | timestamptz | |
| `ip` | text | facultatif |

---

## 4. Écrans

### 4.1 Espace admin — `/admin`

Protégé par un mot de passe unique stocké en variable d'environnement.

Formulaire de création :
- Titre du document
- Nom de la cliente
- Numéro WhatsApp
- Upload du PDF
- Date d'expiration (facultative)

Après création, afficher :
- Le QR code en PNG, téléchargeable et imprimable
- Le code d'accès en clair (**affiché une seule fois**)
- Un bouton « Envoyer par WhatsApp » ouvrant un lien `wa.me` pré-rempli
- Un bouton « Notifier l'institut » vers le numéro interne

Liste des documents existants : titre, cliente, date, statut, nombre de consultations,
bouton de révocation.

### 4.2 Page publique — `/d/[slug]`

- Logo Exalt, fond sobre, aux couleurs de la charte
- Champ de saisie du code
- Limitation : 5 tentatives, puis blocage 15 minutes
- En cas de succès : affichage du PDF dans un lecteur intégré + bouton de téléchargement
- Messages d'erreur distincts : code incorrect / document expiré / document révoqué

---

## 5. Charte graphique

| Usage | Couleur |
| --- | --- |
| Titres de section | `#90503b` |
| Accents, boutons | `#cc7457` |
| Bordures, fonds de ligne | `#dbc1b4` |
| Texte courant | `#231f20` |

Positionnement luxe : typographie sérif pour les titres, beaucoup d'espace blanc,
aucune surcharge visuelle. Le rendu doit être digne d'un institut haut de gamme,
pas d'un outil interne.

---

## 6. Message WhatsApp — modèle

```
Bonjour {prenom},

Votre {titre} Exalt Institut est disponible.
Scannez le QR code figurant sur votre bon, puis saisissez ce code d'accès :

{code}

Ce code est personnel. Ne le communiquez à personne.

Exalt Institut — Yassa, Nkolmbong
(+237) 691 927 372
```

---

## 7. Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
INSTITUT_WHATSAPP=+237691927372
NEXT_PUBLIC_SITE_URL=
```

La clé `service_role` ne doit **jamais** être exposée côté client.

---

## 8. Évolution prévue (phase 2)

Bascule vers l'envoi WhatsApp automatique via la Cloud API de Meta.
Prévoir dès maintenant une fonction `envoyerNotification(destinataire, message)`
isolée dans un seul module, afin que le passage à l'API ne touche qu'un fichier.

Prérequis à anticiper : compte Meta Business vérifié, numéro dédié non utilisé
dans l'application WhatsApp classique, modèles de message approuvés en catégorie
*utility* ou *authentication*.

---

## 9. Ordre de construction suggéré

1. Initialisation Next.js + connexion Supabase
2. Schéma de base de données et bucket privé
3. Page publique de consultation (cœur du système)
4. Espace admin et création de documents
5. Génération des QR codes
6. Journal et limitation des tentatives
7. Habillage graphique aux couleurs Exalt
8. Déploiement Vercel
