/** Libellés français des statuts et du sens d'une observation. */

export type StatutObservation = "en_attente" | "validee" | "refusee" | "corrigee" | "retiree";
export type SensObservation = "positif" | "a_ameliorer";

const STATUTS: Record<StatutObservation, string> = {
  en_attente: "En attente",
  validee: "Validée",
  refusee: "Refusée",
  corrigee: "Validée (corrigée)",
  retiree: "Retirée",
};

const SENS: Record<SensObservation, string> = {
  positif: "Positif",
  a_ameliorer: "À améliorer",
};

export function libelleStatut(statut: string): string {
  return STATUTS[statut as StatutObservation] ?? statut;
}

export function libelleSens(sens: string): string {
  return SENS[sens as SensObservation] ?? sens;
}
