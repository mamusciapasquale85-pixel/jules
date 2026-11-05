"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erreur: "Adresse e-mail invalide." };

  const entetes = await headers();
  const hote = entetes.get("x-forwarded-host") ?? entetes.get("host");
  const protocole = entetes.get("x-forwarded-proto") ?? "https";
  const origine = process.env.NEXT_PUBLIC_SITE_URL ?? `${protocole}://${hote}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origine}/api/auth/recuperation`,
  });
  // Même réponse que le compte existe ou non, pour ne pas révéler qui est inscrit.
  if (error?.status === 429) return { erreur: "Trop de demandes. Réessaie dans quelques minutes." };
  return { envoye: true };
}
