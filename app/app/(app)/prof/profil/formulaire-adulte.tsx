"use client";

import { useActionState, useState } from "react";
import { creerProfilAdulte, type EtatProfilAdulte } from "./actions";
import type { ClasseCourte } from "./formulaire";

export default function FormulaireAdulte({ classes }: { classes: ClasseCourte[] }) {
  const [etat, action, enCours] = useActionState<EtatProfilAdulte, FormData>(creerProfilAdulte, {});
  const [role, setRole] = useState("prof");

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {etat.cree && (
        <div className="succes" role="status">
          Compte créé pour <strong>{etat.cree.prenom} {etat.cree.nom}</strong> ({etat.cree.email}).
          <div style={{ marginTop: 6 }}>Mot de passe :</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>{etat.cree.motDePasse}</div>
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
        <span className="titre-section">E-mail</span>
        <input className="champ" name="email" type="email" required maxLength={254} autoComplete="off" />
      </label>
      <label className="etiquette">
        <span className="titre-section">Rôle</span>
        <select className="champ" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="prof">Prof</option>
          <option value="educateur">Éducateur</option>
          <option value="admin">Direction (accès admin)</option>
        </select>
      </label>
      {role === "prof" && classes.length > 0 && (
        <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <legend className="titre-section" style={{ padding: 0, marginBottom: 6 }}>Classes</legend>
          {classes.map((c) => (
            <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
              <input type="checkbox" name="classes" value={c.id} />
              {c.nom}
            </label>
          ))}
        </fieldset>
      )}

      {etat.erreur && <p className="erreur">{etat.erreur}</p>}
      <button className="bouton bouton-grand" type="submit" disabled={enCours}>
        {enCours ? "Création…" : "Créer le compte"}
      </button>
    </form>
  );
}
