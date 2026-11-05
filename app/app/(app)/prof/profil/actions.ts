"use server";

import { randomInt } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfil } from "@/lib/profil";

export type EtatProfil = {
  erreur?: string;
  cree?: { prenom: string; nom: string; code: string };
};

// Sans 0/O, 1/I/L : le code est recopié à la main par l'élève.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function genererCode() {
  let code = "";
  for (let i = 0; i < 8; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

export async function creerProfilEleve(_prev: EtatProfil, formData: FormData): Promise<EtatProfil> {
  const prenom = String(formData.get("prenom") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const dateNaissance = String(formData.get("date_naissance") ?? "");
  const classeId = String(formData.get("classe_id") ?? "");

  if (!prenom || !nom) return { erreur: "Indique le prénom et le nom." };
  if (prenom.length > 80 || nom.length > 80) return { erreur: "Prénom ou nom trop long." };

  const naissance = new Date(`${dateNaissance}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateNaissance) || Number.isNaN(naissance.getTime())) {
    return { erreur: "Date de naissance invalide." };
  }
  if (naissance.getTime() > Date.now() || naissance.getUTCFullYear() < 1990) {
    return { erreur: "Date de naissance invalide." };
  }

  const profil = await getProfil();
  if (!profil || profil.kind !== "adulte" || !profil.roles.includes("prof")) {
    return { erreur: "Non autorisé." };
  }

  // RLS : le prof ne voit que ses classes, donc une classe d'un collègue ne ressort pas.
  const supabase = await createClient();
  const { data: classe } = await supabase.from("classes").select("id").eq("id", classeId).maybeSingle();
  if (!classe) return { erreur: "Choisis une de tes classes." };

  // L'écriture sur eleves est réservée aux admins par le RLS : les droits sont vérifiés ci-dessus.
  const admin = createAdminClient();
  for (let essai = 0; essai < 5; essai++) {
    const code = genererCode();
    const { error } = await admin.from("eleves").insert({
      prenom,
      nom,
      date_naissance: dateNaissance,
      classe_id: classe.id,
      code_connexion: code,
    });
    if (!error) return { cree: { prenom, nom, code } };
    if (error.code !== "23505") return { erreur: "Enregistrement refusé. Réessaie." };
    if (!error.message.includes("code_connexion")) {
      return { erreur: "Cet élève existe déjà. Demande à l’éducateur de vérifier sa fiche." };
    }
  }
  return { erreur: "Enregistrement refusé. Réessaie." };
}
