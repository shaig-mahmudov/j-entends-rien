export function LyricsScene({ projectId, frame }: { projectId: string; frame: number }) {
  const show = frame > 360 && frame < 430;
  if (!show) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 120,
        textAlign: "center",
        color: "white",
        fontFamily: "Arial, sans-serif",
        fontSize: 72,
        fontWeight: 800,
        textShadow: "0 0 32px #22d3ee"
      }}
    >
      {projectId === "demo" ? "falling" : "lyric moment"}
    </div>
  );
}
