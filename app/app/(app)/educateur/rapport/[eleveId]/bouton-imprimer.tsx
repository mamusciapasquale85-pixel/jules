"use client";

/** Ouvre la boîte d'impression du navigateur : « Enregistrer en PDF » y est proposé. */
export function BoutonImprimer() {
  return (
    <button type="button" className="bouton bouton-secondaire" style={{ height: 40, padding: "0 14px" }} onClick={() => window.print()}>
      Imprimer / PDF
    </button>
  );
}
