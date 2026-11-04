-- Jules — schéma de base de données (Supabase / PostgreSQL)
-- Migration 0001 : types, tables, index, fonctions d'accès, RLS.
-- À exécuter sur un projet Supabase vierge, région UE.

-- ---------------------------------------------------------------------------
-- 0. Extensions et schéma utilitaire
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";
create schema if not exists app;

-- ---------------------------------------------------------------------------
-- 1. Types
-- ---------------------------------------------------------------------------
create type public.role_adulte as enum ('prof', 'educateur', 'admin');
create type public.sens_observation as enum ('positif', 'a_ameliorer');
create type public.sens_possible as enum ('positif', 'a_ameliorer', 'les_deux');
create type public.statut_observation as enum ('en_attente', 'validee', 'corrigee', 'retiree');
create type public.niveau_competence as enum ('pas_encore', 'en_progres', 'acquis', 'exemplaire');
create type public.type_mesure as enum ('contrat', 'reparation', 'convocation', 'autre');
create type public.statut_mesure as enum ('en_cours', 'terminee', 'annulee');
create type public.frequence_notification as enum ('immediat', 'horaire', 'quotidien');
create type public.canal_notification as enum ('push', 'email');
create type public.type_notification as enum ('resume', 'fait_grave', 'auto_evaluation', 'mesure');

-- ---------------------------------------------------------------------------
-- 2. Référentiel « Nos compétences »
-- ---------------------------------------------------------------------------
create table public.domaines (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,          -- T, C, R, O
  libelle     text not null,
  ordre       int  not null
);

create table public.competences (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,          -- T1 … O4
  domaine_id  uuid not null references public.domaines(id) on delete restrict,
  libelle     text not null,                 -- « Je suis ponctuel(le) »
  ordre       int  not null,
  actif       boolean not null default true
);

create table public.comportements (
  id              uuid primary key default gen_random_uuid(),
  competence_id   uuid not null references public.competences(id) on delete restrict,
  libelle         text not null,             -- indicateur observable, au « je »
  sens_possible   public.sens_possible not null default 'les_deux',
  gravite_defaut  smallint not null default 1 check (gravite_defaut between 1 and 3),
  grave           boolean not null default false,  -- fait grave : envoi immédiat aux parents
  ordre           int not null,
  actif           boolean not null default true
);
create index on public.comportements (competence_id);

-- ---------------------------------------------------------------------------
-- 3. Personnes
-- ---------------------------------------------------------------------------
create table public.adultes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users(id) on delete set null,
  nom         text not null,
  prenom      text not null,
  email       text not null unique,
  roles       public.role_adulte[] not null default '{prof}',
  degre       text,                          -- « 1er degré » pour les éducateurs
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.classes (
  id             uuid primary key default gen_random_uuid(),
  nom            text not null,              -- « 1C »
  annee          text not null,              -- « 2026-2027 »
  educateur_id   uuid references public.adultes(id) on delete set null,
  titulaire_id   uuid references public.adultes(id) on delete set null,
  unique (nom, annee)
);

-- profs ↔ classes (un prof donne cours dans plusieurs classes)
create table public.adultes_classes (
  adulte_id  uuid not null references public.adultes(id) on delete cascade,
  classe_id  uuid not null references public.classes(id) on delete cascade,
  primary key (adulte_id, classe_id)
);

create table public.eleves (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique references auth.users(id) on delete set null,
  nom             text not null,
  prenom          text not null,
  date_naissance  date not null,
  classe_id       uuid references public.classes(id) on delete set null,
  code_connexion  text unique,               -- code personnel imprimable, 8 caractères
  actif           boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (nom, prenom, date_naissance)       -- clé de dédoublonnage à l'import
);
create index on public.eleves (classe_id);

create table public.parents (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid unique references auth.users(id) on delete set null,
  email                 text not null unique,
  nom                   text,
  frequence             public.frequence_notification not null default 'horaire',
  notif_positifs        boolean not null default true,
  notif_a_ameliorer     boolean not null default true,
  notif_auto_evaluation boolean not null default true,
  plage_debut           time not null default '08:00',
  plage_fin             time not null default '18:00',
  jours_ecole_seulement boolean not null default true,
  canaux                public.canal_notification[] not null default '{push}',
  invite_le             timestamptz,
  created_at            timestamptz not null default now()
);

