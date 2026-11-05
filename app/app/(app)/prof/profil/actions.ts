"use server";

import { randomInt } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfil } from "@/lib/profil";

export type EtatProfil = {
  erreur?: string;
  cree?: { prenom: string; nom: string; code: string };
};

export type EtatProfilAdulte = {
  erreur?: string;
  cree?: { prenom: string; nom: string; email: string; motDePasse: string };
};

// Sans 0/O, 1/I/L : le code est recopié à la main par l'élève.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function genererCode(longueur = 8) {
  let code = "";
  for (let i = 0; i < longueur; i++) code += ALPHABET[randomInt(ALPHABET.length)];
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

export async function creerProfilAdulte(_prev: EtatProfilAdulte, formData: FormData): Promise<EtatProfilAdulte> {
  const prenom = String(formData.get("prenom") ?? "").trim();
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  const classeIds = formData.getAll("classes").map(String);

  if (!prenom || !nom) return { erreur: "Indique le prénom et le nom." };
  if (prenom.length > 80 || nom.length > 80) return { erreur: "Prénom ou nom trop long." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { erreur: "Adresse e-mail invalide." };
  if (role !== "prof" && role !== "educateur") return { erreur: "Choisis un rôle." };

  // Un éducateur lit tous les élèves : seul un admin peut ouvrir ce type de compte.
  const profil = await getProfil();
  if (!profil || profil.kind !== "adulte" || !profil.roles.includes("admin")) {
    return { erreur: "Non autorisé." };
  }

  const classesDuCompte = role === "prof" ? classeIds : [];
  if (classesDuCompte.length > 0) {
    const supabase = await createClient();
    const { data: classes } = await supabase.from("classes").select("id").in("id", classesDuCompte);
    if (classes?.length !== classesDuCompte.length) return { erreur: "Classe inconnue." };
  }

  const admin = createAdminClient();
  const motDePasse = genererCode(12);
  const { data: compte, error: erreurCompte } = await admin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
  });
  if (erreurCompte || !compte.user) {
    return {
      erreur: erreurCompte?.code === "email_exists" ? "Cette adresse e-mail a déjà un compte." : "Création du compte refusée. Réessaie.",
    };
  }

  // Sans ligne adultes, le compte ne servirait à rien : on annule tout en cas d'échec.
  const { data: adulte, error: erreurAdulte } = await admin
    .from("adultes")
    .insert({ user_id: compte.user.id, prenom, nom, email, roles: [role] })
    .select("id")
    .single();
  if (erreurAdulte || !adulte) {
    await admin.auth.admin.deleteUser(compte.user.id);
    return { erreur: erreurAdulte?.code === "23505" ? "Cette adresse e-mail est déjà utilisée." : "Enregistrement refusé. Réessaie." };
  }

  if (classesDuCompte.length > 0) {
    const { error: erreurClasses } = await admin
      .from("adultes_classes")
      .insert(classesDuCompte.map((classe_id) => ({ adulte_id: adulte.id, classe_id })));
    if (erreurClasses) {
      await admin.from("adultes").delete().eq("id", adulte.id);
      await admin.auth.admin.deleteUser(compte.user.id);
      return { erreur: "Enregistrement refusé. Réessaie." };
    }
  }

  return { cree: { prenom, nom, email, motDePasse } };
}
