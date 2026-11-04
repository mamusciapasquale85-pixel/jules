import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Connexion élève par code personnel.
 * Un compte technique est créé à la volée (eleve-<id>@eleves.jules.local) dont le mot de passe
 * est dérivé du code avec un secret serveur. Le code n'est jamais stocké en clair côté auth.
 */
export async function POST(request: Request) {
  const { code } = (await request.json()) as { code?: string };
  const codeNettoye = (code ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (codeNettoye.length < 6) {
    return NextResponse.json({ erreur: "Code invalide" }, { status: 400 });
  }

  const secret = process.env.ELEVE_AUTH_SECRET;
  if (!secret) return NextResponse.json({ erreur: "Serveur mal configuré" }, { status: 500 });

  const admin = createAdminClient();
  const { data: eleve } = await admin
    .from("eleves")
    .select("id, user_id, actif")
    .eq("code_connexion", codeNettoye)
    .maybeSingle();

  if (!eleve || !eleve.actif) {
    return NextResponse.json({ erreur: "Code inconnu" }, { status: 401 });
  }

  const email = `eleve-${eleve.id}@eleves.jules.local`;
  const motDePasse = createHmac("sha256", secret).update(`${eleve.id}:${codeNettoye}`).digest("hex");

  if (!eleve.user_id) {
    const { data: cree, error } = await admin.auth.admin.createUser({
      email,
      password: motDePasse,
      email_confirm: true,
      user_metadata: { role: "eleve", eleve_id: eleve.id },
    });
    if (error || !cree.user) {
      return NextResponse.json({ erreur: "Impossible de créer le compte" }, { status: 500 });
    }
    await admin.from("eleves").update({ user_id: cree.user.id }).eq("id", eleve.id);
  } else {
    // Le code a pu être renouvelé : on aligne le mot de passe technique.
    await admin.auth.admin.updateUserById(eleve.user_id, { password: motDePasse });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
  if (error) return NextResponse.json({ erreur: "Connexion refusée" }, { status: 401 });

  return NextResponse.json({ ok: true });
}
