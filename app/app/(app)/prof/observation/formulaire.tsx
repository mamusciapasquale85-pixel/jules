"use client";

import { useActionState, useMemo, useState } from "react";
import { enregistrerObservation, type EtatObservation } from "./actions";

export type EleveCourt = { id: string; nom: string; prenom: string };
export type Comportement = {
  id: string;
  libelle: string;
  sensPossible: "positif" | "a_ameliorer" | "les_deux";
  grave: boolean;
  code: string;
  competence: string;
};

type Sens = "positif" | "a_ameliorer";

function normaliser(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function FormulaireObservation({
  classeId,
  eleves,
  eleveInitial,
  comportements,
}: {
  classeId: string;
  eleves: EleveCourt[];
  eleveInitial: string;
  comportements: Comportement[];
}) {
  const [etat, action, enCours] = useActionState<EtatObservation, FormData>(enregistrerObservation, {});
  const [eleveId, setEleveId] = useState(eleveInitial);
  const [sens, setSens] = useState<Sens>("a_ameliorer");
  const [recherche, setRecherche] = useState("");
  const [comportementId, setComportementId] = useState("");

  const candidats = useMemo(() => {
    const q = normaliser(recherche.trim());
    return comportements
      .filter((c) => c.sensPossible === "les_deux" || c.sensPossible === sens)
      .filter((c) => !q || normaliser(`${c.code} ${c.competence} ${c.libelle}`).includes(q))
      .slice(0, 12);
  }, [comportements, sens, recherche]);

  const choisi = comportements.find((c) => c.id === comportementId);

  return (
    <form action={action} className="contenu" style={{ gap: 18, paddingBottom: 0 }}>
      <input type="hidden" name="classe_id" value={classeId} />
      <input type="hidden" name="sens" value={sens} />
      <input type="hidden" name="comportement_id" value={comportementId} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="titre-section">1 · Élève</span>
        <select name="eleve_id" className="champ" value={eleveId} onChange={(e) => setEleveId(e.target.value)} required>
          <option value="">Choisir…</option>
          {eleves.map((e) => (
            <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="titre-section">2 · Sens</span>
        <div className="grille-2">
          <button type="button" className="choix" aria-pressed={sens === "positif"} onClick={() => { setSens("positif"); setComportementId(""); }} style={{ justifyContent: "center", fontWeight: 700 }}>
            Positif
          </button>
          <button type="button" className="choix choix-neg" aria-pressed={sens === "a_ameliorer"} onClick={() => { setSens("a_ameliorer"); setComportementId(""); }} style={{ justifyContent: "center", fontWeight: 700 }}>
            À améliorer
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="titre-section">3 · Comportement observé</span>
        <input
          className="champ"
          type="search"
          placeholder="Rechercher (retard, téléphone, aide…)"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        {choisi && (
          <div className="carte" style={{ borderColor: "var(--teal)", borderWidth: 2 }}>
            <span className="sourdine" style={{ fontSize: 12 }}><span className="point-domaine" data-domaine={choisi.code[0]} aria-hidden="true" /><strong>{choisi.code}</strong> · {choisi.competence}</span>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{choisi.libelle}</div>
            {choisi.grave && sens === "a_ameliorer" && (
              <span className="pastille pastille-neg" style={{ marginTop: 6, display: "inline-block" }}>Fait grave · parents prévenus immédiatement</span>
            )}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {candidats.map((c) => (
            <button
              key={c.id}
              type="button"
              className="choix"
              aria-pressed={comportementId === c.id}
              onClick={() => setComportementId(c.id)}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                <span className="sourdine" style={{ fontSize: 12 }}><span className="point-domaine" data-domaine={c.code[0]} aria-hidden="true" /><strong>{c.code}</strong> · {c.competence}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{c.libelle}</span>
              </span>
            </button>
          ))}
          {candidats.length === 0 && <span className="sourdine">Aucun comportement ne correspond.</span>}
        </div>
      </div>

      <label className="etiquette">
        <span className="titre-section">4 · Commentaire (facultatif)</span>
        <textarea className="champ" name="commentaire" maxLength={500} placeholder="Un mot pour l’éducateur ou les parents…" />
      </label>

      <div className="pied" style={{ margin: "0 -20px" }}>
        {etat.erreur && <p className="erreur">{etat.erreur}</p>}
        <button className="bouton bouton-grand" type="submit" disabled={enCours || !eleveId || !comportementId}>
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
