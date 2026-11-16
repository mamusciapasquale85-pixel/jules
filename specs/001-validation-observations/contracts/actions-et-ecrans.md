# Contrats : actions serveur et écrans

## Actions serveur — `app/app/(app)/educateur/validation/actions.ts`

### `validerObservations(ids: string[])`

- Appelant : adulte avec le rôle éducateur ou admin.
- Effet : passe à `validee` les observations de `ids` encore `en_attente`.
- Retour : `{ validees: number, dejaTraitees: number, erreur?: string }`.
- Refus : liste vide → erreur « Aucune observation sélectionnée. » ; appelant sans
  ces rôles → erreur renvoyée par la base, affichée en français.

### `refuserObservation(id: string, motif: string)`

- Effet : passe l'observation à `refusee` avec `motif_refus`.
- Validation : motif obligatoire après suppression des espaces, 500 caractères max.
- Retour : `{ ok: boolean, erreur?: string }` ; si déjà traitée : « Cette observation a
  déjà été traitée. »

Les deux actions revalident `/educateur` et `/educateur/validation`.

## Écran `/educateur/validation`

- Paramètres d'URL : `classe` (id, optionnel), `eleve` (id, optionnel).
- Affiche : compteur total en attente ; liste triée par `observe_le` croissant avec élève,
  classe, prof, comportement, sens (Positif / À améliorer), commentaire, date.
- Exclut : `grave = true`.
- Actions : case à cocher par ligne, « Tout cocher », « Valider la sélection »,
  « Valider » et « Refuser » par ligne (le refus ouvre un champ motif).
- File vide : « Aucune observation en attente. »
- Accès : éducateur ou admin (layout `/educateur` existant). Un prof seul est redirigé.

## Écran `/educateur` (modifié)

- Lien « Validation » avec le nombre en attente.

## Écran `/prof/observations` (nouveau)

- Liste des observations dont l'adulte connecté est l'auteur, de la plus récente à la plus
  ancienne : élève, comportement, sens, date, statut (En attente / Validée / Refusée) et
  motif si refusée.
- Accessible depuis un nouvel onglet « Mes observations ».
