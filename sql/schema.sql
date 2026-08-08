-- Exalt Docs — schéma de base de données
-- À exécuter dans l'éditeur SQL de Supabase (Project > SQL Editor).

create extension if not exists pgcrypto;

-- =========================================================================
-- Table documents
-- =========================================================================
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  titre text not null,
  client_nom text not null,
  client_whatsapp text not null,
  code_acces text not null,              -- haché (bcrypt), jamais en clair
  fichier_path text not null,            -- chemin dans le bucket privé "documents"
  date_creation timestamptz not null default now(),
  date_expiration timestamptz,
  actif boolean not null default true
);

create index if not exists documents_slug_idx on documents (slug);

-- =========================================================================
-- Table journal
-- =========================================================================
create table if not exists journal (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  evenement text not null check (evenement in ('creation', 'tentative', 'succes', 'echec')),
  horodatage timestamptz not null default now(),
  ip text
);

create index if not exists journal_document_id_horodatage_idx
  on journal (document_id, horodatage desc);

-- =========================================================================
-- Sécurité : RLS activé, aucune policy pour anon/authenticated.
-- Seule la clé service_role (utilisée uniquement côté serveur) peut lire
-- ou écrire ces tables ; elle contourne le RLS.
-- =========================================================================
alter table documents enable row level security;
alter table journal enable row level security;

-- =========================================================================
-- Stockage : bucket privé pour les PDF
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Aucune policy storage pour anon/authenticated : seule la clé service_role
-- (côté serveur) peut uploader ou générer des URL signées vers ce bucket.
