-- Jules — migration 0006 : validation des observations par l'éducateur
-- Spec : specs/001-validation-observations/
--   - motif de refus (obligatoire si l'observation est refusée) ;
--   - seul un éducateur ou un admin change le statut, et une seule fois ;
--   - un prof ne peut plus valider lui-même sa propre observation.

-- 1. Motif de refus --------------------------------------------------------
alter table public.observations add column motif_refus text;

alter table public.observations add constraint observations_motif_refus_chk check (
  (statut <> 'refusee' or (motif_refus is not null and length(btrim(motif_refus)) > 0))
  and (motif_refus is null or length(motif_refus) <= 500)
);

comment on column public.observations.motif_refus is 'Motif écrit par l''éducateur quand il refuse l''observation (500 caractères max).';
comment on column public.observations.valide_par is 'Adulte qui a décidé (validation ou refus).';
comment on column public.observations.valide_le  is 'Date de la décision (validation ou refus).';

-- 2. Verrou sur le statut --------------------------------------------------
create or replace function app.observation_avant_update()
returns trigger language plpgsql set search_path = public, app as $$
begin
  -- Un parent (utilisateur sans fiche adulte) ne peut changer que lu_par_parent_le.
  if auth.uid() is not null and app.adulte_id() is null then
    if row(new.eleve_id, new.comportement_id, new.sens, new.gravite, new.grave, new.auteur_id,
           new.observe_le, new.lieu, new.commentaire, new.statut, new.valide_par, new.valide_le,
           new.motif_refus)
       is distinct from
       row(old.eleve_id, old.comportement_id, old.sens, old.gravite, old.grave, old.auteur_id,
           old.observe_le, old.lieu, old.commentaire, old.statut, old.valide_par, old.valide_le,
           old.motif_refus) then
      raise exception 'Un parent ne peut que marquer une observation comme lue';
    end if;
  end if;

  new.updated_at := now();

  if new.statut is distinct from old.statut then
    -- Qui décide : éducateur ou admin. Les appels serveur sans utilisateur connecté
    -- (tâches planifiées) ne sont pas concernés.
    if auth.uid() is not null and not app.est_educateur() then
      raise exception 'Seuls les éducateurs et les admins peuvent valider ou refuser une observation';
    end if;

    -- Une seule décision : plus de retour vers validée, refusée ou en attente.
    if old.statut <> 'en_attente' and new.statut in ('validee', 'refusee', 'en_attente') then
      raise exception 'Cette observation a déjà été traitée';
    end if;

    -- Trace de la décision, remplie d'office.
    if old.statut = 'en_attente' and new.statut in ('validee', 'corrigee', 'refusee') then
      if auth.uid() is not null then
        new.valide_par := app.adulte_id();
        new.valide_le  := now();
      else
        new.valide_le  := coalesce(new.valide_le, now());
      end if;
    end if;
  elsif auth.uid() is not null and not app.est_educateur() then
    -- Sans changement de statut, un prof ne touche ni à la trace ni au motif.
    new.valide_par  := old.valide_par;
    new.valide_le   := old.valide_le;
    new.motif_refus := old.motif_refus;
  end if;

  return new;
end $$;

-- 3. Le prof corrige son observation en attente, sans en changer le statut ---
drop policy if exists obs_prof_update on public.observations;
create policy obs_prof_update on public.observations for update to authenticated
  using (auteur_id = app.adulte_id() and statut = 'en_attente')
  with check (auteur_id = app.adulte_id() and statut = 'en_attente');
