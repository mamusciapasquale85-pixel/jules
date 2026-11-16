"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfil } from "@/lib/profil";

export type ResultatValidation = { validees: number; dejaTraitees: number; erreur?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PAR_LOT = 200;

/**
 * Valide les observations encore en attente parmi `ids`.
 * La base vérifie aussi les droits (trigger observation_avant_update) : seuls un
 * éducateur ou un admin peuvent changer le statut.
 */
export async function validerObservations(ids: string[]): Promise<ResultatValidation> {
  const profil = await getProfil();
  const autorise =
    profil?.kind === "adulte" && (profil.roles.includes("educateur") || profil.roles.includes("admin"));
  if (!autorise) {
    return { validees: 0, dejaTraitees: 0, erreur: "La validation est réservée aux éducateurs et aux admins." };
  }

  const propres = [...new Set(ids)].filter((id) => UUID.test(id)).slice(0, MAX_PAR_LOT);
  if (propres.length === 0) return { validees: 0, dejaTraitees: 0, erreur: "Aucune observation sélectionnée." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("observations")
    .update({ statut: "validee" })
    .in("id", propres)
    .eq("statut", "en_attente")
    .eq("grave", false)
    .select("id");

  if (error) return { validees: 0, dejaTraitees: 0, erreur: "Validation refusée : " + error.message };

  const validees = data?.length ?? 0;
  revalidatePath("/educateur");
  revalidatePath("/educateur/validation");
  return { validees, dejaTraitees: propres.length - validees };
}
