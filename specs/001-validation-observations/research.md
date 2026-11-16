# Research: Validation des observations par l'éducateur

Source : lecture du dépôt au 2026-11-15 (commit `d95ea71`), pas de recherche externe.

## R1 — Comment représenter le refus

- **Decision** : ajouter la valeur `refusee` au type `statut_observation` et une colonne
  `motif_refus text` sur `observations`, avec une contrainte : motif non vide si refusée.
- **Rationale** : le type existant (`en_attente`, `validee`, `corrigee`, `retiree`) n'a pas
  de refus. Une valeur de plus et une colonne suffisent.
- **Alternatives considered** : réutiliser `retiree` (rejeté : son sens actuel n'est pas
  documenté dans le dépôt, mélanger les deux brouillerait la trace) ; table séparée des
  décisions (rejeté : une seule décision par observation, YAGNI).
- **Contrainte technique** : une valeur ajoutée à un type énuméré ne peut pas être utilisée
  dans la même transaction. D'où deux fichiers de migration (`0005` puis `0006`).

## R2 — Trace de la décision

- **Decision** : réutiliser `valide_par` et `valide_le` comme « décidé par / décidé le »,
  pour la validation comme pour le refus. Le trigger les remplit d'office avec l'adulte
  connecté et l'heure courante (plus de `coalesce`, pour qu'on ne puisse pas les falsifier).
- **Rationale** : colonnes déjà là, une seule décision possible.
- **Alternatives considered** : colonnes `refuse_par` / `refuse_le` (rejeté : doublon).

## R3 — Qui peut décider

- **Decision** : réutiliser la fonction existante `app.est_educateur()` (vraie pour les
  rôles `educateur` et `admin`). Le trigger de mise à jour refuse tout changement de statut
  si elle est fausse.
- **Rationale** : FR-008 (mis à jour le 2026-11-15) autorise l'éducateur et l'admin. C'est
  exactement ce que fait déjà cette fonction, utilisée par toutes les policies et par le
  layout `/educateur`. Aucune nouvelle fonction à créer.
- **Conséquence** : un compte prof + admin peut valider ses propres observations. Pas de
  contrôle « à quatre yeux » dans cette version.
- **Alternatives considered** : rôle éducateur strict (rejeté par Pasquale : il valide
  lui-même avec un compte admin).

## R4 — Transitions autorisées

- **Decision** : depuis `en_attente` → `validee` ou `refusee` (ou `corrigee`, déjà prévu).
  Une observation qui n'est plus en attente ne peut plus passer à `validee`, `refusee` ni
  `en_attente`. Les passages existants vers `corrigee` / `retiree` ne sont pas touchés.
- **Rationale** : FR-013 (pas de seconde décision) sans casser ce qui existe.

## R5 — Faille actuelle : un prof peut valider sa propre observation

- **Constat** : la policy `obs_prof_update` autorise l'auteur à modifier son observation en
  attente, sans contrôler la colonne `statut`. Rien n'empêche donc aujourd'hui un prof de
  passer sa propre observation à `validee` par un appel direct.
- **Decision** : le trigger de R3 ferme la faille ; en plus, `obs_prof_update` reçoit
  `with check (... and statut = 'en_attente')`.
- **Gravité actuelle** : faible en pratique (0 observation au 08/11, espace parent vide),
  mais à corriger avant d'ouvrir l'espace parent.

## R6 — Faits graves

- **Decision** : la file et le compteur filtrent `grave = false`. Le drapeau est recopié du
  comportement à l'insertion par le trigger existant, donc piloté par les données.
- **Constat** : la policy parent montre déjà les observations graves sans validation.
- **Point ouvert (hors périmètre)** : une observation grave reste `en_attente` en base
  pour toujours, donc elle ne compte ni dans `v_niveau_adultes` ni dans le rapport final.
  À traiter dans la fonctionnalité « faits graves / décision de la direction ».
- Si un comportement devient grave après coup, les observations déjà en attente gardent
  `grave = false` et restent dans la file (cas limite prévu par la spec).

## R7 — Calcul des niveaux (FR-015)

- **Constat** : déjà conforme. `v_niveau_adultes` et la page rapport ne lisent que
  `validee` / `corrigee`. Une observation refusée en est exclue d'office.
- **Decision** : aucun changement de calcul. Seule retouche : les compteurs « cette
  semaine » des pages `/prof` et `/educateur` excluent les refusées.

## R8 — Écrans

- **Decision** : `/educateur/validation` (file, filtres par paramètres d'URL `classe` et
  `eleve`, cases à cocher, « Valider la sélection », refus avec motif) et
  `/prof/observations` (« Mes observations »). Lien avec compteur depuis `/educateur`.
- **Rationale** : le prof n'a aujourd'hui aucune liste de ses observations ; la page
  `/prof` ne montre que des totaux par élève.
- **Alternatives considered** : tout mettre dans `/educateur` (rejeté : page déjà chargée).

## R9 — Deux éducateurs en même temps

- **Decision** : la mise à jour porte la condition `statut = 'en_attente'` et renvoie les
  identifiants réellement modifiés. Si le nombre est inférieur au nombre demandé, message :
  « n observation(s) avaient déjà été traitées ».

## R10 — Tests

- **Decision** : un script SQL `supabase/tests/001_validation_observations.sql`, dans une
  transaction annulée à la fin, qui se fait passer tour à tour pour chaque rôle
  (`set local role authenticated` + `request.jwt.claims`) et vérifie accès autorisés et
  refusés. À lancer sur une base locale (`supabase start` puis `supabase db reset`).
- **Non vérifié** : la présence de la CLI Supabase sur le Mac de Pasquale, et l'absence de
  `supabase/config.toml` dans le dépôt (il faudra `supabase init`). À contrôler en
  première tâche.
- **Alternatives considered** : branche Supabase (rejeté : payant, non confirmé) ;
  pgTAP (rejeté : une dépendance de plus pour une dizaine d'assertions) ; tester en
  production (exclu : vraies données).

## R11 — Classe affichée

- **Decision** : classe actuelle de l'élève (`eleves.classe_id`), comme le reste de l'app.

## R12 — Conservation

- **Decision** : aucune purge dans cette version. Durée à fixer avec la direction (FR-016).

## R13 — Mise en production

- **Decision** : les migrations sont appliquées à la main par Pasquale après les tests
  locaux, en vérifiant d'abord le nombre d'observations en base. Jamais par l'outil.
- Les observations existantes sont déjà `en_attente` par défaut : FR-012 ne demande aucune
  reprise de données.