create table public.parents_eleves (
  parent_id  uuid not null references public.parents(id) on delete cascade,
  eleve_id   uuid not null references public.eleves(id) on delete cascade,
  primary key (parent_id, eleve_id)
);

-- ---------------------------------------------------------------------------
-- 4. Observations (le cœur)
-- ---------------------------------------------------------------------------
create table public.observations (
  id                uuid primary key default gen_random_uuid(),
  eleve_id          uuid not null references public.eleves(id) on delete cascade,
  comportement_id   uuid not null references public.comportements(id) on delete restrict,
  sens              public.sens_observation not null,
  gravite           smallint not null default 1 check (gravite between 1 and 3),
  grave             boolean not null default false,
  auteur_id         uuid not null references public.adultes(id) on delete restrict,
  observe_le        timestamptz not null default now(),
  lieu              text,                    -- cours, couloir, cour, atelier…
  commentaire       text,
  statut            public.statut_observation not null default 'en_attente',
  valide_par        uuid references public.adultes(id) on delete set null,
  valide_le         timestamptz,
  lu_par_parent_le  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on public.observations (eleve_id, observe_le desc);
create index on public.observations (statut) where statut = 'en_attente';
create index on public.observations (auteur_id, observe_le desc);

-- ---------------------------------------------------------------------------
-- 5. Auto-évaluations, mesures, alertes
-- ---------------------------------------------------------------------------
create table public.auto_evaluations (
  id             uuid primary key default gen_random_uuid(),
  eleve_id       uuid not null references public.eleves(id) on delete cascade,
  competence_id  uuid not null references public.competences(id) on delete restrict,
  semaine        date not null,              -- lundi de la semaine
  niveau         public.niveau_competence not null,
  objectif       text,
  created_at     timestamptz not null default now(),
  unique (eleve_id, competence_id, semaine)
);

create table public.mesures (
  id          uuid primary key default gen_random_uuid(),
  eleve_id    uuid not null references public.eleves(id) on delete cascade,
  type        public.type_mesure not null,
  debut       date not null,
  fin         date,
  objectif    text not null,
  statut      public.statut_mesure not null default 'en_cours',
  notes       text,
  cree_par    uuid not null references public.adultes(id) on delete restrict,
  created_at  timestamptz not null default now()
);
create index on public.mesures (eleve_id, statut);

create table public.regles_alerte (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  libelle        text not null,
  competence_id  uuid references public.competences(id) on delete cascade,  -- null = toutes
  sens           public.sens_observation,    -- null = les deux
  seuil          int not null,
  fenetre_jours  int not null,
  actif          boolean not null default true
);

create table public.alertes (
  id             uuid primary key default gen_random_uuid(),
  eleve_id       uuid not null references public.eleves(id) on delete cascade,
  regle_id       uuid not null references public.regles_alerte(id) on delete cascade,
  declenchee_le  timestamptz not null default now(),
  traitee_le     timestamptz,
  traitee_par    uuid references public.adultes(id) on delete set null,
  unique (eleve_id, regle_id, declenchee_le)
);
create index on public.alertes (eleve_id) where traitee_le is null;

-- ---------------------------------------------------------------------------
-- 6. Notifications et journal d'accès (RGPD)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.parents(id) on delete cascade,
  eleve_id     uuid not null references public.eleves(id) on delete cascade,
  type         public.type_notification not null,
  contenu      jsonb not null,               -- ids d'observations, résumé, texte
  canal        public.canal_notification not null,
  envoyee_le   timestamptz,
  lue_le       timestamptz,
  created_at   timestamptz not null default now()
);
create index on public.notifications (parent_id, created_at desc);

create table public.journal_acces (
  id           bigserial primary key,
  adulte_id    uuid references public.adultes(id) on delete set null,
  eleve_id     uuid not null references public.eleves(id) on delete cascade,
  consulte_le  timestamptz not null default now()
);
create index on public.journal_acces (eleve_id, consulte_le desc);

-- ---------------------------------------------------------------------------
-- 7. Triggers
-- ---------------------------------------------------------------------------
-- Une observation hérite de la gravité et du caractère « grave » du comportement.
create or replace function app.observation_avant_insert()
returns trigger language plpgsql as $$
declare c record;
begin
  select gravite_defaut, grave into c from public.comportements where id = new.comportement_id;
  if new.sens = 'positif' then
    new.gravite := 1;
    new.grave := false;
  else
    if new.gravite is null or new.gravite = 1 then new.gravite := c.gravite_defaut; end if;
    new.grave := c.grave;
  end if;
  return new;
