import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// Sans 0/O, 1/I/L : les codes sont parfois recopiés à la main.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function genererCode(longueur = 8) {
  let code = "";
  for (let i = 0; i < longueur; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

export const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Adresse publique du site, pour les liens envoyés par e-mail. */
export async function origineSite() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const entetes = await headers();
  const hote = entetes.get("x-forwarded-host") ?? entetes.get("host");
  const protocole = entetes.get("x-forwarded-proto") ?? "https";
  return `${protocole}://${hote}`;
}

export type ResultatCompte =
  | { ok: true; adulteId: string; motDePasse: string }
  | { ok: false; erreur: string };

/**
 * Crée un compte de connexion et sa fiche adulte (prof, éducateur ou direction = admin seul).
 * Les droits de l'appelant doivent être vérifiés AVANT : ce code utilise la clé service.
 */
export async function creerCompteAdulte(params: {
  prenom: string;
  nom: string;
  email: string;
  role: "prof" | "educateur" | "admin";
  classeIds: string[];
}): Promise<ResultatCompte> {
  const { prenom, nom, email, role } = params;
  const classeIds = role === "prof" ? params.classeIds : [];
  const admin = createAdminClient();

  const motDePasse = genererCode(12);
  const { data: compte, error: erreurCompte } = await admin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
  });
  if (erreurCompte || !compte.user) {
    return {
      ok: false,
      erreur: erreurCompte?.code === "email_exists" ? "Cette adresse e-mail a déjà un compte." : "Création du compte refusée. Réessaie.",
    };
  }

  // Sans fiche adulte, le compte ne servirait à rien : on annule tout en cas d'échec.
  const { data: adulte, error: erreurAdulte } = await admin
    .from("adultes")
    .insert({ user_id: compte.user.id, prenom, nom, email, roles: [role] })
    .select("id")
    .single();
  if (erreurAdulte || !adulte) {
    await admin.auth.admin.deleteUser(compte.user.id);
    return { ok: false, erreur: erreurAdulte?.code === "23505" ? "Cette adresse e-mail est déjà utilisée." : "Enregistrement refusé. Réessaie." };
  }

  if (classeIds.length > 0) {
    const { error: erreurClasses } = await admin
      .from("adultes_classes")
      .insert(classeIds.map((classe_id) => ({ adulte_id: adulte.id, classe_id })));
    if (erreurClasses) {
      await admin.from("adultes").delete().eq("id", adulte.id);
      await admin.auth.admin.deleteUser(compte.user.id);
      return { ok: false, erreur: "Enregistrement refusé. Réessaie." };
    }
  }

  return { ok: true, adulteId: adulte.id, motDePasse };
}

/** Envoie le mail « choisir un mot de passe » (même modèle que « mot de passe oublié »). */
export async function envoyerLienMotDePasse(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origineSite()}/api/auth/recuperation`,
  });
  return !error;
}
