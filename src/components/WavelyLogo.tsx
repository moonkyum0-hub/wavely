interface WavelyLogoProps {
  size?: number;
  className?: string;
}

export default function WavelyLogo({ size = 36, className = "" }: WavelyLogoProps) {
  const s = size;
  const cy = s / 2;
  const w2 = s * 2;
  const r = Math.round(s * 0.26); // squircle-feel radius

  const wave1 = buildWave(w2, cy + 1,  6,   s); // main — center
  const wave2 = buildWave(w2, cy - 4,  3.5, s); // accent — upper

  return (
    <div
      className={`relative overflow-hidden shrink-0 ${className}`}
      style={{
        width: s,
        height: s,
        borderRadius: r,
        background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 45%, #1e3a8a 100%)",
      }}
    >
      {/* Inner top-left highlight for depth */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.18) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Wave 1 — main, bright white */}
      <svg
        width={w2} height={s} viewBox={`0 0 ${w2} ${s}`}
        style={{ position: "absolute", top: 0, left: 0, animation: "wavely-slide 3s linear infinite" }}
      >
        <path d={wave1} stroke="rgba(255,255,255,0.92)" strokeWidth={s * 0.058} fill="none" strokeLinecap="round" />
      </svg>

      {/* Wave 2 — cyan-tinted, thinner */}
      <svg
        width={w2} height={s} viewBox={`0 0 ${w2} ${s}`}
        style={{ position: "absolute", top: 0, left: 0, animation: "wavely-slide 5s linear infinite" }}
      >
        <path d={wave2} stroke="rgba(147,210,255,0.55)" strokeWidth={s * 0.036} fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function buildWave(totalW: number, centerY: number, amp: number, period: number): string {
  const points: string[] = [];
  let x = 0;
  let first = true;

  while (x < totalW) {
    if (first) {
      points.push(`M${x},${centerY}`);
      first = false;
    }
    const qx1 = x + period / 4;
    const ex1 = x + period / 2;
    points.push(`Q${qx1},${centerY - amp} ${ex1},${centerY}`);

    const qx2 = ex1 + period / 4;
    const ex2 = ex1 + period / 2;
    points.push(`Q${qx2},${centerY + amp} ${ex2},${centerY}`);

    x += period;
  }

  return points.join(" ");
}