end $$;

create trigger trg_observation_avant_insert
before insert on public.observations
for each row execute function app.observation_avant_insert();

-- Horodatage de la validation et updated_at.
-- Un parent (utilisateur sans fiche adulte) ne peut changer que lu_par_parent_le.
create or replace function app.observation_avant_update()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and app.adulte_id() is null then
    if row(new.eleve_id, new.comportement_id, new.sens, new.gravite, new.grave, new.auteur_id,
           new.observe_le, new.lieu, new.commentaire, new.statut, new.valide_par, new.valide_le)
       is distinct from
       row(old.eleve_id, old.comportement_id, old.sens, old.gravite, old.grave, old.auteur_id,
           old.observe_le, old.lieu, old.commentaire, old.statut, old.valide_par, old.valide_le) then
      raise exception 'Un parent ne peut que marquer une observation comme lue';
    end if;
  end if;
  new.updated_at := now();
  if new.statut in ('validee', 'corrigee') and old.statut = 'en_attente' then
    new.valide_le := coalesce(new.valide_le, now());
    new.valide_par := coalesce(new.valide_par, app.adulte_id());
  end if;
  return new;
end $$;

create trigger trg_observation_avant_update
before update on public.observations
for each row execute function app.observation_avant_update();

-- ---------------------------------------------------------------------------
-- 8. Fonctions d'accès (utilisées par les règles RLS)
--    security definer : lisent adultes/parents sans déclencher leurs propres RLS.
-- ---------------------------------------------------------------------------
create or replace function app.adulte_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.adultes where user_id = auth.uid() and actif
$$;

create or replace function app.a_role(r public.role_adulte) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.adultes where user_id = auth.uid() and actif and r = any(roles))
$$;

create or replace function app.est_admin() returns boolean
language sql stable as $$ select app.a_role('admin') $$;

create or replace function app.est_educateur() returns boolean
language sql stable as $$ select app.a_role('educateur') or app.a_role('admin') $$;

create or replace function app.est_prof() returns boolean
language sql stable as $$ select app.a_role('prof') $$;

create or replace function app.prof_de_classe(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.adultes_classes ac
    join public.adultes a on a.id = ac.adulte_id
    where a.user_id = auth.uid() and ac.classe_id = c
  )
$$;

create or replace function app.prof_de_eleve(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.eleves el
    join public.adultes_classes ac on ac.classe_id = el.classe_id
    join public.adultes a on a.id = ac.adulte_id
    where a.user_id = auth.uid() and el.id = e
  )
$$;

create or replace function app.parent_de(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parents_eleves pe
    join public.parents p on p.id = pe.parent_id
    where p.user_id = auth.uid() and pe.eleve_id = e
  )
$$;

create or replace function app.parent_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.parents where user_id = auth.uid()
$$;

create or replace function app.est_eleve(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.eleves where id = e and user_id = auth.uid())
$$;

create or replace function app.eleve_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.eleves where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- 9. RLS
-- ---------------------------------------------------------------------------
alter table public.domaines          enable row level security;
alter table public.competences       enable row level security;
alter table public.comportements     enable row level security;
alter table public.adultes           enable row level security;
alter table public.classes           enable row level security;
alter table public.adultes_classes   enable row level security;
alter table public.eleves            enable row level security;
alter table public.parents           enable row level security;
alter table public.parents_eleves    enable row level security;
alter table public.observations      enable row level security;
alter table public.auto_evaluations  enable row level security;
alter table public.mesures           enable row level security;
alter table public.regles_alerte     enable row level security;
alter table public.alertes           enable row level security;
alter table public.notifications     enable row level security;
alter table public.journal_acces     enable row level security;

-- Référentiel : lisible par tout utilisateur connecté, modifiable par l'admin.
create policy ref_lecture on public.domaines      for select to authenticated using (true);
create policy ref_lecture on public.competences   for select to authenticated using (true);
create policy ref_lecture on public.comportements for select to authenticated using (true);
create policy ref_admin   on public.domaines      for all to authenticated using (app.est_admin()) with check (app.est_admin());
create policy ref_admin   on public.competences   for all to authenticated using (app.est_admin()) with check (app.est_admin());
create policy ref_admin   on public.comportements for all to authenticated using (app.est_admin()) with check (app.est_admin());

