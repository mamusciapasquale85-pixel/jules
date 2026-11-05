/** Logo de l'école, nom de l'appli et sa fonction, en haut des bandeaux. */
export function Marque() {
  return (
    <div className="marque-bloc">
      <span className="logo-plaque">
        <img src="/icons/logo-jules-verne.svg" alt="École Jules Verne" />
      </span>
      <div className="marque-textes">
        <span className="marque">Jules</span>
        <span className="sous">Suivi de l’élève</span>
      </div>
    </div>
  );
}
