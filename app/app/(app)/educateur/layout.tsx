import { redirect } from "next/navigation";
import { getProfil } from "@/lib/profil";

export default async function LayoutEducateur({ children }: { children: React.ReactNode }) {
  const profil = await getProfil();
  const autorise =
    profil?.kind === "adulte" && (profil.roles.includes("educateur") || profil.roles.includes("admin"));
  if (!autorise) redirect("/");
  return <>{children}</>;
}
