import Link from "next/link";

export function OngletsProf({ actif, classeId, educateur = false }: { actif: "classe" | "profil" | "eleves"; classeId?: string; educateur?: boolean }) {
  const suffixe = classeId ? `?classe=${classeId}` : "";
  return (
    <nav className="onglets" aria-label="Sections prof">
      <Link href={`/prof${suffixe}`} aria-current={actif === "classe" ? "page" : undefined}>Ma classe</Link>
      <Link href={`/prof/profil${suffixe}`} aria-current={actif === "profil" ? "page" : undefined}>Créer un profil</Link>
      {educateur && <Link href="/educateur" aria-current={actif === "eleves" ? "page" : undefined}>Tous les élèves</Link>}
    </nav>
  );
}
