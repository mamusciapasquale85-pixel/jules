import { redirect } from "next/navigation";
import { getProfil } from "@/lib/profil";
import { Marque } from "@/components/marque";
import FormulaireMotDePasse from "../formulaire-mot-de-passe";
import { changerMotDePasse } from "../actions";

export default async function PageMotDePasse() {
  const profil = await getProfil();
  // Les élèves se connectent avec un code, pas avec un mot de passe.
  if (!profil || profil.kind === "eleve") redirect("/");

  return (
    <main className="ecran">
      <header className="entete">
        <Marque />
        <h1 style={{ fontSize: 24 }}>Changer mon mot de passe</h1>
      </header>
      <FormulaireMotDePasse action={changerMotDePasse} avecAncien />
    </main>
  );
}
