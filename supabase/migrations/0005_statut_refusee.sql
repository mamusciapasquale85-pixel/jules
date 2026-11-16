-- Jules — migration 0005 : statut « refusée » pour les observations
-- Seule instruction du fichier : une valeur ajoutée à un type énuméré ne peut pas être
-- utilisée dans la transaction qui l'ajoute. La suite est dans 0006.
alter type public.statut_observation add value if not exists 'refusee';
