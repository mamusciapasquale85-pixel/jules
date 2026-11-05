import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfil } from "@/lib/profil";
import { PiedCompte } from "@/components/pied-compte";
import { Marque } from "@/components/marque";
import FormulaireAdulte from "../prof/profil/formulaire-adulte";
import ListeDemandes, { type Demande } from "./demandes";
import ListeEquipe, { type MembreEquipe } from "./equipe";

export default async function PageAdmin() {
  const profil = await getProfil();
  if (!profil || profil.kind !== "adulte") return null;

  // RLS : l'admin voit toutes les classes et toutes les demandes.
  const supabase = await createClient();
  const [{ data: classes }, { data: demandes }, { data: equipe }, { data: liens }] = await Promise.all([
    supabase.from("classes").select("id, nom").order("nom"),
    supabase
      .from("demandes_compte")
      .select("id, prenom, nom, email, role, message, created_at")
      .eq("statut", "en_attente")
      .order("created_at"),
    supabase.from("adultes").select("id, prenom, nom, email, roles, actif").order("nom"),
    supabase.from("adultes_classes").select("adulte_id, classe_id"),
  ]);
  const membres: MembreEquipe[] = (equipe ?? []).map((a) => ({
    ...(a as Omit<MembreEquipe, "classeIds">),
    classeIds: (liens ?? []).filter((l) => l.adulte_id === a.id).map((l) => l.classe_id),
  }));

  return (
    <main className="ecran">
      <header className="entete">
        <Marque />
        <h1 style={{ fontSize: 24 }}>Comptes adultes</h1>
        <span className="sous">Demandes, équipe et création de comptes</span>
      </header>
      <div className="contenu">
        <h2 className="titre-section">Demandes en attente ({demandes?.length ?? 0})</h2>
        <ListeDemandes demandes={(demandes ?? []) as Demande[]} classes={classes ?? []} />

        <h2 className="titre-section" style={{ marginTop: 16 }}>Équipe ({equipe?.length ?? 0})</h2>
        <ListeEquipe membres={membres} moiId={profil.id} classes={classes ?? []} />

        <h2 className="titre-section" style={{ marginTop: 16 }}>Créer un compte directement</h2>
        <FormulaireAdulte classes={classes ?? []} />
        {profil.roles.includes("prof") && (
          <Link className="bouton bouton-secondaire" href="/prof">Retour à mes classes</Link>
        )}
        <Link className="bouton bouton-secondaire" href="/educateur">Tous les élèves</Link>
        <PiedCompte />
      </div>
    </main>
  );
}
