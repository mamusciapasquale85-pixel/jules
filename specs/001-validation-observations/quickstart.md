# Quickstart : vérifier la validation des observations

Tout se fait sur une base locale. Ne jamais lancer ces étapes sur la production.

## Prérequis

- Docker lancé, CLI Supabase installée (à vérifier : `supabase --version`).
- `supabase init` si `supabase/config.toml` n'existe pas, puis `supabase start`.
- `supabase db reset` : rejoue les migrations 0001 à 0006.
- `app/env.local` pointé vers la base locale pour les essais dans le navigateur.

## 1. Tests en base par rôle

```
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" \
  -f supabase/tests/001_validation_observations.sql
```

Attendu : chaque ligne affiche `OK`, la transaction est annulée à la fin. Cas couverts :

- un prof seul ne peut pas passer son observation à validée ni refusée ;
- un admin sans rôle éducateur valide ;
- un éducateur valide ; `valide_par` et `valide_le` sont remplis ;
- un refus sans motif est rejeté, avec motif il passe ;
- une observation validée ne peut plus être refusée ;
- un parent ne voit ni l'en attente ni la refusée, il voit la validée ;
- un élève ne voit que la validée.

## 2. Parcours dans le navigateur (`npm run dev` dans `app/`)

1. Prof : encoder trois observations, dont une sur un comportement grave.
2. Éducateur : ouvrir `/educateur` → le lien « Validation » affiche 2.
3. `/educateur/validation` : deux lignes, la grave est absente ; filtrer par classe.
4. Cocher une ligne, « Valider la sélection » → compteur à 1.
5. Refuser l'autre sans motif → message d'erreur ; avec motif → file vide.
6. Prof : `/prof/observations` → une « Validée », une « Refusée » avec le motif.
7. Rapport de l'élève : seule l'observation validée est comptée.

## 3. Avant de livrer

- `npm run build` et `npm run lint` sans erreur dans `app/`.
- Détails des règles : [data-model.md](./data-model.md) ; des écrans :
  [contracts/actions-et-ecrans.md](./contracts/actions-et-ecrans.md).