-- Adultes : chacun se voit ; éducateurs et admin voient tout ; admin modifie.
create policy adultes_soi        on public.adultes for select to authenticated using (user_id = auth.uid());
create policy adultes_educateurs on public.adultes for select to authenticated using (app.est_educateur());
create policy adultes_admin      on public.adultes for all    to authenticated using (app.est_admin()) with check (app.est_admin());

-- Classes : profs voient les leurs, éducateurs tout, admin modifie.
create policy classes_prof       on public.classes for select to authenticated using (app.prof_de_classe(id));
create policy classes_educateur  on public.classes for select to authenticated using (app.est_educateur());
create policy classes_admin      on public.classes for all    to authenticated using (app.est_admin()) with check (app.est_admin());

create policy ac_lecture on public.adultes_classes for select to authenticated
  using (app.est_educateur() or adulte_id = app.adulte_id());
create policy ac_admin   on public.adultes_classes for all to authenticated
  using (app.est_admin()) with check (app.est_admin());

-- Élèves : prof de la classe, éducateur, parent lié, l'élève lui-même.
create policy eleves_prof      on public.eleves for select to authenticated using (app.prof_de_classe(classe_id));
create policy eleves_educateur on public.eleves for select to authenticated using (app.est_educateur());
create policy eleves_parent    on public.eleves for select to authenticated using (app.parent_de(id));
create policy eleves_soi       on public.eleves for select to authenticated using (user_id = auth.uid());
create policy eleves_admin     on public.eleves for all    to authenticated using (app.est_admin()) with check (app.est_admin());

-- Parents : chacun voit et règle son propre compte ; éducateurs lisent ; admin modifie.
create policy parents_soi       on public.parents for select to authenticated using (user_id = auth.uid());
create policy parents_soi_maj   on public.parents for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy parents_educateur on public.parents for select to authenticated using (app.est_educateur());
create policy parents_admin     on public.parents for all    to authenticated using (app.est_admin()) with check (app.est_admin());

create policy pe_lecture on public.parents_eleves for select to authenticated
  using (app.est_educateur() or parent_id = app.parent_id());
create policy pe_admin   on public.parents_eleves for all to authenticated
  using (app.est_admin()) with check (app.est_admin());

-- Observations.
-- Prof : crée pour ses classes ; lit ce qu'il a écrit et ce qui concerne ses classes.
create policy obs_prof_insert on public.observations for insert to authenticated
  with check (app.est_prof() and auteur_id = app.adulte_id() and app.prof_de_eleve(eleve_id));
create policy obs_prof_select on public.observations for select to authenticated
  using (auteur_id = app.adulte_id() or app.prof_de_eleve(eleve_id));
-- Prof : peut corriger sa propre observation tant qu'elle est en attente.
create policy obs_prof_update on public.observations for update to authenticated
  using (auteur_id = app.adulte_id() and statut = 'en_attente')
  with check (auteur_id = app.adulte_id());
-- Éducateur : tout lire, tout modifier (validation, correction, retrait), créer.
create policy obs_educateur on public.observations for all to authenticated
  using (app.est_educateur()) with check (app.est_educateur());
-- Parent : seulement les observations validées, ou graves, de ses enfants.
create policy obs_parent on public.observations for select to authenticated
  using (app.parent_de(eleve_id) and (statut in ('validee', 'corrigee') or grave));
-- Parent : peut seulement marquer « lu ».
create policy obs_parent_lu on public.observations for update to authenticated
  using (app.parent_de(eleve_id) and (statut in ('validee', 'corrigee') or grave))
  with check (app.parent_de(eleve_id));
-- Élève : ses observations validées.
create policy obs_eleve on public.observations for select to authenticated
  using (app.est_eleve(eleve_id) and statut in ('validee', 'corrigee'));

-- Auto-évaluations : l'élève écrit les siennes ; adultes de sa classe, éducateurs et parents lisent.
create policy ae_eleve      on public.auto_evaluations for all    to authenticated
  using (app.est_eleve(eleve_id)) with check (app.est_eleve(eleve_id));
