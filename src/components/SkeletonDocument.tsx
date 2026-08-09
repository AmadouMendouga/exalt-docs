export default function SkeletonDocument({ largeur }: { largeur: number }) {
  return (
    <div
      className="exalt-anim-pulse flex flex-col gap-3 rounded p-6"
      style={{ width: largeur || undefined, aspectRatio: "1 / 1.414", backgroundColor: "#f3ece7" }}
      role="presentation"
    >
      <div className="h-3 w-2/3 rounded" style={{ backgroundColor: "#dbc1b4" }} />
      <div className="h-3 w-full rounded" style={{ backgroundColor: "#dbc1b4" }} />
      <div className="h-3 w-5/6 rounded" style={{ backgroundColor: "#dbc1b4" }} />
      <div className="mt-4 h-3 w-1/2 rounded" style={{ backgroundColor: "#dbc1b4" }} />
    </div>
  );
}
