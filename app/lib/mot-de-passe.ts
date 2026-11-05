/** Règles communes aux formulaires de mot de passe. */
export const LONGUEUR_MIN = 10;

export function verifierNouveau(motDePasse: string, confirmation: string): string | null {
  if (motDePasse.length < LONGUEUR_MIN) return `Au moins ${LONGUEUR_MIN} caractères.`;
  if (motDePasse.length > 72) return "72 caractères maximum.";
  if (motDePasse !== confirmation) return "Les deux mots de passe ne sont pas identiques.";
  return null;
}

/**
 * Vrai si la session vient d'un lien « mot de passe oublié » ouvert il y a moins de 15 minutes.
 * Supabase l'indique dans le jeton (champ amr, méthode « recovery » ou « otp »).
 */
export function sessionDeRecuperation(accessToken: string | undefined): boolean {
  if (!accessToken) return false;
  try {
    const charge = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"));
    const limite = Date.now() / 1000 - 15 * 60;
    return Array.isArray(charge.amr) && charge.amr.some(
      (a: { method?: string; timestamp?: number }) =>
        (a.method === "recovery" || a.method === "otp") && (a.timestamp ?? 0) >= limite,
    );
  } catch {
    return false;
  }
}
