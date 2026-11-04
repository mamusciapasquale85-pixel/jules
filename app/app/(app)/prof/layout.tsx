import { redirect } from "next/navigation";
import { getProfil } from "@/lib/profil";

export default async function LayoutProf({ children }: { children: React.ReactNode }) {
  const profil = await getProfil();
  if (!profil || profil.kind !== "adulte" || !profil.roles.includes("prof")) redirect("/");
  return <>{children}</>;
}
