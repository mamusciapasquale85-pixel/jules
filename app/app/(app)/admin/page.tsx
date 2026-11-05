import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfil } from "@/lib/profil";
import { PiedCompte } from "@/components/pied-compte";
import { Marque } from "@/components/marque";
import FormulaireAdulte from "../prof/profil/formulaire-adulte";

export default async function PageAdmin() {
  const profil = await getProfil();
  if (!profil || profil.kind !== "adulte") return null;

  // RLS : l'admin voit toutes les classes.
  const supabase = await createClient();
  const { data: classes } = await supabase.from("classes").select("id, nom").order("nom");

  return (
    <main className="ecran">
      <header className="entete">
        <Marque />
        <h1 style={{ fontSize: 24 }}>Comptes adultes</h1>
        <span className="sous">Créer un compte prof ou éducateur</span>
      </header>
      <div className="contenu">
        <FormulaireAdulte classes={classes ?? []} />
        {profil.roles.includes("prof") && (
          <Link className="bouton bouton-secondaire" href="/prof">Retour à mes classes</Link>
        )}
        <PiedCompte />
      </div>
    </main>
  );
}
