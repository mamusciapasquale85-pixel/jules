-- Demandes de compte adulte (prof, éducateur) faites depuis la page de connexion.
-- Écriture par le serveur uniquement (clé service) ; lecture et décision par l'admin.
create type public.statut_demande as enum ('en_attente', 'acceptee', 'refusee');

create table public.demandes_compte (
  id          uuid primary key default gen_random_uuid(),
  prenom      text not null check (char_length(prenom) between 1 and 80),
  nom         text not null check (char_length(nom) between 1 and 80),
  email       text not null check (char_length(email) <= 254),
  role        public.role_adulte not null check (role in ('prof', 'educateur')),
  message     text check (char_length(message) <= 500),
  statut      public.statut_demande not null default 'en_attente',
  traite_par  uuid references public.adultes(id) on delete set null,
  traite_le   timestamptz,
  created_at  timestamptz not null default now()
);

-- Une seule demande en attente par adresse.
create unique index demandes_compte_une_en_attente on public.demandes_compte (lower(email)) where statut = 'en_attente';

alter table public.demandes_compte enable row level security;

create policy demandes_admin on public.demandes_compte for all to authenticated
  using (app.est_admin()) with check (app.est_admin());
