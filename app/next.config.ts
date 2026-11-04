import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Charge `env.local` (sans point) si `.env.local` n'existe pas.
 * Le Finder macOS refuse les noms qui commencent par un point ; ce repli évite le Terminal.
 */
function chargerEnvLocal() {
  for (const nom of [".env.local", "env.local"]) {
    try {
      const contenu = readFileSync(join(process.cwd(), nom), "utf8");
      for (const ligne of contenu.split("\n")) {
        const l = ligne.trim();
        if (!l || l.startsWith("#")) continue;
        const i = l.indexOf("=");
        if (i < 1) continue;
        const cle = l.slice(0, i).trim();
        const valeur = l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
        if (!(cle in process.env)) process.env[cle] = valeur;
      }
      return;
    } catch {
      // fichier absent : on essaie le suivant
    }
  }
}

chargerEnvLocal();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
