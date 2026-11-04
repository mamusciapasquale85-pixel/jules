"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfil } from "@/lib/profil";

export type EtatObservation = { erreur?: string };

export async function enregistrerObservation(_prev: EtatObservation, formData: FormData): Promise<EtatObservation> {
  const eleveId = String(formData.get("eleve_id") ?? "");
  const comportementId = String(formData.get("comportement_id") ?? "");
  const sens = String(formData.get("sens") ?? "");
  const commentaire = String(formData.get("commentaire") ?? "").trim();
  const classeId = String(formData.get("classe_id") ?? "");

  if (!eleveId) return { erreur: "Choisis un élève." };
  if (!comportementId) return { erreur: "Choisis un comportement." };
  if (sens !== "positif" && sens !== "a_ameliorer") return { erreur: "Positif ou à améliorer ?" };
  if (commentaire.length > 500) return { erreur: "Commentaire trop long (500 caractères max)." };

  const profil = await getProfil();
  if (!profil || profil.kind !== "adulte") return { erreur: "Non connecté." };

  const supabase = await createClient();
  const { error } = await supabase.from("observations").insert({
    eleve_id: eleveId,
    comportement_id: comportementId,
    sens,
    auteur_id: profil.id,
    commentaire: commentaire || null,
  });

  if (error) return { erreur: "Enregistrement refusé : " + error.message };

  redirect(`/prof?classe=${classeId}&ok=1`);
}
