"use client";

export type Format = "mp3" | "flac" | "alac";

interface FormatToggleProps {
  value: Format;
  onChange: (format: Format) => void;
  disabled?: boolean;
}

const formats: { id: Format; label: string; color: string }[] = [
  { id: "mp3", label: "mp3", color: "text-lavender" },
  { id: "flac", label: "flac", color: "text-mauve" },
  { id: "alac", label: "alac", color: "text-pink" },
];

export default function FormatToggle({ value, onChange, disabled }: FormatToggleProps) {
  const activeIndex = formats.findIndex((f) => f.id === value);
  const isLossless = value === "flac" || value === "alac";

  return (
    <div className="flex items-center gap-2">
      <div className="format-toggle relative flex rounded-md border border-surface0/60 overflow-hidden bg-mantle/50">
        {/* Sliding indicator */}
        <div
          className="format-indicator absolute top-0 bottom-0 bg-surface0/50 rounded-[5px] transition-all duration-200 ease-out"
          style={{
            width: `${100 / formats.length}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {formats.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            disabled={disabled}
            className={`format-btn relative z-10 w-14 py-1.5 text-center text-[10px] uppercase tracking-widest font-bold transition-colors duration-200 disabled:opacity-50 ${
              value === f.id ? f.color : "text-overlay0/50 hover:text-overlay0"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLossless && (
        <span
          className={`text-[9px] tracking-wider animate-fade-in ${value === "alac" ? "text-pink/40" : "text-mauve/40"}`}
          style={{ opacity: 0 }}
        >
          lossless{value === "alac" ? " · apple" : ""}
        </span>
      )}
    </div>
  );
}
