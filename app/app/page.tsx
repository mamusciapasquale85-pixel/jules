import { redirect } from "next/navigation";
import { accueilPour, getProfil } from "@/lib/profil";

export default async function Accueil() {
  const profil = await getProfil();
  if (!profil) redirect("/connexion?erreur=sans-profil");
  redirect(accueilPour(profil));
}
