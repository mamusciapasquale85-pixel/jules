import Link from "next/link";
import { deconnexion } from "@/app/connexion/actions";
import { getProfil } from "@/lib/profil";
import { Marque } from "@/components/marque";

export default async function Page() {
  const profil = await getProfil();
  const estAdmin = profil?.kind === "adulte" && profil.roles.includes("admin");
  return (
    <main className="ecran">
      <header className="entete">
        <Marque />
        <h1 style={{ fontSize: 24 }}>Espace éducateur</h1>
        <span className="sous">Écran en construction</span>
      </header>
      <div className="contenu">
        {estAdmin && <Link className="bouton" href="/admin">Comptes adultes</Link>}
        <form action={deconnexion}><button className="bouton bouton-secondaire">Se déconnecter</button></form>
      </div>
    </main>
  );
}
