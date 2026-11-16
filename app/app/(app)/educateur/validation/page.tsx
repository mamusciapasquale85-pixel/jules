import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfil } from "@/lib/profil";
import { PiedCompte } from "@/components/pied-compte";
import { Marque } from "@/components/marque";
import ListeValidation, { type LigneValidation } from "./liste";

const MAX_LIGNES = 200;

type Brute = {
  id: string;
  sens: string;
  commentaire: string | null;
  observe_le: string;
  eleve: { nom: string; prenom: string; classe_id: string | null } | null;
  comportement: { libelle: string } | null;
  auteur: { nom: string; prenom: string } | null;
};

export default async function PageValidation() {
  const profil = await getProfil();
  if (!profil || profil.kind !== "adulte") return null;

  // RLS : un éducateur ou un admin lit toutes les observations.
  const supabase = await createClient();
  const [{ data: classes }, { data: brutes, error }] = await Promise.all([
    supabase.from("classes").select("id, nom"),
    supabase
      .from("observations")
      .select(
        "id, sens, commentaire, observe_le, eleve:eleves(nom, prenom, classe_id), comportement:comportements(libelle), auteur:adultes!auteur_id(nom, prenom)"
      )
      .eq("statut", "en_attente")
      .eq("grave", false) // les faits graves ne passent pas par la file
      .order("observe_le", { ascending: true })
      .limit(MAX_LIGNES),
  ]);

  const nomClasse = new Map((classes ?? []).map((c) => [c.id, c.nom]));
  const lignes: LigneValidation[] = ((brutes ?? []) as unknown as Brute[]).map((o) => ({
    id: o.id,
    sens: o.sens,
    commentaire: o.commentaire,
    observeLe: o.observe_le,
    eleve: o.eleve ? `${o.eleve.prenom} ${o.eleve.nom}` : "Élève inconnu",
    classe: (o.eleve?.classe_id && nomClasse.get(o.eleve.classe_id)) || "—",
    prof: o.auteur ? `${o.auteur.prenom} ${o.auteur.nom}` : "—",
    comportement: o.comportement?.libelle ?? "—",
  }));

  return (
    <main className="ecran">
      <header className="entete">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Marque />
          <span className="sous">{profil.prenom} {profil.nom}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 28 }}>Validation</h1>
            <span className="sous">Observations en attente · de la plus ancienne à la plus récente</span>
          </div>
          <Link href="/educateur" className="sous" style={{ color: "#fff" }}>← Classes</Link>
        </div>
      </header>

      <div className="contenu">
        {error && <p className="erreur">Lecture impossible : {error.message}</p>}
        {!error && lignes.length === MAX_LIGNES && (
          <p className="sourdine">Seules les {MAX_LIGNES} plus anciennes sont affichées.</p>
        )}
        {!error && <ListeValidation lignes={lignes} />}
        <PiedCompte />
      </div>
    </main>
  );
}
