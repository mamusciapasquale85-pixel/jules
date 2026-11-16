-- Jules — tests RLS de la validation des observations (spec 001)
-- À LANCER UNIQUEMENT SUR UNE BASE LOCALE (supabase start + supabase db reset).
-- JAMAIS sur la production. Tout est annulé à la fin (rollback).
--
-- Lecture du résultat : chaque test affiche une ligne « OK … » ou « ECHEC … ».
--   psql "<url de la base locale>" -f supabase/tests/001_validation_observations.sql 2>&1 | grep -E "OK|ECHEC"

\set ON_ERROR_STOP on
begin;

-- ---------------------------------------------------------------------------
-- Jeu de données minimal (créé en tant que postgres, hors RLS)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-4000-a000-000000000001', 'prof@test.local'),
  ('00000000-0000-4000-a000-000000000002', 'educ@test.local'),
  ('00000000-0000-4000-a000-000000000003', 'admin@test.local'),
  ('00000000-0000-4000-a000-000000000004', 'parent@test.local'),
  ('00000000-0000-4000-a000-000000000005', 'eleve@test.local');

insert into public.adultes (id, user_id, nom, prenom, email, roles) values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001', 'Test', 'Prof',  'prof@test.local',  '{prof}'),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000002', 'Test', 'Educ',  'educ@test.local',  '{educateur}'),
  ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000003', 'Test', 'Admin', 'admin@test.local', '{admin}');

insert into public.classes (id, nom, annee) values
  ('00000000-0000-4000-c000-000000000001', 'TEST-1', '2026-2027');
insert into public.adultes_classes (adulte_id, classe_id) values
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-c000-000000000001');

insert into public.eleves (id, user_id, nom, prenom, date_naissance, classe_id) values
  ('00000000-0000-4000-d000-000000000001', '00000000-0000-4000-a000-000000000005', 'Eleve', 'Test', '2013-01-01',
   '00000000-0000-4000-c000-000000000001');

insert into public.parents (id, user_id, email) values
  ('00000000-0000-4000-e000-000000000001', '00000000-0000-4000-a000-000000000004', 'parent@test.local');
insert into public.parents_eleves (parent_id, eleve_id) values
  ('00000000-0000-4000-e000-000000000001', '00000000-0000-4000-d000-000000000001');

-- Trois observations positives (donc non graves) du prof, toutes en attente.
insert into public.observations (id, eleve_id, comportement_id, sens, auteur_id)
select o.id::uuid, '00000000-0000-4000-d000-000000000001', c.id, 'positif', '00000000-0000-4000-b000-000000000001'
from (values ('00000000-0000-4000-f000-00000000000a'),
             ('00000000-0000-4000-f000-00000000000b'),
             ('00000000-0000-4000-f000-00000000000c')) as o(id),
     (select id from public.comportements where sens_possible in ('positif', 'les_deux') limit 1) as c;

-- Pour se faire passer pour un utilisateur :
--   set local role authenticated;
--   select set_config('request.jwt.claims', '{"sub":"<user_id>","role":"authenticated"}', true);
-- Pour redevenir postgres : reset role;

-- ---------------------------------------------------------------------------
-- US1 — Valider
-- ---------------------------------------------------------------------------

-- Prof seul ------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000001","role":"authenticated"}', true);

do $$ begin
  update public.observations set statut = 'validee' where id = '00000000-0000-4000-f000-00000000000a';
  raise notice 'ECHEC  T1 un prof seul a pu valider son observation';
exception when others then
  raise notice 'OK     T1 un prof seul ne peut pas valider (%)', sqlerrm;
end $$;

do $$ declare n int; begin
  update public.observations set commentaire = 'corrigé par le prof' where id = '00000000-0000-4000-f000-00000000000a';
  get diagnostics n = row_count;
  raise notice '%  T2 un prof peut encore corriger son observation en attente', case when n = 1 then 'OK    ' else 'ECHEC ' end;
end $$;

-- Éducateur ------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000002","role":"authenticated"}', true);

do $$ declare n int; r record; begin
  update public.observations set statut = 'validee' where id = '00000000-0000-4000-f000-00000000000a';
  get diagnostics n = row_count;
  select statut, valide_par, valide_le into r from public.observations where id = '00000000-0000-4000-f000-00000000000a';
  raise notice '%  T3 un éducateur valide', case when n = 1 and r.statut = 'validee' then 'OK    ' else 'ECHEC ' end;
  raise notice '%  T4 la trace est remplie (qui, quand)',
    case when r.valide_par = '00000000-0000-4000-b000-000000000002' and r.valide_le is not null then 'OK    ' else 'ECHEC ' end;
end $$;

do $$ begin
  update public.observations set statut = 'en_attente' where id = '00000000-0000-4000-f000-00000000000a';
  raise notice 'ECHEC  T5 une observation validée a pu repasser en attente';
exception when others then
  raise notice 'OK     T5 une observation validée ne peut plus être décidée (%)', sqlerrm;
end $$;

-- Admin sans rôle éducateur ---------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000003","role":"authenticated"}', true);

do $$ declare n int; r record; begin
  update public.observations set statut = 'validee' where id = '00000000-0000-4000-f000-00000000000b';
  get diagnostics n = row_count;
  select statut, valide_par into r from public.observations where id = '00000000-0000-4000-f000-00000000000b';
  raise notice '%  T6 un admin sans rôle éducateur valide',
    case when n = 1 and r.statut = 'validee' and r.valide_par = '00000000-0000-4000-b000-000000000003' then 'OK    ' else 'ECHEC ' end;
end $$;

-- Parent ---------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000004","role":"authenticated"}', true);

do $$ declare vues int; attente int; begin
  select count(*) into vues    from public.observations where id in ('00000000-0000-4000-f000-00000000000a', '00000000-0000-4000-f000-00000000000b');
  select count(*) into attente from public.observations where id = '00000000-0000-4000-f000-00000000000c';
  raise notice '%  T7 un parent voit les observations validées de son enfant', case when vues = 2 then 'OK    ' else 'ECHEC ' end;
  raise notice '%  T8 un parent ne voit pas l''observation en attente', case when attente = 0 then 'OK    ' else 'ECHEC ' end;
end $$;

-- Élève ----------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-000000000005","role":"authenticated"}', true);

do $$ declare vues int; attente int; begin
  select count(*) into vues    from public.observations where id in ('00000000-0000-4000-f000-00000000000a', '00000000-0000-4000-f000-00000000000b');
  select count(*) into attente from public.observations where id = '00000000-0000-4000-f000-00000000000c';
  raise notice '%  T9 un élève voit ses observations validées', case when vues = 2 then 'OK    ' else 'ECHEC ' end;
  raise notice '%  T10 un élève ne voit pas l''observation en attente', case when attente = 0 then 'OK    ' else 'ECHEC ' end;
end $$;

reset role;
rollback;
