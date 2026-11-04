import { deconnexion } from "@/app/connexion/actions";

export default function Page() {
  return (
    <main className="ecran">
      <header className="entete">
        <span className="marque">Jules</span>
        <h1 style={{ fontSize: 24 }}>Mon espace</h1>
        <span className="sous">Écran en construction</span>
      </header>
      <div className="contenu">
        <form action={deconnexion}><button className="bouton bouton-secondaire">Se déconnecter</button></form>
      </div>
    </main>
  );
}
