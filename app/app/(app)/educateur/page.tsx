import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfil } from "@/lib/profil";
import { PiedCompte } from "@/components/pied-compte";
import { Marque } from "@/components/marque";

type Eleve = { id: string; nom: string; prenom: string; code_connexion: string | null; classe_id: string | null };
type Resume = { pos: number; neg: number; derniere: string | null };

function initiales(prenom: string, nom: string) {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

function dateCourte(iso: string) {
  const d = new Date(iso);
  const hier = new Date();
  hier.setDate(hier.getDate() - 1);
  if (d.toDateString() === new Date().toDateString()) return "aujourd’hui";
  if (d.toDateString() === hier.toDateString()) return "hier";
  return d.toLocaleDateString("fr-BE", { weekday: "long" });
}

// S1-1 … S1-7 d'abord, puis les 2e (2C1, 2D1, 2S1…).
function ordreClasses(a: { nom: string }, b: { nom: string }) {
  const rang = (n: string) => (n.startsWith("S") ? 0 : 1);
  return rang(a.nom) - rang(b.nom) || a.nom.localeCompare(b.nom, "fr", { numeric: true });
}

function LigneEleve({ e, resume, classe }: { e: Eleve; resume?: Resume; classe?: string }) {
  const texte = !resume
    ? "Aucune observation cette semaine"
    : `${resume.pos} positif${resume.pos > 1 ? "s" : ""} · ${resume.neg} à améliorer · dernière ${dateCourte(resume.derniere!)}`;
  return (
    <div className="ligne-eleve" style={{ cursor: "default" }}>
      <span className="avatar">{initiales(e.prenom, e.nom)}</span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          {e.prenom} {e.nom}{classe && <span className="sourdine" style={{ fontWeight: 400 }}> · {classe}</span>}
        </span>
        <span className="sourdine" style={{ fontSize: 12 }}>{texte}</span>
        {e.code_connexion && (
          <details style={{ fontSize: 12 }}>
            <summary style={{ cursor: "pointer", color: "var(--teal-fonce)" }}>Code de connexion</summary>
            <span style={{ fontFamily: "Courier New, monospace", fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>
              {e.code_connexion}
            </span>
          </details>
        )}
      </span>
      {resume && resume.neg >= 2 && <span className="pastille pastille-neg">À suivre</span>}
    </div>
  );
}

export default async function PageEducateur({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; q?: string }>;
}) {
  const { classe: classeParam, q: qBrut } = await searchParams;
  const q = (qBrut ?? "").trim().slice(0, 60);
  const profil = await getProfil();
  if (!profil || profil.kind !== "adulte") return null;
  const estAdmin = profil.roles.includes("admin");

  // RLS : un éducateur ou un admin voit toutes les classes et tous les élèves.
  const supabase = await createClient();
  const { data: brutes } = await supabase.from("classes").select("id, nom, annee");
  const classes = (brutes ?? []).sort(ordreClasses);
  const nomClasse = new Map(classes.map((c) => [c.id, c.nom]));

  let eleves: Eleve[] = [];
  let classe: (typeof classes)[number] | null = null;
  if (q.length >= 2) {
    // Recherche par nom ou prénom, toutes classes confondues. Les % et _ saisis sont neutralisés.
    const motif = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    const { data } = await supabase
      .from("eleves")
      .select("id, nom, prenom, code_connexion, classe_id")
      .eq("actif", true)
      .or(`nom.ilike.${JSON.stringify(motif)},prenom.ilike.${JSON.stringify(motif)}`)
      .order("nom")
      .limit(50);
    eleves = data ?? [];
  } else {
    classe = classes.find((c) => c.id === classeParam) ?? classes[0] ?? null;
    if (classe) {
      const { data } = await supabase
        .from("eleves")
        .select("id, nom, prenom, code_connexion, classe_id")
        .eq("classe_id", classe.id)
        .eq("actif", true)
        .order("nom");
      eleves = data ?? [];
    }
  }

  const depuis = new Date();
  depuis.setDate(depuis.getDate() - 7);
  const { data: obs } = eleves.length
    ? await supabase
        .from("observations")
        .select("eleve_id, sens, observe_le")
        .in("eleve_id", eleves.map((e) => e.id))
        .gte("observe_le", depuis.toISOString())
        .order("observe_le", { ascending: false })
    : { data: [] };
  const parEleve = new Map<string, Resume>();
  for (const o of obs ?? []) {
    const cur = parEleve.get(o.eleve_id) ?? { pos: 0, neg: 0, derniere: null };
    if (o.sens === "positif") cur.pos++; else cur.neg++;
    if (!cur.derniere) cur.derniere = o.observe_le;
    parEleve.set(o.eleve_id, cur);
  }

  return (
    <main className="ecran">
      <header className="entete">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Marque />
          <span className="sous">{profil.prenom} {profil.nom}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 28 }}>{q.length >= 2 ? "Recherche" : classe?.nom ?? "Aucune classe"}</h1>
            <span className="sous">Espace éducateur{classe ? ` · ${classe.annee}` : ""}</span>
          </div>
          {classes.length > 1 && (
            <form method="get" style={{ display: "flex", gap: 6 }}>
              <select
                name="classe"
                defaultValue={classe?.id}
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

      <form method="get" style={{ padding: "14px 20px 0", display: "flex", gap: 8 }}>
        <input
          className="champ"
          name="q"
          defaultValue={q}
          placeholder="Chercher un élève (nom ou prénom)"
          minLength={2}
          maxLength={60}
          style={{ flex: 1 }}
        />
        <button className="bouton" style={{ padding: "0 16px" }}>Chercher</button>
      </form>

      <div className="contenu">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="titre-section">
            {q.length >= 2 ? `${eleves.length} résultat${eleves.length > 1 ? "s" : ""}${eleves.length === 50 ? " (50 max.)" : ""}` : `${eleves.length} élèves`}
          </span>
          {q.length >= 2 ? (
            <Link href={classe ? `/educateur?classe=${classe.id}` : "/educateur"} className="sourdine">Effacer</Link>
          ) : (
            <span className="sourdine">7 derniers jours</span>
          )}
        </div>

        {eleves.map((e) => (
          <LigneEleve
            key={e.id}
            e={e}
            resume={parEleve.get(e.id)}
            classe={q.length >= 2 ? nomClasse.get(e.classe_id ?? "") : undefined}
          />
        ))}
        {q.length >= 2 && eleves.length === 0 && <p className="sourdine">Aucun élève trouvé.</p>}

        <p className="sourdine" style={{ marginTop: 8 }}>
          Les codes de connexion sont personnels : ne les montre qu’à l’élève concerné.
        </p>
        {estAdmin && <Link className="bouton" href="/admin">Comptes adultes</Link>}
        <PiedCompte />
      </div>
    </main>
  );
}
