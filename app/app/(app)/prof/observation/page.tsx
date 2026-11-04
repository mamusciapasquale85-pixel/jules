import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FormulaireObservation, { type Comportement, type EleveCourt } from "./formulaire";

export default async function PageNouvelleObservation({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; eleve?: string }>;
}) {
  const { classe: classeId, eleve: eleveId } = await searchParams;
  const supabase = await createClient();

  const { data: eleves } = classeId
    ? await supabase.from("eleves").select("id, nom, prenom").eq("classe_id", classeId).eq("actif", true).order("nom")
    : { data: [] as EleveCourt[] };

  const { data: comportements } = await supabase
    .from("comportements")
    .select("id, libelle, sens_possible, grave, competence:competences(code, libelle)")
    .eq("actif", true)
    .order("ordre");

  const liste: Comportement[] = (comportements ?? []).map((c) => {
    const comp = Array.isArray(c.competence) ? c.competence[0] : c.competence;
    return {
      id: c.id,
      libelle: c.libelle,
      sensPossible: c.sens_possible as Comportement["sensPossible"],
      grave: c.grave,
      code: comp?.code ?? "",
      competence: comp?.libelle ?? "",
    };
  });

  return (
    <main className="ecran">
      <header className="entete-blanche">
        <Link href={classeId ? `/prof?classe=${classeId}` : "/prof"} aria-label="Retour" className="bouton bouton-secondaire" style={{ width: 44, height: 44, padding: 0 }}>
          ‹
        </Link>
        <div>
          <h1 style={{ fontSize: 20 }}>Nouvelle observation</h1>
          <span className="sourdine">Transmise à l’éducateur. Visible par les parents après validation.</span>
        </div>
      </header>

      <FormulaireObservation
        classeId={classeId ?? ""}
        eleves={(eleves ?? []) as EleveCourt[]}
        eleveInitial={eleveId ?? ""}
        comportements={liste}
      />
    </main>
  );
}
