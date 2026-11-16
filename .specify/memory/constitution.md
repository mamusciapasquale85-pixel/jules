<!--
Sync Impact Report
- Version : (template) → 1.0.0 (première ratification)
- Principes définis :
  I. Sécurité par RLS (non négociable)
  II. Protection des données de mineurs (RGPD)
  III. Rôles et accès minimaux
  IV. Paramétrage par les données, pas par migration
  V. Simplicité et migrations versionnées
- Sections ajoutées : Contraintes techniques, Workflow de développement, Governance
- Sections supprimées : aucune
- Templates à vérifier :
  ⚠ .specify/templates/plan-template.md (section "Constitution Check" à aligner sur I–V)
  ⚠ .specify/templates/spec-template.md (exigences RGPD / rôles)
  ⚠ .specify/templates/tasks-template.md (tâches de test RLS)
- TODO :
  TODO(RATIFICATION_DATE) : date d'adoption officielle par la direction à confirmer
-->

# Jules Constitution

## Core Principles

### I. Sécurité par RLS (non négociable)

- Chaque table exposée DOIT avoir la Row Level Security activée, avec des policies explicites
  par rôle. Aucune table ne DOIT être lisible ou modifiable par défaut.
- Les vues DOIVENT respecter les droits de l'appelant (`security_invoker`) ou être protégées
  par des policies équivalentes.
- La clé `service_role` NE DOIT être utilisée que côté serveur (routes Next.js, Edge Functions,
  pg_cron), jamais dans le navigateur ni dans un dépôt.
- Toute nouvelle table ou policy DOIT être accompagnée d'un test prouvant qu'un rôle non
  autorisé ne voit rien.

Justification : la base contient des observations comportementales sur des élèves ; une fuite
entre classes, familles ou rôles est la faute la plus grave possible.

### II. Protection des données de mineurs (RGPD)

- Les données DOIVENT être hébergées dans l'Union européenne (projet Supabase région UE).
- Seules les données nécessaires au suivi pédagogique PEUVENT être collectées (minimisation).
- Les parents NE DOIVENT voir que les données de leur(s) enfant(s) ; les élèves que les leurs.
- Les e-mails (Brevo) NE DOIVENT contenir que le minimum utile et renvoyer vers l'application
  pour le détail.
- Toute fonctionnalité nouvelle touchant des données personnelles DOIT documenter sa finalité
  et sa durée de conservation dans sa spec.

Justification : les personnes concernées sont des mineurs ; le RGPD et la confiance des
familles l'imposent.

### III. Rôles et accès minimaux

- Les rôles sont : prof, éducateur, admin, direction, parent, élève. Chaque rôle DOIT recevoir
  le plus petit ensemble de droits nécessaire à sa tâche.
- Les comptes NE DOIVENT être créés que par l'admin (pas d'inscription libre).
- La connexion élève par code DOIT passer par l'Edge Function `connexion-eleve` et ne donner
  accès qu'aux données de l'élève concerné.
- L'import CSV d'élèves DOIT rester côté serveur et faire un upsert sur
  (nom, prénom, date de naissance) sans créer de doublons.

### IV. Paramétrage par les données, pas par migration

- Les seuils d'alerte, la liste des comportements graves et les règles d'alerte DOIVENT être
  stockés en données (`regles_alerte`, référentiel) et modifiables sans migration SQL.
- La liste des graves est décidée par la direction ; le code NE DOIT PAS la coder en dur.
- Les seuils de `v_niveau_adultes` (34/67/90 %) sont provisoires et DEVRAIENT migrer vers une
  table de paramètres.
- Le référentiel (4 domaines, 20 compétences, 95 comportements) DOIT rester la source unique
  de vérité pour l'interface et les calculs.

### V. Simplicité et migrations versionnées

- Tout changement de schéma DOIT passer par un fichier numéroté dans `supabase/migrations/`
  (`NNNN_description.sql`), jamais par une modification manuelle en production.
- On DOIT privilégier les mécanismes natifs (Postgres, vues, pg_cron, webhooks) avant
  d'ajouter un service ou une dépendance.
- Aucune abstraction NE DEVRAIT être ajoutée sans besoin concret (YAGNI).

## Contraintes techniques

- Base et authentification : Supabase (Postgres, région UE), RLS activée partout.
- Application : Next.js dans `app/`.
- Tâches planifiées : pg_cron (récapitulatif horaire aux parents via `v_a_notifier` →
  `notifications`, calcul quotidien des alertes de `regles_alerte` vers `alertes`).
- Événements : webhook sur `observations.grave = true` pour la notification immédiate.
- E-mails : Brevo, appelé uniquement côté serveur.
- Fonctions serveur : Supabase Edge Functions.
- Langue de l'interface et des messages : français.
- Les secrets DOIVENT vivre dans les variables d'environnement (`.env*` jamais versionnés).

## Workflow de développement

- Chaque fonctionnalité suit le flux Spec Kit : spec → plan → tâches → implémentation.
- Le plan DOIT contenir un « Constitution Check » qui vérifie les principes I à V.
- Toute migration DOIT être testée sur une base locale ou une branche Supabase avant la
  production.
- Les policies RLS DOIVENT être testées pour chaque rôle concerné (accès autorisé et refusé).
- Une tâche n'est terminée qu'avec une preuve de fonctionnement (test, requête, capture).
- On committe aux étapes logiques, avec des messages explicites.

## Governance

- Cette constitution prime sur les autres pratiques du projet.
- Tout amendement DOIT être documenté dans ce fichier (Sync Impact Report), avec la version
  mise à jour et, si nécessaire, un plan de migration.
- Versionnage sémantique :
  - MAJEUR : suppression ou redéfinition incompatible d'un principe ;
  - MINEUR : ajout d'un principe ou d'une section, ou extension notable ;
  - CORRECTIF : clarification, reformulation, correction sans effet sur le fond.
- Chaque revue de code ou de spec DOIT vérifier la conformité ; tout écart DOIT être justifié
  par écrit dans le plan (section « Complexity Tracking »).

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-11-15
