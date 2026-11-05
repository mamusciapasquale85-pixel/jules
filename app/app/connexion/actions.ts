"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMAIL_VALIDE, origineSite } from "@/lib/comptes";
import { confirmerDemande, prevenirAdminsDemande } from "@/lib/mail";
import { createClient } from "@/lib/supabase/server";

export type EtatConnexion = { erreur?: string };

export async function connexionAdulte(_prev: EtatConnexion, formData: FormData): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  if (!email || !motDePasse) return { erreur: "E-mail et mot de passe requis." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
  if (error) return { erreur: "E-mail ou mot de passe incorrect." };

  redirect("/");
}

export async function deconnexion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}

export type EtatOubli = { erreur?: string; envoye?: boolean };

export async function demanderReinitialisation(_prev: EtatOubli, formData: FormData): Promise<EtatOubli> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_VALIDE.test(email)) return { erreur: "Adresse e-mail invalide." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origineSite()}/api/auth/recuperation`,
  });
  // Même réponse que le compte existe ou non, pour ne pas révéler qui est inscrit.
  if (error?.status === 429) return { erreur: "Trop de demandes. Réessaie dans quelques minutes." };
  return { envoye: true };
}

export type EtatDemande = { erreur?: string; envoyee?: boolean };

/** Demande de compte prof ou éducateur, à valider par l'admin. */
export async function demanderCompte(_prev: EtatDemande, formData: FormData): Promise<EtatDemande> {
  // Champ invisible : seul un robot le remplit.
  if (String(formData.get("site_web") ?? "") !== "") return { envoyee: true };

  const prenom = String(formData.get("prenom") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  const message = String(formData.get("message") ?? "").trim();

  if (!prenom || !nom) return { erreur: "Indique ton prénom et ton nom." };
  if (prenom.length > 80 || nom.length > 80) return { erreur: "Prénom ou nom trop long." };
  if (!EMAIL_VALIDE.test(email) || email.length > 254) return { erreur: "Adresse e-mail invalide." };
  if (role !== "prof" && role !== "educateur") return { erreur: "Choisis ton rôle." };
  if (message.length > 500) return { erreur: "Message trop long (500 caractères maximum)." };

  const admin = createAdminClient();
  const { error } = await admin.from("demandes_compte").insert({ prenom, nom, email, role, message: message || null });
  // Une demande déjà en attente pour cette adresse : même réponse, et pas de nouveau mail.
  if (error?.code === "23505") return { envoyee: true };
  if (error) return { erreur: "Envoi impossible. Réessaie plus tard." };

  await Promise.all([
    prevenirAdminsDemande({ prenom, nom, email, role, message: message || null }),
    confirmerDemande({ prenom, email }),
  ]);
  return { envoyee: true };
}
