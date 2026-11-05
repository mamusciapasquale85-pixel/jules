"use client";

import { useActionState } from "react";
import { changerAccesAdmin, type EtatDecision } from "./actions";

export type MembreEquipe = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  roles: string[];
  actif: boolean;
};

const LIBELLES: Record<string, string> = { prof: "Prof", educateur: "Éducateur", admin: "Admin" };

function Ligne({ membre, estMoi }: { membre: MembreEquipe; estMoi: boolean }) {
  const [etat, action, enCours] = useActionState<EtatDecision, FormData>(changerAccesAdmin, {});
  const estAdmin = membre.roles.includes("admin");

  return (
    <div style={{ border: "1px solid var(--bord)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <strong>{membre.prenom} {membre.nom}</strong>{estMoi && " (toi)"}
        <div className="sourdine">
          {membre.email} · {membre.roles.map((r) => LIBELLES[r] ?? r).join(", ")}{!membre.actif && " · désactivé"}
        </div>
      </div>
      {!estMoi && (
        <form action={action}>
          <input type="hidden" name="id" value={membre.id} />
          <input type="hidden" name="action" value={estAdmin ? "retirer" : "donner"} />
          <button
            className={estAdmin ? "bouton bouton-secondaire" : "bouton"}
            type="submit"
            disabled={enCours}
            style={{ width: "100%", height: 40, fontSize: 14 }}
          >
            {enCours ? "…" : estAdmin ? "Retirer l’accès admin" : "Donner l’accès admin"}
          </button>
        </form>
      )}
      {etat.info && <p className="succes" role="status">{etat.info}</p>}
      {etat.erreur && <p className="erreur">{etat.erreur}</p>}
    </div>
  );
}

export default function ListeEquipe({ membres, moiId }: { membres: MembreEquipe[]; moiId: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p className="sourdine">
        Un admin voit tous les élèves, valide les demandes de compte et peut donner ou retirer l’accès admin.
      </p>
      {membres.map((m) => <Ligne key={m.id} membre={m} estMoi={m.id === moiId} />)}
    </div>
  );
}
