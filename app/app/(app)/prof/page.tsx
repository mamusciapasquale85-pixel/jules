import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfil } from "@/lib/profil";
import { PiedCompte } from "@/components/pied-compte";
import { Marque } from "@/components/marque";
import { OngletsProf } from "@/components/onglets-prof";

function initiales(prenom: string, nom: string) {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

function dateCourte(iso: string) {
  const d = new Date(iso);
  const aujourdHui = new Date();
  const hier = new Date();
  hier.setDate(hier.getDate() - 1);
  if (d.toDateString() === aujourdHui.toDateString()) return "aujourd’hui";
  if (d.toDateString() === hier.toDateString()) return "hier";
  return d.toLocaleDateString("fr-BE", { weekday: "long" });
}

export default async function PageMaClasse({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string }>;
}) {
  const { classe: classeParam } = await searchParams;
  const supabase = await createClient();
  const profil = await getProfil();
  if (!profil || profil.kind !== "adulte") return null;

  // Classes du prof (RLS : seulement les siennes).
  const { data: classes } = await supabase
    .from("classes")
    .select("id, nom, annee")
    .order("nom");

  const classeId = classeParam ?? classes?.[0]?.id ?? null;
  const classe = classes?.find((c) => c.id === classeId) ?? null;

  if (!classe) {
    return (
      <main className="ecran">
        <header className="entete">
          <Marque />
          <h1 style={{ fontSize: 24 }}>Aucune classe</h1>
          <span className="sous">Demande à l’éducateur de te rattacher à tes classes.</span>
        </header>
        <OngletsProf actif="classe" />
        <div className="contenu">
          <PiedCompte />
        </div>
      </main>
    );
  }

  const { data: eleves } = await supabase
    .from("eleves")
    .select("id, nom, prenom")
    .eq("classe_id", classe.id)
    .eq("actif", true)
    .order("nom");

  // Dernière observation de la semaine par élève (RLS : celles de ses classes).
  const depuis = new Date();
  depuis.setDate(depuis.getDate() - 7);
  const { data: obs } = await supabase
    .from("observations")
    .select("eleve_id, sens, observe_le")
    .in("eleve_id", (eleves ?? []).map((e) => e.id))
    .gte("observe_le", depuis.toISOString())
    .order("observe_le", { ascending: false });

  const parEleve = new Map<string, { pos: number; neg: number; derniere: { sens: string; observe_le: string } | null }>();
  for (const o of obs ?? []) {
    const cur = parEleve.get(o.eleve_id) ?? { pos: 0, neg: 0, derniere: null };
    if (o.sens === "positif") cur.pos++; else cur.neg++;
    if (!cur.derniere) cur.derniere = { sens: o.sens, observe_le: o.observe_le };
    parEleve.set(o.eleve_id, cur);
  }

  return (
    <main className="ecran">
      <header className="entete">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Marque />
          <span className="sous">{profil.prenom} {profil.nom}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 28 }}>{classe.nom}</h1>
            <span className="sous">{classe.annee}</span>
          </div>
          {classes && classes.length > 1 && (
            <form method="get" style={{ display: "flex", gap: 6 }}>
              <select
                name="classe"
                defaultValue={classe.id}
                className="champ"
                style={{ height: 40, width: "auto", background: "var(--marine-2)", color: "#fff", border: "1px solid #4a5e85" }}
              >
                {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <button className="bouton" style={{ height: 40, padding: "0 12px", background: "var(--marine-2)" }}>OK</button>
            </form>
          )}
        </div>
      </header>

      <OngletsProf actif="classe" classeId={classe.id} />

      <div style={{ padding: "14px 20px 0", display: "flex", gap: 8 }}>
        <Link href={`/prof/observation?classe=${classe.id}`} className="bouton" style={{ flex: 1 }}>
          + Noter une observation
        </Link>
      </div>

      <div className="contenu">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="titre-section">{eleves?.length ?? 0} élèves</span>
          <span className="sourdine">7 derniers jours</span>
        </div>

        {(eleves ?? []).map((e) => {
          const s = parEleve.get(e.id);
          const resume = !s
            ? "Aucune observation cette semaine"
            : `${s.pos} positif${s.pos > 1 ? "s" : ""} · ${s.neg} à améliorer · dernière ${dateCourte(s.derniere!.observe_le)}`;
          return (
            <Link key={e.id} href={`/prof/observation?classe=${classe.id}&eleve=${e.id}`} className="ligne-eleve">
              <span className="avatar">{initiales(e.prenom, e.nom)}</span>
              <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{e.prenom} {e.nom}</span>
                <span className="sourdine" style={{ fontSize: 12 }}>{resume}</span>
              </span>
              {s && s.neg >= 2 && <span className="pastille pastille-neg">À suivre</span>}
              <span aria-hidden="true" style={{ color: "#9aa3b2" }}>›</span>
            </Link>
          );
        })}

        <PiedCompte />
      </div>
    </main>
  );
}
