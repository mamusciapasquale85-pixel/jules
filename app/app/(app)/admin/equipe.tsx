"use client";

import { useActionState } from "react";
import { changerAccesAdmin, changerClasses, type EtatDecision } from "./actions";
import type { ClasseCourte } from "../prof/profil/formulaire";

export type MembreEquipe = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  roles: string[];
  actif: boolean;
  classeIds: string[];
};

const LIBELLES: Record<string, string> = { prof: "Prof", educateur: "Éducateur", admin: "Admin" };

function Ligne({ membre, estMoi, classes }: { membre: MembreEquipe; estMoi: boolean; classes: ClasseCourte[] }) {
  const [etatAdmin, actionAdmin, enCoursAdmin] = useActionState<EtatDecision, FormData>(changerAccesAdmin, {});
  const [etatClasses, actionClasses, enCoursClasses] = useActionState<EtatDecision, FormData>(changerClasses, {});
  const estAdmin = membre.roles.includes("admin");
  const estProf = membre.roles.includes("prof");
  const nomsClasses = classes.filter((c) => membre.classeIds.includes(c.id)).map((c) => c.nom);

  return (
    <div style={{ border: "1px solid var(--bord)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <strong>{membre.prenom} {membre.nom}</strong>{estMoi && " (toi)"}
        <div className="sourdine">
          {membre.email} · {membre.roles.map((r) => LIBELLES[r] ?? r).join(", ")}{!membre.actif && " · désactivé"}
        </div>
        {estProf && (
          <div className="sourdine">Classes : {nomsClasses.length > 0 ? nomsClasses.join(", ") : "aucune"}</div>
        )}
      </div>

      {estProf && classes.length > 0 && (
        <details>
          <summary style={{ cursor: "pointer", fontSize: 14, color: "var(--teal-fonce)" }}>Modifier ses classes</summary>
          <form action={actionClasses} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <input type="hidden" name="id" value={membre.id} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {classes.map((c) => (
                <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15 }}>
                  <input type="checkbox" name="classes" value={c.id} defaultChecked={membre.classeIds.includes(c.id)} />
                  {c.nom}
                </label>
              ))}
            </div>
            <button className="bouton" type="submit" disabled={enCoursClasses} style={{ height: 40, fontSize: 14 }}>
              {enCoursClasses ? "Enregistrement…" : "Enregistrer les classes"}
            </button>
          </form>
        </details>
      )}
      {etatClasses.info && <p className="succes" role="status">{etatClasses.info}</p>}
      {etatClasses.erreur && <p className="erreur">{etatClasses.erreur}</p>}

      {!estMoi && (
        <form action={actionAdmin}>
          <input type="hidden" name="id" value={membre.id} />
          <input type="hidden" name="action" value={estAdmin ? "retirer" : "donner"} />
          <button
            className={estAdmin ? "bouton bouton-secondaire" : "bouton"}
            type="submit"
            disabled={enCoursAdmin}
            style={{ width: "100%", height: 40, fontSize: 14 }}
          >
            {enCoursAdmin ? "…" : estAdmin ? "Retirer l’accès admin" : "Donner l’accès admin"}
          </button>
        </form>
      )}
      {etatAdmin.info && <p className="succes" role="status">{etatAdmin.info}</p>}
      {etatAdmin.erreur && <p className="erreur">{etatAdmin.erreur}</p>}
    </div>
  );
}

export default function ListeEquipe({ membres, moiId, classes }: { membres: MembreEquipe[]; moiId: string; classes: ClasseCourte[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p className="sourdine">
        Un admin voit tous les élèves, valide les demandes de compte et peut donner ou retirer l’accès admin.
        Un prof ne voit que les élèves de ses classes.
      </p>
      {membres.map((m) => <Ligne key={m.id} membre={m} estMoi={m.id === moiId} classes={classes} />)}
    </div>
  );
}
