"use client";

import Link from "next/link";
import { useActionState } from "react";
import { connexionAdulte, type EtatConnexion } from "./actions";
import { Marque } from "@/components/marque";

export default function PageConnexion() {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(connexionAdulte, {});

  return (
    <main className="ecran">
      <header className="entete" style={{ paddingBottom: 24 }}>
        <Marque />
        <h1 style={{ fontSize: 26 }}>Connexion</h1>
        <span className="sous">Profs, éducateurs et parents</span>
      </header>

      <form action={action} className="contenu" style={{ gap: 16 }}>
        <label className="etiquette">
          E-mail
          <input className="champ" type="email" name="email" autoComplete="email" required />
        </label>
        <label className="etiquette">
          Mot de passe
          <input className="champ" type="password" name="mot_de_passe" autoComplete="current-password" required />
        </label>
        {etat.erreur && <p className="erreur">{etat.erreur}</p>}
        <button className="bouton bouton-grand" type="submit" disabled={enCours}>
          {enCours ? "Connexion…" : "Se connecter"}
        </button>
        <Link href="/connexion/oubli" style={{ textAlign: "center", fontSize: 14, color: "var(--teal-fonce)" }}>
          Mot de passe oublié ?
        </Link>

        <div style={{ borderTop: "1px solid var(--bord)", paddingTop: 16, marginTop: 8 }}>
          <Link href="/connexion/eleve" className="bouton bouton-secondaire bouton-grand">
            Je suis un élève, j&apos;ai un code
          </Link>
          <Link href="/connexion/demande" style={{ display: "block", textAlign: "center", fontSize: 14, color: "var(--teal-fonce)", marginTop: 14 }}>
            Prof ou éducateur sans compte ? Demander un compte
          </Link>
        </div>
      </form>
    </main>
  );
}
