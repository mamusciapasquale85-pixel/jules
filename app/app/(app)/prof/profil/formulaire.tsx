"use client";

import { useActionState } from "react";
import { creerProfilEleve, type EtatProfil } from "./actions";

export type ClasseCourte = { id: string; nom: string };

export default function FormulaireProfil({ classes, classeInitiale }: { classes: ClasseCourte[]; classeInitiale: string }) {
  const [etat, action, enCours] = useActionState<EtatProfil, FormData>(creerProfilEleve, {});

  return (
    <form action={action} className="contenu" style={{ gap: 18 }}>
      {etat.cree && (
        <div className="succes" role="status">
          Profil créé pour <strong>{etat.cree.prenom} {etat.cree.nom}</strong>.
          <div style={{ marginTop: 6 }}>Code de connexion :</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>{etat.cree.code}</div>
          <div style={{ marginTop: 6 }}>Note-le maintenant : il ne sera plus affiché.</div>
        </div>
      )}

      <label className="etiquette">
        <span className="titre-section">Prénom</span>
        <input className="champ" name="prenom" required maxLength={80} autoComplete="off" />
      </label>
      <label className="etiquette">
        <span className="titre-section">Nom</span>
        <input className="champ" name="nom" required maxLength={80} autoComplete="off" />
      </label>
      <label className="etiquette">
        <span className="titre-section">Date de naissance</span>
        <input className="champ" name="date_naissance" type="date" required />
      </label>
      <label className="etiquette">
        <span className="titre-section">Classe</span>
        <select className="champ" name="classe_id" defaultValue={classeInitiale} required>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </label>

      {etat.erreur && <p className="erreur">{etat.erreur}</p>}
      <button className="bouton bouton-grand" type="submit" disabled={enCours}>
        {enCours ? "Création…" : "Créer le profil élève"}
      </button>
    </form>
  );
}
