/**
 * Coordonnées publiques du projet Supabase « Jules ».
 * L'URL et la clé publishable sont faites pour être exposées au navigateur :
 * le RLS protège les données. Les variables d'environnement, si présentes, ont priorité.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jbrwyjxhkytgyrtiftoq.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_9zondoDqZSgHDvW9tReDBA_7rxECfnC";
