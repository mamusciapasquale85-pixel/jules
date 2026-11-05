import Link from "next/link";
import { PiedCompte } from "@/components/pied-compte";
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
        <PiedCompte />
      </div>
    </main>
  );
}
