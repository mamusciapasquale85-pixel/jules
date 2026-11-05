import { Marque } from "@/components/marque";
import FormulaireMotDePasse from "../formulaire-mot-de-passe";
import { definirNouveauMotDePasse } from "../actions";

export default function PageNouveauMotDePasse() {
  return (
    <main className="ecran">
      <header className="entete">
        <Marque />
        <h1 style={{ fontSize: 24 }}>Nouveau mot de passe</h1>
        <span className="sous">Choisis ton nouveau mot de passe</span>
      </header>
      <FormulaireMotDePasse action={definirNouveauMotDePasse} avecAncien={false} />
    </main>
  );
}
