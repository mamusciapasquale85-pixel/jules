"use client";

import { useActionState } from "react";
import { accepterDemande, refuserDemande, type EtatDecision } from "./actions";
import type { ClasseCourte } from "../prof/profil/formulaire";

export type Demande = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: "prof" | "educateur";
  message: string | null;
  created_at: string;
};

function CarteDemande({ demande, classes }: { demande: Demande; classes: ClasseCourte[] }) {
  const [etatOui, accepter, enCoursOui] = useActionState<EtatDecision, FormData>(accepterDemande, {});
  const [etatNon, refuser, enCoursNon] = useActionState<EtatDecision, FormData>(refuserDemande, {});
  const etat = etatOui.info || etatOui.erreur ? etatOui : etatNon;
  const date = new Date(demande.created_at).toLocaleDateString("fr-BE", { day: "numeric", month: "long" });

  if (etat.info) return <p className="succes" role="status">{demande.prenom} {demande.nom} : {etat.info}</p>;

  return (
    <div style={{ border: "1px solid var(--bord)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <strong>{demande.prenom} {demande.nom}</strong> · {demande.role === "prof" ? "Prof" : "Éducateur"}
        <div className="sourdine">{demande.email} · demandé le {date}</div>
        {demande.message && <p style={{ margin: "6px 0 0", fontSize: 14 }}>« {demande.message} »</p>}
      </div>
      <form action={accepter} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input type="hidden" name="id" value={demande.id} />
        {demande.role === "prof" && classes.length > 0 && (
          <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <legend className="sourdine" style={{ padding: 0, marginBottom: 4 }}>Ses classes</legend>
            {classes.map((c) => (
              <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15 }}>
                <input type="checkbox" name="classes" value={c.id} />
                {c.nom}
              </label>
            ))}
          </fieldset>
        )}
        <button className="bouton" type="submit" disabled={enCoursOui || enCoursNon}>
          {enCoursOui ? "Création…" : "Accepter"}
        </button>
      </form>
      <form action={refuser}>
        <input type="hidden" name="id" value={demande.id} />
        <button className="bouton bouton-secondaire" type="submit" disabled={enCoursOui || enCoursNon} style={{ width: "100%" }}>
          {enCoursNon ? "Refus…" : "Refuser"}
        </button>
      </form>
      {etat.erreur && <p className="erreur">{etat.erreur}</p>}
    </div>
  );
}

export default function ListeDemandes({ demandes, classes }: { demandes: Demande[]; classes: ClasseCourte[] }) {
  if (demandes.length === 0) return <p className="sourdine">Aucune demande en attente.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {demandes.map((d) => <CarteDemande key={d.id} demande={d} classes={classes} />)}
    </div>
  );
}
