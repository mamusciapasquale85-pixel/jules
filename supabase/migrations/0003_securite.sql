-- Jules — migration 0003 : correctifs de sécurité signalés par le linter Supabase
-- Appliquée le 2026-11-04 sur le projet jbrwyjxhkytgyrtiftoq.

-- Les vues appliquent le RLS de l'utilisateur qui interroge, pas celui du créateur.
alter view public.v_niveau_adultes set (security_invoker = on);
alter view public.v_a_notifier set (security_invoker = on);

-- Chemin de recherche fixé sur les fonctions restantes.
alter function app.est_admin() set search_path = public, app;
alter function app.est_educateur() set search_path = public, app;
alter function app.est_prof() set search_path = public, app;
alter function app.observation_avant_insert() set search_path = public, app;
alter function app.observation_avant_update() set search_path = public, app;

-- Droits sur le schéma app pour les utilisateurs connectés (inclus dans la migration 1 côté Supabase).
grant usage on schema app to authenticated;
grant execute on all functions in schema app to authenticated;
