export default function Preloader({ taille = 48 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 128 128" aria-hidden="true">
      <circle className="exalt-preloader__bouche2" cx="64" cy="64" r="56" fill="none" stroke="#90503b" strokeWidth="6" strokeLinecap="round" />
      <circle className="exalt-preloader__bouche1" cx="64" cy="64" r="56" fill="none" stroke="#90503b" strokeWidth="6" strokeLinecap="round" />
      <circle className="exalt-preloader__oeil1" cx="64" cy="64" r="6" fill="#cc7457" />
      <circle className="exalt-preloader__oeil2" cx="64" cy="64" r="6" fill="#cc7457" />
    </svg>
  );
}
