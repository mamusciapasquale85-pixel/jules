# Jules — application

Next.js 15 + Supabase. Une seule base de code pour les 4 profils (prof, éducateur, élève, parent), installable comme une appli (PWA).

## Démarrer

```bash
cd app
cp ENV.exemple.txt .env.local   # puis remplir SUPABASE_SERVICE_ROLE_KEY et ELEVE_AUTH_SECRET
npm install
npm run dev                        # http://localhost:3000
```

`ELEVE_AUTH_SECRET` : 32 caractères aléatoires, par exemple `openssl rand -hex 32`.

## Compte de test (à supprimer avant le pilote)

- Prof : `prof.test@jules.local` / `Jules-test-2026` — classe 1C, 3 élèves.
- Élèves : codes `AMINA123`, `YANIS123`, `NOAH1234`.
- Une observation de test (commentaire « Test automatique… ») est restée en base : à supprimer depuis l'éditeur SQL.

## Fait

| Écran | Chemin | État |
| --- | --- | --- |
| Connexion adultes | `/connexion` | OK |
| Connexion élève par code | `/connexion/eleve` → `/api/auth/eleve` | OK (compte technique créé à la volée) |
| Prof · Ma classe | `/prof` | OK, testé de bout en bout |
| Prof · Nouvelle observation | `/prof/observation` | OK, testé de bout en bout |
| Éducateur, Élève, Parent | `/educateur`, `/eleve`, `/parent` | Écrans vides |

## Structure

```
app/
  middleware.ts                 session + protection des pages
  lib/supabase/{client,server,admin}.ts
  lib/profil.ts                 qui est connecté (adulte / élève / parent)
  app/connexion/                adultes + élèves
  app/api/auth/eleve/route.ts   connexion par code
  app/(app)/prof/               Ma classe, Nouvelle observation
  app/(app)/{educateur,eleve,parent}/   à faire
```

## Prochaines étapes

1. Éducateur : tableau de bord (file à valider, alertes), fiche élève.
2. Élève : auto-évaluation, mon évolution.
3. Parent : suivi, notifications, réglages.
4. Import CSV, résumé horaire, webhook fait grave.
