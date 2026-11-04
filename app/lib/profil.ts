import { createClient } from "@/lib/supabase/server";

export type RoleAdulte = "prof" | "educateur" | "admin";

export type Profil =
  | { kind: "adulte"; id: string; nom: string; prenom: string; roles: RoleAdulte[] }
  | { kind: "eleve"; id: string; nom: string; prenom: string; classeId: string | null }
  | { kind: "parent"; id: string; email: string }
  | null;

/** Identifie qui est connecté : adulte, élève ou parent. */
export async function getProfil(): Promise<Profil> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adulte } = await supabase
    .from("adultes")
    .select("id, nom, prenom, roles")
    .eq("user_id", user.id)
    .maybeSingle();
  if (adulte) return { kind: "adulte", ...adulte, roles: adulte.roles as RoleAdulte[] };

  const { data: eleve } = await supabase
    .from("eleves")
    .select("id, nom, prenom, classe_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (eleve) return { kind: "eleve", id: eleve.id, nom: eleve.nom, prenom: eleve.prenom, classeId: eleve.classe_id };

  const { data: parent } = await supabase
    .from("parents")
    .select("id, email")
    .eq("user_id", user.id)
    .maybeSingle();
  if (parent) return { kind: "parent", ...parent };

  return null;
}

/** Page d'accueil selon le profil. */
export function accueilPour(profil: Profil): string {
  if (!profil) return "/connexion";
  if (profil.kind === "adulte") return profil.roles.includes("educateur") || profil.roles.includes("admin") ? "/educateur" : "/prof";
  if (profil.kind === "eleve") return "/eleve";
  return "/parent";
}