create policy ae_prof       on public.auto_evaluations for select to authenticated using (app.prof_de_eleve(eleve_id));
create policy ae_educateur  on public.auto_evaluations for select to authenticated using (app.est_educateur());
create policy ae_parent     on public.auto_evaluations for select to authenticated using (app.parent_de(eleve_id));

-- Mesures : éducateurs gèrent ; profs de la classe, parents et élève lisent.
create policy mes_educateur on public.mesures for all    to authenticated using (app.est_educateur()) with check (app.est_educateur());
create policy mes_prof      on public.mesures for select to authenticated using (app.prof_de_eleve(eleve_id));
create policy mes_parent    on public.mesures for select to authenticated using (app.parent_de(eleve_id));
create policy mes_eleve     on public.mesures for select to authenticated using (app.est_eleve(eleve_id));

-- Règles d'alerte et alertes : éducateurs.
create policy ra_lecture   on public.regles_alerte for select to authenticated using (app.est_educateur());
create policy ra_admin     on public.regles_alerte for all    to authenticated using (app.est_admin()) with check (app.est_admin());
create policy al_educateur on public.alertes       for all    to authenticated using (app.est_educateur()) with check (app.est_educateur());

-- Notifications : chaque parent voit les siennes ; écriture par le serveur (service role) uniquement.
create policy notif_parent on public.notifications for select to authenticated using (parent_id = app.parent_id());
create policy notif_parent_lue on public.notifications for update to authenticated
  using (parent_id = app.parent_id()) with check (parent_id = app.parent_id());

-- Journal d'accès : écriture par tout adulte, lecture admin.
create policy ja_insert on public.journal_acces for insert to authenticated with check (adulte_id = app.adulte_id());
create policy ja_admin  on public.journal_acces for select to authenticated using (app.est_admin());

-- ---------------------------------------------------------------------------
-- 10. Vues de calcul
-- ---------------------------------------------------------------------------
-- Niveau « adultes » par élève et compétence, sur 28 jours glissants.
-- Formule provisoire (à régler pendant le pilote) :
--   ratio = positifs / (positifs + à améliorer)
--   aucune observation        → null (le niveau précédent est conservé côté appli)
--   ratio < 0.34              → pas_encore
--   ratio < 0.67              → en_progres
--   ratio < 0.90              → acquis
--   sinon                     → exemplaire
create or replace view public.v_niveau_adultes as
select
  o.eleve_id,
  c.id as competence_id,
  c.code,
  count(*) filter (where o.sens = 'positif')      as positifs,
  count(*) filter (where o.sens = 'a_ameliorer')  as a_ameliorer,
  case
    when count(*) = 0 then null
    when count(*) filter (where o.sens = 'positif')::numeric / count(*) < 0.34 then 'pas_encore'::public.niveau_competence
    when count(*) filter (where o.sens = 'positif')::numeric / count(*) < 0.67 then 'en_progres'
    when count(*) filter (where o.sens = 'positif')::numeric / count(*) < 0.90 then 'acquis'
    else 'exemplaire'
  end as niveau
from public.observations o
join public.comportements cp on cp.id = o.comportement_id
join public.competences c on c.id = cp.competence_id
where o.statut in ('validee', 'corrigee')
  and o.observe_le >= now() - interval '28 days'
group by o.eleve_id, c.id, c.code;

-- Observations validées non encore notifiées, prêtes pour le résumé horaire.
create or replace view public.v_a_notifier as
select
  o.id as observation_id,
  o.eleve_id,
  pe.parent_id,
  o.sens,
  o.grave,
  o.valide_le,
  c.libelle as competence,
  cp.libelle as comportement,
  o.commentaire
from public.observations o
join public.comportements cp on cp.id = o.comportement_id
join public.competences c on c.id = cp.competence_id
join public.parents_eleves pe on pe.eleve_id = o.eleve_id
join public.parents p on p.id = pe.parent_id
where (o.statut in ('validee', 'corrigee') or o.grave)
  and o.statut <> 'retiree'
  and ((o.sens = 'positif' and p.notif_positifs) or (o.sens = 'a_ameliorer' and p.notif_a_ameliorer) or o.grave)
  and not exists (
    select 1 from public.notifications n
    where n.parent_id = pe.parent_id
      and n.contenu -> 'observations' ? o.id::text
  );
