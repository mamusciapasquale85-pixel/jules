import Link from "next/link";
import { deconnexion } from "@/app/connexion/actions";

/** Bas de page des adultes : mot de passe et déconnexion. */
export function PiedCompte() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
      <Link className="bouton bouton-secondaire" href="/compte/mot-de-passe" style={{ height: 40, fontSize: 14 }}>
        Changer mon mot de passe
      </Link>
      <form action={deconnexion}>
        <button className="bouton bouton-secondaire" style={{ height: 40, fontSize: 14, width: "100%" }}>Se déconnecter</button>
      </form>
    </div>
  );
}
