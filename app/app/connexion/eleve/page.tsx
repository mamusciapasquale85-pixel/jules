"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PageConnexionEleve() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    const r = await fetch("/api/auth/eleve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setEnCours(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErreur(j.erreur ?? "Code inconnu");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="ecran">
      <header className="entete" style={{ paddingBottom: 24 }}>
        <span className="marque">Jules</span>
        <h1 style={{ fontSize: 26 }}>Mon code</h1>
        <span className="sous">Le code de 8 caractères remis par ton éducateur ou ton éducatrice</span>
      </header>

      <form onSubmit={envoyer} className="contenu" style={{ gap: 16 }}>
        <label className="etiquette">
          Code personnel
          <input
            className="champ"
            style={{ fontSize: 24, letterSpacing: ".2em", textAlign: "center", textTransform: "uppercase", height: 60 }}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={8}
            required
          />
        </label>
        {erreur && <p className="erreur">{erreur}</p>}
        <button className="bouton bouton-grand" type="submit" disabled={enCours || code.length < 6}>
          {enCours ? "Vérification…" : "Entrer"}
        </button>
        <Link href="/connexion" className="sourdine" style={{ textAlign: "center" }}>
          Je suis un adulte
        </Link>
      </form>
    </main>
  );
}
