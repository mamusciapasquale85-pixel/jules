import { createAdminClient } from "@/lib/supabase/admin";
import { origineSite } from "@/lib/comptes";

/** Échappe le texte saisi par un visiteur avant de le mettre dans un mail HTML. */
export function echapper(texte: string) {
  return texte.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Envoie un mail par l'API Brevo. Sans clé BREVO_API_KEY, ne fait rien.
 * Ne lève jamais d'erreur : un mail raté ne doit pas bloquer l'action en cours.
 */
export async function envoyerMail(params: { a: { email: string; nom?: string }[]; sujet: string; html: string }): Promise<boolean> {
  const cle = process.env.BREVO_API_KEY;
  if (!cle || params.a.length === 0) return false;
  try {
    const reponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": cle, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Jules", email: process.env.MAIL_EXPEDITEUR ?? "mamuscia.pasquale.85@gmail.com" },
        to: params.a.map((d) => ({ email: d.email, name: d.nom })),
        subject: params.sujet,
        htmlContent: params.html,
      }),
    });
    if (!reponse.ok) console.error("Brevo", reponse.status, await reponse.text());
    return reponse.ok;
  } catch (e) {
    console.error("Brevo", e);
    return false;
  }
}

const PIED = "<p style=\"color:#667085;font-size:13px\">Jules – suivi des élèves de l'École Jules Verne</p>";

/** Préviens les admins actifs qu'une demande de compte attend leur décision. */
export async function prevenirAdminsDemande(d: { prenom: string; nom: string; email: string; role: string; message: string | null }) {
  const { data: admins } = await createAdminClient()
    .from("adultes")
    .select("email, prenom, nom")
    .contains("roles", ["admin"])
    .eq("actif", true);
  const role = d.role === "prof" ? "prof" : "éducateur";
  await envoyerMail({
    a: (admins ?? []).map((a) => ({ email: a.email, nom: `${a.prenom} ${a.nom}` })),
    sujet: `Jules – Nouvelle demande de compte : ${d.prenom} ${d.nom}`,
    html: `<h2>Nouvelle demande de compte</h2>
<p><strong>${echapper(d.prenom)} ${echapper(d.nom)}</strong> (${echapper(d.email)}) demande un compte <strong>${role}</strong>.</p>
${d.message ? `<p>Message : « ${echapper(d.message)} »</p>` : ""}
<p><a href="${await origineSite()}/admin">Voir les demandes en attente</a></p>${PIED}`,
  });
}

/** Accusé de réception envoyé à la personne qui demande un compte. */
export async function confirmerDemande(d: { prenom: string; email: string }) {
  await envoyerMail({
    a: [{ email: d.email, nom: d.prenom }],
    sujet: "Jules – Ta demande de compte est bien reçue",
    html: `<h2>Demande reçue</h2>
<p>Bonjour ${echapper(d.prenom)},</p>
<p>Ta demande de compte pour Jules est bien arrivée. L'administrateur de l'école doit maintenant la valider.</p>
<p>Dès qu'elle sera acceptée, tu recevras un autre e-mail pour choisir ton mot de passe.</p>
<p>Si tu n'as rien demandé, ignore ce message.</p>${PIED}`,
  });
}
