"use client";

import { useState, useTransition } from "react";
import { libelleSens } from "@/lib/statuts";
import { validerObservations, type ResultatValidation } from "./actions";

export type LigneValidation = {
  id: string;
  sens: string;
  commentaire: string | null;
  observeLe: string;
  eleve: string;
  classe: string;
  prof: string;
  comportement: string;
};

function dateLisible(iso: string) {
  return new Date(iso).toLocaleString("fr-BE", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

function pluriel(n: number, mot: string) {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}

function messageResultat(r: ResultatValidation) {
  const parties: string[] = [];
  if (r.validees > 0) parties.push(`${pluriel(r.validees, "observation")} validée${r.validees > 1 ? "s" : ""}.`);
  if (r.dejaTraitees > 0) {
    parties.push(
      r.dejaTraitees > 1
        ? `${r.dejaTraitees} observations avaient déjà été traitées.`
        : "1 observation avait déjà été traitée."
    );
  }
  return parties.join(" ");
}

export default function ListeValidation({ lignes }: { lignes: LigneValidation[] }) {
  const [cochees, setCochees] = useState<Set<string>>(new Set());
  const [resultat, setResultat] = useState<ResultatValidation | null>(null);
  const [enCours, demarrer] = useTransition();

  if (lignes.length === 0) {
    return (
      <>
        {resultat && !resultat.erreur && <p className="succes" role="status">{messageResultat(resultat)}</p>}
        <p className="sourdine">Aucune observation en attente.</p>
      </>
    );
  }

  // Ne garde que les cases encore présentes dans la liste.
  const selection = lignes.filter((l) => cochees.has(l.id)).map((l) => l.id);
  const toutCoche = selection.length === lignes.length;

  function basculer(id: string) {
    setCochees((avant) => {
      const apres = new Set(avant);
      if (apres.has(id)) apres.delete(id);
      else apres.add(id);
      return apres;
    });
  }

  function valider(ids: string[]) {
    setResultat(null);
    demarrer(async () => {
      const r = await validerObservations(ids);
      setResultat(r);
      if (!r.erreur) setCochees(new Set());
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="barre-validation">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={toutCoche}
            onChange={() => setCochees(toutCoche ? new Set() : new Set(lignes.map((l) => l.id)))}
          />
          Tout cocher
        </label>
        <button
          className="bouton"
          type="button"
          disabled={enCours || selection.length === 0}
          onClick={() => valider(selection)}
        >
          {enCours ? "Validation…" : `Valider la sélection (${selection.length})`}
        </button>
      </div>

      {resultat?.erreur && <p className="erreur" role="alert">{resultat.erreur}</p>}
      {resultat && !resultat.erreur && <p className="succes" role="status">{messageResultat(resultat)}</p>}

      {lignes.map((l) => (
        <div key={l.id} className="ligne-obs">
          <input
            type="checkbox"
            checked={cochees.has(l.id)}
            onChange={() => basculer(l.id)}
            aria-label={`Sélectionner l’observation de ${l.eleve}`}
          />
          <div className="ligne-obs-texte">
            <span style={{ fontSize: 15, fontWeight: 700 }}>
              {l.eleve} <span className="sourdine" style={{ fontWeight: 400 }}>· {l.classe}</span>
            </span>
            <span style={{ fontSize: 14 }}>
              <span className={`pastille ${l.sens === "positif" ? "pastille-pos" : "pastille-neg"}`}>
                {libelleSens(l.sens)}
              </span>{" "}
              {l.comportement}
            </span>
            {l.commentaire && <span style={{ fontSize: 14 }}>« {l.commentaire} »</span>}
            <span className="sourdine" style={{ fontSize: 12 }}>
              {l.prof} · {dateLisible(l.observeLe)}
            </span>
          </div>
          <button
            className="bouton bouton-secondaire"
            type="button"
            disabled={enCours}
            onClick={() => valider([l.id])}
            style={{ height: 36, padding: "0 12px", fontSize: 13 }}
          >
            Valider
          </button>
        </div>
      ))}
    </div>
  );
}
