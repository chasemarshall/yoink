"use client";

import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";

export default function LanguageSwitcher() {
  const { language, setLanguage, languageNames } = useLanguage();

  return (
    <label className="text-xs text-overlay0 flex items-center gap-2">
      <span className="hidden sm:inline">lang</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as (typeof SUPPORTED_LANGUAGES)[number])}
        className="bg-mantle border border-surface0/60 rounded px-2 py-1 text-xs text-text"
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code}>
            {languageNames[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
