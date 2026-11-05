import { createClient } from "@/lib/supabase/server";
import { getProfil } from "@/lib/profil";
import { Marque } from "@/components/marque";
import { OngletsProf } from "@/components/onglets-prof";
import FormulaireProfil from "./formulaire";
import FormulaireAdulte from "./formulaire-adulte";

export default async function PageCreerProfil({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string }>;
}) {
  const { classe: classeParam } = await searchParams;
  const profil = await getProfil();
  if (!profil || profil.kind !== "adulte") return null;

  const supabase = await createClient();
  const { data: classes } = await supabase.from("classes").select("id, nom").order("nom");
  const classeInitiale = classes?.find((c) => c.id === classeParam)?.id ?? classes?.[0]?.id ?? "";

  return (
    <main className="ecran">
      <header className="entete">
        <Marque />
        <h1 style={{ fontSize: 24 }}>Créer un profil</h1>
        <span className="sous">Nouvel élève, rattaché à une de tes classes</span>
      </header>
      <OngletsProf actif="profil" classeId={classeInitiale || undefined} />
      {classes && classes.length > 0 ? (
        <FormulaireProfil classes={classes} classeInitiale={classeInitiale} />
      ) : (
        <div className="contenu">
          <p className="sourdine">Aucune classe : demande à l’éducateur de te rattacher à tes classes.</p>
        </div>
      )}
      <section className="contenu" style={{ paddingTop: 0 }}>
        <h2 className="titre-section">Compte prof ou éducateur</h2>
        {profil.roles.includes("admin") ? (
          <FormulaireAdulte classes={classes ?? []} />
        ) : (
          <p className="sourdine">Réservé à l’administrateur de l’école.</p>
        )}
      </section>
    </main>
  );
}
