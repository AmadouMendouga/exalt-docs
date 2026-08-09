export default function CocheSucces({ taille = 56 }: { taille?: number }) {
  return (
    <div
      className="exalt-anim-fade-scale-in flex items-center justify-center rounded-full"
      style={{
        width: taille,
        height: taille,
        backgroundColor: "#e8f3ec",
      }}
    >
      <svg width={taille * 0.55} height={taille * 0.55} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 12.5l5 5L20 6.5"
          stroke="#1f7a3f"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="exalt-anim-coche-trait"
        />
      </svg>
    </div>
  );
}
