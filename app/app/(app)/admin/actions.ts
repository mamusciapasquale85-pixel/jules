"use server";

import { revalidatePath } from "next/cache";
import { getProfil } from "@/lib/profil";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { creerCompteAdulte, envoyerLienMotDePasse } from "@/lib/comptes";

export type EtatDecision = { erreur?: string; info?: string };

async function adminConnecte() {
  const profil = await getProfil();
  return profil && profil.kind === "adulte" && profil.roles.includes("admin") ? profil : null;
}

export async function accepterDemande(_prev: EtatDecision, formData: FormData): Promise<EtatDecision> {
  const profil = await adminConnecte();
  if (!profil) return { erreur: "Non autorisé." };

  const id = String(formData.get("id") ?? "");
  const classeIds = formData.getAll("classes").map(String);
  const admin = createAdminClient();

  const { data: demande } = await admin
    .from("demandes_compte")
    .select("id, prenom, nom, email, role")
    .eq("id", id)
    .eq("statut", "en_attente")
    .maybeSingle();
  if (!demande) return { erreur: "Demande introuvable ou déjà traitée." };

  if (demande.role === "prof" && classeIds.length > 0) {
    const supabase = await createClient();
    const { data: classes } = await supabase.from("classes").select("id").in("id", classeIds);
    if (classes?.length !== classeIds.length) return { erreur: "Classe inconnue." };
  }

  const resultat = await creerCompteAdulte({
    prenom: demande.prenom,
    nom: demande.nom,
    email: demande.email,
    role: demande.role as "prof" | "educateur",
    classeIds,
  });
  if (!resultat.ok) return { erreur: resultat.erreur };

  await admin
    .from("demandes_compte")
    .update({ statut: "acceptee", traite_par: profil.id, traite_le: new Date().toISOString() })
    .eq("id", demande.id);

  const mailParti = await envoyerLienMotDePasse(demande.email);
  revalidatePath("/admin");
  return mailParti
    ? { info: `Compte créé. ${demande.prenom} a reçu un e-mail pour choisir son mot de passe.` }
    : { info: `Compte créé, mais l’e-mail n’est pas parti. Mot de passe provisoire à transmettre : ${resultat.motDePasse}` };
}

export async function refuserDemande(_prev: EtatDecision, formData: FormData): Promise<EtatDecision> {
  const profil = await adminConnecte();
  if (!profil) return { erreur: "Non autorisé." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("demandes_compte")
    .update({ statut: "refusee", traite_par: profil.id, traite_le: new Date().toISOString() })
    .eq("id", String(formData.get("id") ?? ""))
    .eq("statut", "en_attente");
  if (error) return { erreur: "Refus impossible. Réessaie." };
  revalidatePath("/admin");
  return { info: "Demande refusée." };
}
