"use client";

import { useEffect, useRef } from "react";

const SPOTS = [
  { x: 15, y: 25, size: 280 },
  { x: 70, y: 55, size: 320 },
  { x: 45, y: 80, size: 250 },
  { x: 85, y: 20, size: 260 },
  { x: 30, y: 60, size: 300 },
];

export default function DotPulse() {
  const spotsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const animations: number[] = [];

    spotsRef.current.forEach((el, i) => {
      if (!el) return;
      // Each spot gets a different speed and phase
      const speed = 8000 + i * 3000; // 8s to 20s per cycle
      const phase = i * 1800; // stagger start times
      let start: number | null = null;

      const animate = (time: number) => {
        if (!start) start = time - phase;
        const elapsed = time - start;
        // Sine wave: oscillates between 0 and 1
        const t = (Math.sin((elapsed / speed) * Math.PI * 2) + 1) / 2;
        // Map to opacity 0 (invisible) to 0.35 (subtle dim)
        el.style.opacity = String(t * 0.35);
        animations[i] = requestAnimationFrame(animate);
      };

      animations[i] = requestAnimationFrame(animate);
    });

    return () => animations.forEach(cancelAnimationFrame);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      {SPOTS.map((spot, i) => (
        <div
          key={i}
          ref={(el) => { spotsRef.current[i] = el; }}
          style={{
            position: "absolute",
            left: `${spot.x}%`,
            top: `${spot.y}%`,
            width: spot.size,
            height: spot.size,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: "var(--color-base)",
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}
