import { redirect } from "next/navigation";
import { getProfil } from "@/lib/profil";

export default async function LayoutProf({ children }: { children: React.ReactNode }) {
  const profil = await getProfil();
  // Profs, éducateurs et admins : un éducateur note aussi des observations et voit toutes les classes.
  const autorise =
    profil?.kind === "adulte" &&
    (profil.roles.includes("prof") || profil.roles.includes("educateur") || profil.roles.includes("admin"));
  if (!autorise) redirect("/");
  return <>{children}</>;
}
