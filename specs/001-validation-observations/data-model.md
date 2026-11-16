# Data Model: Validation des observations par l'éducateur

Aucune nouvelle table. Tout porte sur `public.observations` (existante).

## Type `statut_observation`

| Valeur | Libellé affiché | Origine |
|--------|-----------------|---------|
| `en_attente` | En attente | existant |
| `validee` | Validée | existant |
| `refusee` | Refusée | **nouveau** (migration 0005) |
| `corrigee` | Validée (corrigée) | existant, non utilisé par cette fonctionnalité |
| `retiree` | Retirée | existant, non utilisé par cette fonctionnalité |

## Table `observations` — changements

| Colonne | Type | Changement | Règle |
|---------|------|------------|-------|
| `statut` | statut_observation | inchangée | défaut `en_attente` |
| `valide_par` | uuid → adultes | sens élargi : « décidé par » | rempli d'office par le trigger à la validation et au refus |
| `valide_le` | timestamptz | sens élargi : « décidé le » | idem |
| `motif_refus` | text | **nouvelle** | obligatoire et non vide si `statut = 'refusee'`, 500 caractères max |
| `grave` | boolean | inchangée | recopiée du comportement à l'insertion ; exclut de la file |

Index : l'index partiel existant sur `statut = 'en_attente'` sert la file.

## Transitions d'état

```text
en_attente ──valider──▶ validee      (éducateur ou admin)
en_attente ──refuser──▶ refusee      (éducateur ou admin, motif obligatoire)
validee / refusee ──▶ validee | refusee | en_attente   INTERDIT
```

Les passages existants vers `corrigee` et `retiree` ne sont pas modifiés.

## Règles en base

- `app.est_educateur()` (existante) : vraie si l'adulte connecté a le rôle `educateur` ou
  `admin`. C'est elle qui autorise la décision.
- Trigger `observation_avant_update` : si `statut` change et que l'appelant est un
  utilisateur connecté, exige `app.est_educateur()` et une transition autorisée ; remplit
  `valide_par` / `valide_le`. Les appels serveur sans utilisateur (tâches planifiées) ne
  sont pas concernés.
- Policy `obs_prof_update` : `with check` complété par `statut = 'en_attente'`.
- Policies parent et élève : inchangées (`validee` / `corrigee`, ou `grave` pour le parent).
  Une observation refusée ou en attente leur reste invisible.

## Qui voit quoi

| Rôle | En attente | Validée | Refusée | Motif de refus |
|------|-----------|---------|---------|----------------|
| Éducateur / Admin | toutes | toutes | toutes | oui |
| Prof | les siennes et celles de ses classes | idem | idem | oui (policy existante) |
| Parent | non (sauf grave) | ses enfants | non | non |
| Élève | non | les siennes | non | non |

Remarque : la policy existante laisse un prof lire les observations de ses classes écrites
par d'autres, motif compris. La page « Mes observations » ne montre que les siennes.
