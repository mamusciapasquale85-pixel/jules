import { deconnexion } from "@/app/connexion/actions";
import { Marque } from "@/components/marque";

export default function Page() {
  return (
    <main className="ecran">
      <header className="entete">
        <Marque />
        <h1 style={{ fontSize: 24 }}>Espace éducateur</h1>
        <span className="sous">Écran en construction</span>
      </header>
      <div className="contenu">
        <form action={deconnexion}><button className="bouton bouton-secondaire">Se déconnecter</button></form>
      </div>
    </main>
  );
}
