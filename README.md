# Jules — base de données

Deux fichiers SQL, à appliquer dans l'ordre sur un projet Supabase vierge (région UE).

```
supabase/migrations/0001_schema.sql       types, tables, RLS, vues
supabase/migrations/0002_referentiel.sql  4 domaines, 20 compétences, 95 comportements, 5 règles d'alerte
```

## Appliquer

```bash
supabase init
supabase link --project-ref <ref-du-projet>
supabase db push
```

Ou coller chaque fichier dans l'éditeur SQL du tableau de bord Supabase.

## Vérifier

```sql
select count(*) from public.competences;     -- 20
select count(*) from public.comportements;   -- 95
select count(*) filter (where grave) from public.comportements;  -- 5
```

## Ce qui n'est pas dans le SQL

| Besoin | Où ça vit | Note |
| --- | --- | --- |
| Résumé horaire aux parents | Fonction planifiée (pg_cron ou Edge Function toutes les heures) | Lit `v_a_notifier`, groupe par parent, écrit dans `notifications`, envoie push/e-mail |
| Fait grave immédiat | Webhook sur insert dans `observations` où `grave = true` | Même chemin, sans attendre la validation |
| Calcul des alertes | Fonction planifiée quotidienne | Applique `regles_alerte`, insère dans `alertes` |
| Connexion des élèves par code | Edge Function `connexion-eleve` | Vérifie `code_connexion`, connecte un compte technique lié à `eleves.user_id` |
| Import CSV | Route serveur Next.js avec la clé service | Parse, vérifie, upsert sur (nom, prénom, date de naissance) |

## Points à régler pendant le pilote

- La formule du niveau « adultes » (`v_niveau_adultes`) est provisoire : seuils 34 % / 67 % / 90 %.
- La liste des comportements graves (5 actuellement : R1 propos discriminants, R4 ×3, O4 propos dénigrants) est une proposition. La direction tranche.
- Les seuils d'alerte sont dans `regles_alerte`, modifiables sans migration.
