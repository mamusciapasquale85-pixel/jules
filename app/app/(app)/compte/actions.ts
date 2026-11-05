"use server";

import { createClient } from "@/lib/supabase/server";
import { verifierNouveau, sessionDeRecuperation } from "@/lib/mot-de-passe";

export type EtatMotDePasse = { erreur?: string; ok?: boolean };

/** Adulte ou parent connecté : l'ancien mot de passe est exigé. */
export async function changerMotDePasse(_prev: EtatMotDePasse, formData: FormData): Promise<EtatMotDePasse> {
  const ancien = String(formData.get("ancien") ?? "");
  const nouveau = String(formData.get("nouveau") ?? "");
  const erreur = verifierNouveau(nouveau, String(formData.get("confirmation") ?? ""));
  if (erreur) return { erreur };
  if (nouveau === ancien) return { erreur: "Choisis un mot de passe différent de l’ancien." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { erreur: "Session expirée. Reconnecte-toi." };

  const { error: erreurAncien } = await supabase.auth.signInWithPassword({ email: user.email, password: ancien });
  if (erreurAncien) return { erreur: "Mot de passe actuel incorrect." };

  const { error } = await supabase.auth.updateUser({ password: nouveau });
  if (error) return { erreur: error.code === "weak_password" ? "Mot de passe trop faible." : "Changement refusé. Réessaie." };
  return { ok: true };
}

/** Après un lien « mot de passe oublié » : pas d'ancien mot de passe, mais la session doit venir du lien. */
export async function definirNouveauMotDePasse(_prev: EtatMotDePasse, formData: FormData): Promise<EtatMotDePasse> {
  const nouveau = String(formData.get("nouveau") ?? "");
  const erreur = verifierNouveau(nouveau, String(formData.get("confirmation") ?? ""));
  if (erreur) return { erreur };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erreur: "Lien expiré. Redemande un lien depuis la page de connexion." };
  const { data: { session } } = await supabase.auth.getSession();
  if (!sessionDeRecuperation(session?.access_token)) {
    return { erreur: "Lien expiré. Redemande un lien depuis la page de connexion." };
  }

  const { error } = await supabase.auth.updateUser({ password: nouveau });
  if (error) return { erreur: error.code === "weak_password" ? "Mot de passe trop faible." : "Changement refusé. Réessaie." };
  return { ok: true };
}
