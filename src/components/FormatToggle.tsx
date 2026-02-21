"use client";

type Format = "mp3" | "flac";

interface FormatToggleProps {
  value: Format;
  onChange: (format: Format) => void;
  disabled?: boolean;
}

export default function FormatToggle({ value, onChange, disabled }: FormatToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="format-toggle relative flex rounded-md border border-surface0/60 overflow-hidden bg-mantle/50">
        {/* Sliding indicator */}
        <div
          className="format-indicator absolute top-0 bottom-0 w-1/2 bg-surface0/50 rounded-[5px] transition-transform duration-200 ease-out"
          style={{ transform: value === "flac" ? "translateX(100%)" : "translateX(0)" }}
        />

        <button
          type="button"
          onClick={() => onChange("mp3")}
          disabled={disabled}
          className={`format-btn relative z-10 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-colors duration-200 disabled:opacity-50 ${
            value === "mp3" ? "text-lavender" : "text-overlay0/50 hover:text-overlay0"
          }`}
        >
          mp3
        </button>
        <button
          type="button"
          onClick={() => onChange("flac")}
          disabled={disabled}
          className={`format-btn relative z-10 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-colors duration-200 disabled:opacity-50 ${
            value === "flac" ? "text-mauve" : "text-overlay0/50 hover:text-overlay0"
          }`}
        >
          flac
        </button>
      </div>

      {value === "flac" && (
        <span className="text-[9px] text-mauve/40 tracking-wider animate-fade-in" style={{ opacity: 0 }}>
          lossless
        </span>
      )}
    </div>
  );
}
