"use client";

import { useState } from "react";

interface SpotifyInputProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export default function SpotifyInput({ onSubmit, disabled }: SpotifyInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      if (text.includes("spotify.com")) onSubmit(text.trim());
    } catch {
      // Clipboard access denied — user can type manually
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="border border-surface0 rounded-lg flex items-stretch overflow-hidden transition-colors focus-within:border-lavender">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled}
          placeholder="https://open.spotify.com/track/..."
          className="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-text placeholder:text-overlay0 outline-none font-mono disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handlePaste}
          disabled={disabled}
          className="flex-shrink-0 px-4 py-3 text-xs text-subtext0 hover:text-lavender border-l border-surface0 transition-colors uppercase tracking-wider disabled:opacity-50"
        >
          Paste
        </button>
        <button
          type="submit"
          disabled={disabled || !url.trim()}
          className="flex-shrink-0 px-4 py-3 text-xs text-crust bg-lavender hover:bg-mauve border-l border-surface0 transition-colors uppercase tracking-wider font-bold disabled:opacity-50 disabled:bg-surface1 disabled:text-overlay0"
        >
          Go
        </button>
      </div>
    </form>
  );
}
