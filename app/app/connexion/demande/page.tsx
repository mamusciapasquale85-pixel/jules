"use client";

import Link from "next/link";
import { useActionState } from "react";
import { demanderCompte, type EtatDemande } from "../actions";
import { Marque } from "@/components/marque";

export default function PageDemande() {
  const [etat, action, enCours] = useActionState<EtatDemande, FormData>(demanderCompte, {});

  return (
    <main className="ecran">
      <header className="entete" style={{ paddingBottom: 24 }}>
        <Marque />
        <h1 style={{ fontSize: 26 }}>Demander un compte</h1>
        <span className="sous">Profs et éducateurs de l’école</span>
      </header>

      {etat.envoyee ? (
        <div className="contenu" style={{ gap: 16 }}>
          <p className="succes" role="status">
            Demande envoyée. Tu vas recevoir un e-mail de confirmation, puis un second e-mail pour choisir ton mot de passe quand la demande sera acceptée.
            Pense à regarder dans les indésirables.
          </p>
          <Link className="bouton bouton-secondaire bouton-grand" href="/connexion">Retour à la connexion</Link>
        </div>
      ) : (
        <form action={action} className="contenu" style={{ gap: 16 }}>
          <label className="etiquette">
            Prénom
            <input className="champ" name="prenom" required maxLength={80} autoComplete="given-name" />
          </label>
          <label className="etiquette">
            Nom
            <input className="champ" name="nom" required maxLength={80} autoComplete="family-name" />
          </label>
          <label className="etiquette">
            E-mail
            <input className="champ" type="email" name="email" required maxLength={254} autoComplete="email" />
          </label>
          <label className="etiquette">
            Je suis
            <select className="champ" name="role" defaultValue="prof">
              <option value="prof">Prof</option>
              <option value="educateur">Éducateur</option>
            </select>
          </label>
          <label className="etiquette">
            Message (facultatif)
            <textarea className="champ" name="message" maxLength={500} rows={3} placeholder="Par exemple : mes classes, ma matière" style={{ height: "auto", paddingTop: 10 }} />
          </label>
          {/* Champ piège pour les robots, invisible pour les personnes. */}
          <input type="text" name="site_web" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1 }} />
          {etat.erreur && <p className="erreur">{etat.erreur}</p>}
          <button className="bouton bouton-grand" type="submit" disabled={enCours}>
            {enCours ? "Envoi…" : "Envoyer la demande"}
          </button>
          <Link className="bouton bouton-secondaire bouton-grand" href="/connexion">Retour à la connexion</Link>
        </form>
      )}
    </main>
  );
}
