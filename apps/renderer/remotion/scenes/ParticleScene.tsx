export function ParticleScene({ intensity }: { intensity: number }) {
  const particles = Array.from({ length: 160 }, (_, index) => index);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {particles.map((index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: `${(index * 37) % 100}%`,
            top: `${(index * 61) % 100}%`,
            width: 3 + intensity * 9,
            height: 3 + intensity * 9,
            borderRadius: "50%",
            background: index % 2 ? "#22d3ee" : "#8b5cf6",
            opacity: 0.18 + intensity * 0.45,
            boxShadow: "0 0 22px currentColor"
          }}
        />
      ))}
    </div>
  );
}
