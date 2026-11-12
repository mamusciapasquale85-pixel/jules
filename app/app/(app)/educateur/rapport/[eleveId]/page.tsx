import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfil } from "@/lib/profil";
import { Marque } from "@/components/marque";
import { BoutonImprimer } from "./bouton-imprimer";

type Niveau = "pas_encore" | "en_progres" | "acquis" | "exemplaire";

const LIBELLE_NIVEAU: Record<Niveau, string> = {
  pas_encore: "Pas encore",
  en_progres: "En progrès",
  acquis: "Acquis",
  exemplaire: "Exemplaire",
};

type Ligne = {
  domaineCode: string;
  domaine: string;
  domaineOrdre: number;
  code: string;
  competence: string;
  ordre: number;
  pos: number;
  neg: number;
};

/** 1er septembre de l'année scolaire qui contient la date. */
function rentreePour(d: Date) {
  const annee = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return new Date(annee, 8, 1);
}

/** Même formule que la vue v_niveau_adultes, appliquée à toute la période. */
function niveauPour(pos: number, neg: number): Niveau | null {
  const total = pos + neg;
  if (total === 0) return null;
  const r = pos / total;
  if (r < 0.34) return "pas_encore";
  if (r < 0.67) return "en_progres";
  if (r < 0.9) return "acquis";
  return "exemplaire";
}

function dateLongue(d: Date) {
  return d.toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" });
}

function dateISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function PageRapport({
  params,
  searchParams,
}: {
  params: Promise<{ eleveId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { eleveId } = await params;
  const { date: dateParam } = await searchParams;
  const profil = await getProfil();
  if (!profil || profil.kind !== "adulte") return null;

  const supabase = await createClient();

  const { data: eleve } = await supabase
    .from("eleves")
    .select("id, nom, prenom, date_naissance, classe:classes(nom, annee)")
    .eq("id", eleveId)
    .maybeSingle();
  if (!eleve) notFound();
  const classe = Array.isArray(eleve.classe) ? eleve.classe[0] : eleve.classe;

  // Date demandée : aujourd'hui par défaut, jamais dans le futur.
  const aujourdHui = new Date();
  aujourdHui.setHours(23, 59, 59, 999);
  let fin = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? new Date(dateParam + "T23:59:59") : aujourdHui;
  if (isNaN(fin.getTime()) || fin > aujourdHui) fin = aujourdHui;
  const debut = rentreePour(fin);

  // Référentiel complet, pour afficher aussi les compétences sans observation.
  const { data: competences } = await supabase
    .from("competences")
    .select("id, code, libelle, ordre, domaine:domaines(code, libelle, ordre)")
    .eq("actif", true)
    .order("ordre");

  // Observations validées de la période.
  const { data: obs } = await supabase
    .from("observations")
    .select("sens, grave, comportement:comportements(competence_id)")
    .eq("eleve_id", eleveId)
    .in("statut", ["validee", "corrigee"])
    .gte("observe_le", debut.toISOString())
    .lte("observe_le", fin.toISOString());

  const compteur = new Map<string, { pos: number; neg: number }>();
  let totalPos = 0, totalNeg = 0, totalGraves = 0;
  for (const o of obs ?? []) {
    const cp = Array.isArray(o.comportement) ? o.comportement[0] : o.comportement;
    const cid = cp?.competence_id;
    if (!cid) continue;
    const c = compteur.get(cid) ?? { pos: 0, neg: 0 };
    if (o.sens === "positif") { c.pos++; totalPos++; } else { c.neg++; totalNeg++; if (o.grave) totalGraves++; }
    compteur.set(cid, c);
  }

  const lignes: Ligne[] = (competences ?? []).map((c) => {
    const d = Array.isArray(c.domaine) ? c.domaine[0] : c.domaine;
    const n = compteur.get(c.id) ?? { pos: 0, neg: 0 };
    return {
      domaineCode: d?.code ?? "", domaine: d?.libelle ?? "", domaineOrdre: d?.ordre ?? 0,
      code: c.code, competence: c.libelle, ordre: c.ordre, pos: n.pos, neg: n.neg,
    };
  });

  // Regroupement par domaine, dans l'ordre du référentiel.
  const domaines = new Map<string, { libelle: string; ordre: number; lignes: Ligne[]; pos: number; neg: number }>();
  for (const l of lignes) {
    const d = domaines.get(l.domaineCode) ?? { libelle: l.domaine, ordre: l.domaineOrdre, lignes: [], pos: 0, neg: 0 };
    d.lignes.push(l); d.pos += l.pos; d.neg += l.neg;
    domaines.set(l.domaineCode, d);
  }
  const listeDomaines = [...domaines.values()].sort((a, b) => a.ordre - b.ordre);

  // Points forts et points d'attention : compétences les plus observées dans chaque sens.
  const observees = lignes.filter((l) => l.pos + l.neg > 0);
  const forts = [...observees].filter((l) => niveauPour(l.pos, l.neg) === "exemplaire" || niveauPour(l.pos, l.neg) === "acquis")
    .sort((a, b) => b.pos - a.pos).slice(0, 3);
  const attention = [...observees].filter((l) => niveauPour(l.pos, l.neg) === "pas_encore" || niveauPour(l.pos, l.neg) === "en_progres")
    .sort((a, b) => b.neg - a.neg).slice(0, 3);

  const retour = classe ? `/educateur?classe=${(eleve as { classe_id?: string }).classe_id ?? ""}` : "/educateur";

  return (
    <main className="ecran rapport">
      {/* Barre d'outils : masquée à l'impression */}
      <header className="entete-blanche sans-impression" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/educateur" aria-label="Retour" className="bouton bouton-secondaire" style={{ width: 44, height: 44, padding: 0 }}>‹</Link>
          <div>
            <h1 style={{ fontSize: 20 }}>Rapport final</h1>
            <span className="sourdine">{eleve.prenom} {eleve.nom}</span>
          </div>
        </div>
        <form method="get" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label className="sourdine" htmlFor="date">Jusqu’au</label>
          <input id="date" name="date" type="date" className="champ" defaultValue={dateISO(fin)} max={dateISO(aujourdHui)} style={{ height: 40, width: "auto" }} />
          <button className="bouton" style={{ height: 40, padding: "0 14px" }}>Afficher</button>
          <BoutonImprimer />
        </form>
      </header>

      {/* Feuille imprimable */}
      <article className="feuille">
        <div className="feuille-entete">
          <Marque />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--police-titre)", fontWeight: 700, fontSize: 22 }}>Rapport de compétences</div>
            <div className="sourdine">Du {dateLongue(debut)} au {dateLongue(fin)}</div>
          </div>
        </div>

        <section className="feuille-identite">
          <div><span className="sourdine">Élève</span><strong>{eleve.prenom} {eleve.nom}</strong></div>
          <div><span className="sourdine">Classe</span><strong>{classe?.nom ?? "—"}</strong></div>
          <div><span className="sourdine">Année scolaire</span><strong>{classe?.annee ?? `${debut.getFullYear()}-${debut.getFullYear() + 1}`}</strong></div>
          <div><span className="sourdine">Observations validées</span><strong>{totalPos + totalNeg}</strong></div>
        </section>

        <section className="feuille-chiffres">
          <div className="chiffre"><span className="grand" style={{ color: "var(--teal)" }}>{totalPos}</span><span>points positifs</span></div>
          <div className="chiffre"><span className="grand" style={{ color: "var(--orange-fonce)" }}>{totalNeg}</span><span>à améliorer</span></div>
          <div className="chiffre"><span className="grand">{totalGraves}</span><span>fait{totalGraves > 1 ? "s" : ""} grave{totalGraves > 1 ? "s" : ""}</span></div>
          <div className="chiffre"><span className="grand">{totalPos + totalNeg ? Math.round((totalPos / (totalPos + totalNeg)) * 100) : 0} %</span><span>de positif</span></div>
        </section>

        {(forts.length > 0 || attention.length > 0) && (
          <section className="feuille-points">
            <div>
              <h2>Points forts</h2>
              {forts.length === 0 ? <p className="sourdine">Pas encore assez d’observations.</p> : (
                <ul>{forts.map((l) => <li key={l.code}><strong>{l.code}</strong> {l.competence} <span className="sourdine">({l.pos} positif{l.pos > 1 ? "s" : ""})</span></li>)}</ul>
              )}
            </div>
            <div>
              <h2>Points d’attention</h2>
              {attention.length === 0 ? <p className="sourdine">Rien à signaler.</p> : (
                <ul>{attention.map((l) => <li key={l.code}><strong>{l.code}</strong> {l.competence} <span className="sourdine">({l.neg} à améliorer)</span></li>)}</ul>
              )}
            </div>
          </section>
        )}

        <section>
          <h2 style={{ marginBottom: 8 }}>Bilan par compétence</h2>
          <table className="tableau-bilan">
            <thead>
              <tr>
                <th style={{ width: 48 }}>Code</th>
                <th>Compétence</th>
                <th style={{ width: 70, textAlign: "right" }}>Positif</th>
                <th style={{ width: 90, textAlign: "right" }}>À améliorer</th>
                <th style={{ width: 110 }}>Niveau</th>
              </tr>
            </thead>
            {listeDomaines.map((d) => (
              <tbody key={d.libelle}>
                <tr className="ligne-domaine">
                  <td colSpan={2}>{d.libelle}</td>
                  <td style={{ textAlign: "right" }}>{d.pos}</td>
                  <td style={{ textAlign: "right" }}>{d.neg}</td>
                  <td></td>
                </tr>
                {d.lignes.map((l) => {
                  const n = niveauPour(l.pos, l.neg);
                  return (
                    <tr key={l.code}>
                      <td className="sourdine" style={{ fontWeight: 700 }}>{l.code}</td>
                      <td>{l.competence}</td>
                      <td style={{ textAlign: "right" }}>{l.pos || "·"}</td>
                      <td style={{ textAlign: "right" }}>{l.neg || "·"}</td>
                      <td>{n ? <span className={`niveau niveau-${n}`}>{LIBELLE_NIVEAU[n]}</span> : <span className="sourdine">Non observé</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
          <p className="sourdine" style={{ fontSize: 11, marginTop: 8 }}>
            Niveau calculé sur la part de positif parmi les observations validées de la période : moins de 34 % → Pas encore ; moins de 67 % → En progrès ; moins de 90 % → Acquis ; au-delà → Exemplaire.
          </p>
        </section>

        <section className="feuille-signatures">
          <div><span>L’éducateur·rice</span></div>
          <div><span>La direction</span></div>
          <div><span>Les parents</span></div>
        </section>

        <footer className="sourdine" style={{ fontSize: 10, marginTop: 12 }}>
          Généré le {dateLongue(new Date())} par {profil.prenom} {profil.nom} · Jules, École Jules Verne. Document confidentiel.
        </footer>
      </article>
    </main>
  );
}
