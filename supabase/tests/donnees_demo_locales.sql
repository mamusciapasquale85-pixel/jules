-- Jules — données de démonstration pour la BASE LOCALE uniquement.
-- Sert à regarder la page /educateur/validation dans le navigateur.
-- Prérequis : avoir créé le compte demo@jules.local dans Studio local
--   (http://127.0.0.1:54323 → Authentication → Add user → Create new user, « Auto Confirm User » coché).
-- Lancer :
--   docker exec -i supabase_db_jules-db psql -U postgres -d postgres < supabase/tests/donnees_demo_locales.sql

\set ON_ERROR_STOP on
begin;

-- Garde-fou : refuse de tourner sur une base qui ressemble à la production.
do $$ begin
  if (select count(*) from public.eleves) > 20 then
    raise exception 'Cette base contient déjà des élèves : ce script est réservé à la base locale vide.';
  end if;
  if not exists (select 1 from auth.users where email = 'demo@jules.local') then
    raise exception 'Compte demo@jules.local introuvable : crée-le d''abord dans Studio local (Authentication → Add user).';
  end if;
end $$;

insert into public.adultes (id, user_id, nom, prenom, email, roles)
select '00000000-0000-4000-b000-0000000000d1', u.id, 'Démo', 'Camille', 'demo@jules.local', '{prof,educateur}'
from auth.users u where u.email = 'demo@jules.local'
on conflict do nothing;

insert into public.adultes (id, nom, prenom, email, roles) values
  ('00000000-0000-4000-b000-0000000000d2', 'Lambert', 'Sophie', 'prof.demo@jules.local', '{prof}')
on conflict do nothing;

insert into public.classes (id, nom, annee) values
  ('00000000-0000-4000-c000-0000000000d1', 'S1-1', '2026-2027'),
  ('00000000-0000-4000-c000-0000000000d2', '2C1',  '2026-2027')
on conflict do nothing;

insert into public.adultes_classes (adulte_id, classe_id) values
  ('00000000-0000-4000-b000-0000000000d1', '00000000-0000-4000-c000-0000000000d1'),
  ('00000000-0000-4000-b000-0000000000d2', '00000000-0000-4000-c000-0000000000d2')
on conflict do nothing;

insert into public.eleves (id, nom, prenom, date_naissance, classe_id) values
  ('00000000-0000-4000-d000-0000000000d1', 'Exemple', 'Amine', '2013-03-12', '00000000-0000-4000-c000-0000000000d1'),
  ('00000000-0000-4000-d000-0000000000d2', 'Exemple', 'Lina',  '2013-07-02', '00000000-0000-4000-c000-0000000000d1'),
  ('00000000-0000-4000-d000-0000000000d3', 'Modèle',  'Noah',  '2012-11-23', '00000000-0000-4000-c000-0000000000d2')
on conflict do nothing;

-- Cinq observations ordinaires en attente (elles doivent apparaître dans la file)…
insert into public.observations (eleve_id, comportement_id, sens, auteur_id, observe_le, commentaire)
select v.eleve::uuid, c.id, v.sens::public.sens_observation, v.auteur::uuid, now() - v.il_y_a::interval, v.commentaire
from (values
  ('00000000-0000-4000-d000-0000000000d1', 'positif',     '00000000-0000-4000-b000-0000000000d1', '3 days',  'A aidé un camarade à ranger le local.', 1),
  ('00000000-0000-4000-d000-0000000000d2', 'a_ameliorer', '00000000-0000-4000-b000-0000000000d1', '2 days',  'Arrivée en retard après la récréation.', 2),
  ('00000000-0000-4000-d000-0000000000d3', 'positif',     '00000000-0000-4000-b000-0000000000d2', '1 day',   null, 3),
  ('00000000-0000-4000-d000-0000000000d1', 'a_ameliorer', '00000000-0000-4000-b000-0000000000d2', '5 hours', 'Matériel oublié pour la troisième fois.', 4),
  ('00000000-0000-4000-d000-0000000000d3', 'positif',     '00000000-0000-4000-b000-0000000000d2', '1 hour',  'Très bonne participation.', 5)
) as v(eleve, sens, auteur, il_y_a, commentaire, rang)
join lateral (
  select id from public.comportements
  where not grave and sens_possible in (v.sens::public.sens_possible, 'les_deux')
  order by ordre, id offset v.rang limit 1
) c on true;

-- … et une observation sur un comportement grave (elle NE doit PAS apparaître dans la file).
insert into public.observations (eleve_id, comportement_id, sens, auteur_id, commentaire)
select '00000000-0000-4000-d000-0000000000d2', id, 'a_ameliorer', '00000000-0000-4000-b000-0000000000d2', 'Fait grave de démonstration.'
from public.comportements where grave order by ordre limit 1;

select count(*) filter (where not grave) as en_attente_dans_la_file,
       count(*) filter (where grave)     as graves_hors_file
from public.observations where statut = 'en_attente';

commit;
