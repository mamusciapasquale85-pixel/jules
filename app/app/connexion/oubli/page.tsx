"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { demanderReinitialisation, type EtatOubli } from "../actions";
import { Marque } from "@/components/marque";

function Formulaire() {
  const [etat, action, enCours] = useActionState<EtatOubli, FormData>(demanderReinitialisation, {});
  const lienInvalide = useSearchParams().get("lien") === "invalide";

  if (etat.envoye) {
    return (
      <div className="contenu" style={{ gap: 16 }}>
        <p className="succes" role="status">
          Si un compte existe pour cette adresse, un e-mail avec un lien vient d’être envoyé. Le lien est valable une heure.
          Pense à regarder dans les indésirables.
        </p>
        <Link className="bouton bouton-secondaire bouton-grand" href="/connexion">Retour à la connexion</Link>
      </div>
    );
  }

  return (
    <form action={action} className="contenu" style={{ gap: 16 }}>
      {lienInvalide && <p className="erreur">Ce lien n’est plus valable. Demande un nouveau lien.</p>}
      <label className="etiquette">
        E-mail
        <input className="champ" type="email" name="email" autoComplete="email" required />
      </label>
      {etat.erreur && <p className="erreur">{etat.erreur}</p>}
      <button className="bouton bouton-grand" type="submit" disabled={enCours}>
        {enCours ? "Envoi…" : "Recevoir un lien"}
      </button>
      <Link className="bouton bouton-secondaire bouton-grand" href="/connexion">Retour à la connexion</Link>
    </form>
  );
}

export default function PageOubli() {
  return (
    <main className="ecran">
      <header className="entete" style={{ paddingBottom: 24 }}>
        <Marque />
        <h1 style={{ fontSize: 26 }}>Mot de passe oublié</h1>
        <span className="sous">Tu recevras un lien par e-mail</span>
      </header>
      <Suspense>
        <Formulaire />
      </Suspense>
    </main>
  );
}
