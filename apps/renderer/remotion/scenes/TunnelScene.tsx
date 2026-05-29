export function TunnelScene({ intensity }: { intensity: number }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
      {Array.from({ length: 26 }, (_, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            width: `${18 + index * 5 + intensity * 4}%`,
            aspectRatio: "1",
            border: `3px solid ${index % 2 ? "#22d3ee" : "#fb7185"}`,
            transform: `rotate(${index * 9 + intensity * 30}deg)`,
            opacity: Math.max(0.08, 0.7 - index * 0.02),
            boxShadow: "0 0 28px currentColor"
          }}
        />
      ))}
    </div>
  );
}
