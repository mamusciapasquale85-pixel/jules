"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { EtatMotDePasse } from "./actions";
import { LONGUEUR_MIN } from "@/lib/mot-de-passe";

type Action = (prev: EtatMotDePasse, formData: FormData) => Promise<EtatMotDePasse>;

export default function FormulaireMotDePasse({ action: actionServeur, avecAncien }: { action: Action; avecAncien: boolean }) {
  const [etat, action, enCours] = useActionState<EtatMotDePasse, FormData>(actionServeur, {});

  if (etat.ok) {
    return (
      <div className="contenu" style={{ gap: 16 }}>
        <p className="succes" role="status">Mot de passe changé.</p>
        <Link className="bouton bouton-grand" href="/">Continuer</Link>
      </div>
    );
  }

  return (
    <form action={action} className="contenu" style={{ gap: 16 }}>
      {avecAncien && (
        <label className="etiquette">
          Mot de passe actuel
          <input className="champ" type="password" name="ancien" autoComplete="current-password" required />
        </label>
      )}
      <label className="etiquette">
        Nouveau mot de passe
        <input className="champ" type="password" name="nouveau" autoComplete="new-password" minLength={LONGUEUR_MIN} maxLength={72} required />
      </label>
      <label className="etiquette">
        Confirme le nouveau mot de passe
        <input className="champ" type="password" name="confirmation" autoComplete="new-password" minLength={LONGUEUR_MIN} maxLength={72} required />
      </label>
      <p className="sourdine">Au moins {LONGUEUR_MIN} caractères.</p>
      {etat.erreur && <p className="erreur">{etat.erreur}</p>}
      <button className="bouton bouton-grand" type="submit" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
      {avecAncien && <Link className="bouton bouton-secondaire bouton-grand" href="/">Annuler</Link>}
    </form>
  );
}
