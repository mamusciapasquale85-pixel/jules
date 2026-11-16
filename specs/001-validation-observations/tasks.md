---

description: "Liste des tâches — Validation des observations par l'éducateur"
---

# Tasks: Validation des observations par l'éducateur

**Input**: Design documents from `/specs/001-validation-observations/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/actions-et-ecrans.md, quickstart.md

**Tests**: inclus pour la base uniquement. La constitution (principe I et Workflow) impose un test RLS par rôle pour toute policy modifiée. Pas de tests automatisés d'interface (aucun framework dans le dépôt) : vérification manuelle par le parcours de quickstart.md.

**Organization**: tâches groupées par user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]** : peut se faire en parallèle (fichiers différents, pas de dépendance)
- **[Story]** : user story concernée (US1 à US5)

## Path Conventions

- Application Next.js : `app/` (pages dans `app/app/(app)/…`)
- Base : `supabase/migrations/`, tests : `supabase/tests/`

## Règle de sécurité valable pour toutes les tâches

Aucune commande ne doit viser la base de production (`jbrwyjxhkytgyrtiftoq`). Tout se fait
sur une base locale. L'application des migrations en production est une tâche manuelle de
Pasquale (T027), jamais exécutée par l'outil.

> **État au 2026-11-15** : Phases 1 à 3 terminées (T001–T014). Les migrations passent sur
> la base locale et les 10 tests RLS affichent « OK » (lancés par Pasquale via
> `docker exec -i supabase_db_jules-db psql …`). Le doublon `0003` a été corrigé :
> `0003_demandes_compte` est devenu `0004_demandes_compte`, d'où les numéros 0005 et 0006.
> Reste à vérifier à la main : la page `/educateur/validation` dans le navigateur.

---

## Phase 1: Setup

**Purpose**: disposer d'une base locale pour tester sans toucher aux vraies données

- [X] T001 Vérifier que Docker tourne et que la CLI Supabase est installée (`supabase --version`) ; si elle manque, s'arrêter et le signaler à Pasquale
- [X] T002 Créer `supabase/config.toml` avec `supabase init` s'il n'existe pas, puis `supabase start` et `supabase db reset` ; vérifier que les migrations 0001 à 0003 passent sur la base locale
- [X] T003 [P] Créer `app/lib/statuts.ts` : libellés français des statuts (`en_attente` → « En attente », `validee` → « Validée », `refusee` → « Refusée », `corrigee` → « Validée (corrigée) », `retiree` → « Retirée ») et du sens (`positif` → « Positif », `a_ameliorer` → « À améliorer »)

---

## Phase 2: Foundational (bloque toutes les user stories)

**Purpose**: le statut « refusée », le motif et le verrou en base

- [X] T004 Créer `supabase/migrations/0005_statut_refusee.sql` : `alter type public.statut_observation add value if not exists 'refusee'` — seule instruction du fichier (une valeur ajoutée à un type ne peut pas servir dans la même transaction)
- [X] T005 Créer `supabase/migrations/0006_validation_observations.sql` : colonne `motif_refus text` sur `public.observations` ; contrainte « obligatoire et non vide si `statut = 'refusee'`, 500 caractères max »
- [X] T006 Dans `supabase/migrations/0006_validation_observations.sql`, remplacer `app.observation_avant_update()` : si `statut` change et qu'un utilisateur est connecté, exiger `app.est_educateur()` ; n'autoriser que `en_attente` → `validee` / `refusee` / `corrigee` ; interdire tout retour vers `validee`, `refusee` ou `en_attente` depuis un autre statut ; remplir d'office `valide_par` (adulte connecté) et `valide_le` (maintenant) ; conserver la règle existante « un parent ne peut que marquer lu » ; messages d'erreur en français
- [X] T007 Dans `supabase/migrations/0006_validation_observations.sql`, recréer la policy `obs_prof_update` avec `with check (auteur_id = app.adulte_id() and statut = 'en_attente')`
- [X] T008 Créer `supabase/tests/001_validation_observations.sql` : transaction annulée à la fin, jeu de données minimal (1 classe, 1 élève, 1 prof seul, 1 éducateur, 1 admin seul, 1 parent, 1 compte élève), fonction d'aide pour se faire passer pour un utilisateur (`set local role authenticated` + `request.jwt.claims`), affichage `OK` / `ECHEC` par assertion
- [X] T009 Lancer `supabase db reset` puis le script de T008 sur la base locale ; les migrations 0005 et 0006 doivent passer

**Checkpoint**: la base locale accepte le refus avec motif et refuse toute décision par un prof seul.

---

## Phase 3: User Story 1 — Valider les observations en attente (P1) 🎯 MVP

**Goal**: l'éducateur ou l'admin voit la file et valide une ou plusieurs observations.

**Independent Test**: trois observations encodées par un prof ; validation d'une seule puis des deux autres ensemble ; file vide ; statut « Validée » avec auteur et date de décision.

- [X] T010 [P] [US1] Ajouter dans `supabase/tests/001_validation_observations.sql` : un prof seul ne peut pas passer une observation à `validee` ; un éducateur le peut ; un admin seul le peut ; `valide_par` et `valide_le` sont remplis ; un parent ne voit pas l'observation en attente et voit la validée ; un élève ne voit que la validée
- [X] T011 [US1] Créer `app/app/(app)/educateur/validation/actions.ts` : action `validerObservations(ids)` selon contracts/actions-et-ecrans.md — mise à jour conditionnée à `statut = 'en_attente'`, retour `{ validees, dejaTraitees, erreur? }`, erreur « Aucune observation sélectionnée. » si liste vide, revalidation de `/educateur` et `/educateur/validation`
- [X] T012 [US1] Créer `app/app/(app)/educateur/validation/page.tsx` : composant serveur qui lit les observations `en_attente` et `grave = false`, triées par `observe_le` croissant, avec élève, classe actuelle, prof, comportement, sens, commentaire, date ; message « Aucune observation en attente. » si vide
- [X] T013 [US1] Créer `app/app/(app)/educateur/validation/liste.tsx` : composant client avec case à cocher par ligne, « Tout cocher », bouton « Valider la sélection », bouton « Valider » par ligne ; affiche le retour de l'action, dont « n observation(s) avaient déjà été traitées »
- [X] T014 [US1] Ajouter les styles de la file dans `app/app/globals.css` en réutilisant les classes et la palette existantes

**Checkpoint**: US1 utilisable seule.

---

## Phase 4: User Story 5 — Les faits graves contournent la file (P1)

**Goal**: une observation sur un comportement grave n'apparaît jamais dans la file.

**Independent Test**: une observation encodée sur un comportement grave est absente de la file et du compteur.

- [ ] T015 [P] [US5] Ajouter dans `supabase/tests/001_validation_observations.sql` : une observation sur un comportement `grave = true` reçoit `grave = true` à l'insertion et n'est pas renvoyée par la requête de la file ; après passage du comportement à `grave = false`, une nouvelle observation entre dans la file
- [ ] T016 [US5] Vérifier dans `app/app/(app)/educateur/validation/page.tsx` que le filtre `grave = false` s'applique à la liste ET au compteur, et qu'aucune liste de comportements graves n'est écrite dans le code

---

## Phase 5: User Story 2 — Refuser avec un motif (P2)

**Goal**: l'éducateur ou l'admin refuse une observation en écrivant un motif.

**Independent Test**: refus sans motif bloqué ; refus avec motif accepté ; statut « Refusée », motif, auteur et date enregistrés.

- [ ] T017 [P] [US2] Ajouter dans `supabase/tests/001_validation_observations.sql` : refus sans motif rejeté ; refus avec motif accepté ; une observation validée ne peut plus être refusée ; une refusée ne peut plus être validée ; un parent et un élève ne voient pas la refusée
- [ ] T018 [US2] Ajouter dans `app/app/(app)/educateur/validation/actions.ts` l'action `refuserObservation(id, motif)` : motif obligatoire après suppression des espaces, 500 caractères max, retour `{ ok, erreur? }`, message « Cette observation a déjà été traitée. » si elle n'est plus en attente
- [ ] T019 [US2] Ajouter dans `app/app/(app)/educateur/validation/liste.tsx` le bouton « Refuser » par ligne, qui ouvre un champ « Motif du refus » (obligatoire) et affiche l'erreur de l'action

---

## Phase 6: User Story 3 — Le prof suit le statut de ses observations (P2)

**Goal**: le prof voit le statut de chacune de ses observations et le motif en cas de refus.

**Independent Test**: deux observations d'un prof, l'une validée, l'autre refusée ; il voit « Validée » et « Refusée » avec le motif.

- [ ] T020 [P] [US3] Créer `app/app/(app)/prof/observations/page.tsx` : observations dont l'adulte connecté est l'auteur (`auteur_id`), de la plus récente à la plus ancienne, avec élève, comportement, sens, date, statut (libellés de `app/lib/statuts.ts`) et motif si refusée
- [ ] T021 [US3] Ajouter l'onglet « Mes observations » dans `app/components/onglets-prof.tsx`
- [ ] T022 [P] [US3] Exclure les observations `refusee` des compteurs de la semaine dans `app/app/(app)/prof/page.tsx`

---

## Phase 7: User Story 4 — Filtres et compteur (P3)

**Goal**: filtrer la file par classe et par élève ; voir le nombre en attente.

**Independent Test**: le filtre sur une classe ne montre que ses observations ; le compteur passe de 12 à 9 après 3 validations.

- [ ] T023 [US4] Ajouter dans `app/app/(app)/educateur/validation/page.tsx` les filtres par paramètres d'URL `classe` et `eleve` (listes déroulantes, formulaire `get`) et l'affichage du nombre total en attente
- [ ] T024 [US4] Dans `app/app/(app)/educateur/page.tsx`, ajouter le lien « Validation » avec le nombre en attente (hors graves) et exclure les `refusee` des compteurs de la semaine

---

## Phase 8: Polish

- [ ] T025 Lancer `npm run build` et `npm run lint` dans `app/` et corriger les erreurs
- [ ] T026 Dérouler le parcours complet de `specs/001-validation-observations/quickstart.md` sur la base locale et noter le résultat de chaque étape dans ce fichier (preuve de fonctionnement exigée par la constitution)
- [ ] T027 MANUEL — Pasquale : après accord, vérifier le nombre d'observations en production, puis appliquer `0005` et `0006` (`0004_demandes_compte` est déjà en production sous son ancien numéro) à la main. Ne pas exécuter par l'outil
- [ ] T028 MANUEL — Pasquale : faire fixer la durée de conservation par la direction (FR-016) avant la mise en service, puis mettre à jour spec.md

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → les user stories.
- US1 (P1) : dépend seulement de la Phase 2. C'est le MVP.
- US5 (P1) : dépend de US1 (même page).
- US2 (P2) : dépend de US1 (mêmes fichiers `actions.ts` et `liste.tsx`).
- US3 (P2) : indépendante de US1 ; dépend seulement de la Phase 2 et de T003.
- US4 (P3) : dépend de US1.
- T027 et T028 ne bloquent pas le développement ; T028 bloque la mise en service.

### Parallel Opportunities

- T003 en parallèle de T001–T002.
- T010, T015 et T017 touchent le même fichier de test : parallèles avec le code d'interface, pas entre eux.
- US3 (T020–T022) peut avancer en parallèle de US1/US2/US5.

## Implementation Strategy

1. **MVP** : Phases 1, 2 et 3 (T001–T014). On s'arrête, on vérifie US1 sur la base locale.
2. Ajouter US5 (vérification), puis US2, US3, US4, chacune testée seule.
3. Polish, puis les deux tâches manuelles.

On committe à la fin de chaque phase, sur la branche `test/spec-kit`.
