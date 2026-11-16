# Implementation Plan: Validation des observations par l'éducateur

**Branch**: `test/spec-kit` (dossier de spec : `001-validation-observations`) | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-validation-observations/spec.md`

## Summary

L'éducateur valide ou refuse (avec motif) les observations en attente depuis une nouvelle
page « Validation » ; le prof suit le statut de ses observations dans une nouvelle page
« Mes observations ».

Constat à la lecture du dépôt : une bonne partie existe déjà en base (`0001_schema.sql`).
Le statut `en_attente` par défaut, `valide_par` / `valide_le`, la règle « un parent ne voit
que le validé ou le grave », et le calcul des niveaux sur le seul validé sont en place.
Ce plan ajoute donc uniquement ce qui manque :

1. le statut « refusée » et son motif ;
2. un verrou en base : seul un éducateur ou un admin change le statut, et une seule fois
   (aujourd'hui un prof peut valider lui-même sa propre observation — voir research.md R5) ;
3. les deux écrans et leurs actions.

## Technical Context

**Language/Version**: TypeScript 5, React 19, SQL (Postgres, Supabase)

**Primary Dependencies**: Next.js 15 (App Router, Server Actions), @supabase/ssr 0.6, @supabase/supabase-js 2.49. Aucune dépendance ajoutée.

**Storage**: Supabase Postgres (région UE), RLS activée ; migrations dans `supabase/migrations/`

**Testing**: aucun framework de test dans le dépôt. Script SQL de test RLS par rôle (`supabase/tests/`), exécuté sur une base locale, jamais sur la production. `npm run build` et `npm run lint` pour l'application. Voir research.md R10.

**Target Platform**: Web (Vercel), usage mobile et ordinateur

**Project Type**: application web (Next.js dans `app/`, base dans `supabase/`)

**Performance Goals**: file affichée en moins de 2 s ; validation en lot de 20 observations en une action

**Constraints**: la base de production contient de vraies données (279 élèves) — aucune migration ni test en production sans accord ; interface en français ; pas de clé `service_role` côté navigateur

**Scale/Scope**: 1 école, 15 classes, 279 élèves, une poignée d'éducateurs ; 2 pages nouvelles, 2 pages retouchées, 2 migrations, 1 script de test

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Vérification | État |
|----------|--------------|------|
| I. Sécurité par RLS | Aucune nouvelle table. Le verrou « qui décide » est en base (trigger + policy), pas seulement dans l'interface. Test SQL par rôle prévu (prof seul, éducateur, admin seul, parent, élève). | ✅ |
| II. Données de mineurs | Finalité documentée dans la spec. Donnée ajoutée : motif de refus (texte libre). **Durée de conservation non fixée** (point ouvert avec la direction, FR-016). | ⚠ à lever avant la mise en service |
| III. Rôles minimaux | Décision réservée aux rôles éducateur et admin (FR-008), via la fonction existante `app.est_educateur()`. Un prof seul ne peut pas décider. | ✅ |
| IV. Paramétrage par les données | Le caractère grave vient de `comportements.grave`, recopié à l'insertion par le trigger existant. Rien codé en dur. | ✅ |
| V. Simplicité et migrations versionnées | Deux fichiers numérotés (`0005`, `0006`). Réutilisation des colonnes existantes. Aucun service ni dépendance ajouté. | ✅ |

Re-vérification après conception (Phase 1) : inchangée. Le seul écart est la durée de
conservation, justifié ci-dessous.

## Project Structure

### Documentation (this feature)

```text
specs/001-validation-observations/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── actions-et-ecrans.md
├── checklists/requirements.md
└── tasks.md             # créé par /speckit-tasks
```

### Source Code (repository root)

```text
supabase/
├── migrations/
│   ├── 0005_statut_refusee.sql            # NOUVEAU : ajoute la valeur 'refusee' (seule dans son fichier)
│   └── 0006_validation_observations.sql   # NOUVEAU : motif_refus, contrainte, verrou, policy prof
└── tests/
    └── 001_validation_observations.sql    # NOUVEAU : tests RLS par rôle (transaction annulée)

app/
├── app/(app)/educateur/
│   ├── page.tsx                           # MODIFIÉ : lien « Validation » + compteur ; refusées exclues des compteurs
│   └── validation/
│       ├── page.tsx                       # NOUVEAU : file en attente, filtres classe / élève
│       ├── liste.tsx                      # NOUVEAU : cases à cocher, valider la sélection, refuser
│       └── actions.ts                     # NOUVEAU : validerObservations, refuserObservation
├── app/(app)/prof/
│   ├── page.tsx                           # MODIFIÉ : refusées exclues des compteurs de la semaine
│   └── observations/page.tsx              # NOUVEAU : « Mes observations » avec statut et motif
├── components/onglets-prof.tsx            # MODIFIÉ : onglet « Mes observations »
└── lib/statuts.ts                         # NOUVEAU : libellés français des statuts
```

**Structure Decision**: structure existante conservée (application Next.js dans `app/`,
base dans `supabase/`). Les nouvelles pages suivent le modèle des pages actuelles :
composant serveur pour la lecture, Server Actions pour l'écriture, styles de `globals.css`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principe II : durée de conservation non fixée | La décision appartient à la direction (responsable des données) ; elle n'est pas encore prise | Inventer une durée serait décider à la place de la direction. Le point est tracé (FR-016) et bloque la mise en service, pas le développement |

## Points ouverts

1. **Admin seul** : tranché le 2026-11-15 — un admin sans rôle éducateur peut valider
   (FR-008 mis à jour). Conséquence : un compte prof + admin peut valider ses propres
   observations.
2. **Faits graves et niveaux** : un fait grave n'entre pas dans la file, donc personne ne
   le valide, donc il ne compte jamais dans les niveaux ni dans le rapport final (FR-015).
   À régler dans la future fonctionnalité « faits graves ». Voir research.md R6.
