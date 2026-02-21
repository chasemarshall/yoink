"use client";

import { useState } from "react";

interface SpotifyInputProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
  clear?: boolean;
}

export default function SpotifyInput({ onSubmit, disabled, clear }: SpotifyInputProps) {
  const [url, setUrl] = useState("");

  // Clear input when parent signals
  const [lastClear, setLastClear] = useState(false);
  if (clear && !lastClear) {
    setUrl("");
    setLastClear(true);
  } else if (!clear && lastClear) {
    setLastClear(false);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      if (
        text.includes("spotify.com") ||
        text.includes("music.apple.com") ||
        text.includes("youtube.com/watch") ||
        text.includes("youtu.be/") ||
        text.includes("music.youtube.com")
      ) onSubmit(text.trim());
    } catch {
      // Clipboard access denied — user can type manually
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full animate-fade-in-up" style={{ animationDelay: "100ms", opacity: 0 }}>
      <div className="input-glow border border-surface0/60 rounded-lg flex items-stretch overflow-hidden transition-all duration-200 focus-within:border-lavender bg-mantle/50">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled}
          placeholder="https://open.spotify.com/track or playlist..."
          className="flex-1 min-w-0 bg-transparent px-4 py-3.5 text-sm text-text placeholder:text-overlay0/60 outline-none font-mono disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handlePaste}
          disabled={disabled}
          className="btn-press flex-shrink-0 px-4 py-3.5 text-xs text-subtext0 hover:text-lavender hover:bg-surface0/30 border-l border-surface0/60 transition-all duration-200 uppercase tracking-wider disabled:opacity-50"
        >
          paste
        </button>
        <button
          type="submit"
          disabled={disabled || !url.trim()}
          className="btn-press flex-shrink-0 px-5 py-3.5 text-xs text-crust bg-lavender hover:bg-mauve border-l border-lavender/20 transition-all duration-200 uppercase tracking-wider font-bold disabled:opacity-40 disabled:bg-surface1 disabled:text-overlay0 disabled:border-surface0"
        >
          go
        </button>
      </div>
    </form>
  );
}
