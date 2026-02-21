"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  LANGUAGE_NAMES,
  type Language,
  pickLanguageFromLocale,
  translations,
  type TranslationKey,
} from "@/lib/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  languageNames: typeof LANGUAGE_NAMES;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "yoink-language";

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && isSupportedLanguage(stored)) return stored;

  return pickLanguageFromLocale(navigator.language);
}

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: (nextLanguage) => {
      setLanguage(nextLanguage);
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    },
    t: (key) => translations[language][key] ?? translations.en[key],
    languageNames: LANGUAGE_NAMES,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
