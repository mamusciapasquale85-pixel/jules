import { redirect } from "next/navigation";
import { getProfil } from "@/lib/profil";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const profil = await getProfil();
  if (!profil || profil.kind !== "adulte" || !profil.roles.includes("admin")) redirect("/");
  return <>{children}</>;
}
