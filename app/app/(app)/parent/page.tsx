import { PiedCompte } from "@/components/pied-compte";
import { Marque } from "@/components/marque";

export default function Page() {
  return (
    <main className="ecran">
      <header className="entete">
        <Marque />
        <h1 style={{ fontSize: 24 }}>Espace parents</h1>
        <span className="sous">Écran en construction</span>
      </header>
      <div className="contenu">
        <PiedCompte />
      </div>
    </main>
  );
}
