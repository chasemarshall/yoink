"use client";

import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";

export default function Header() {
  const { t } = useLanguage();

  return (
    <header className="border-b border-surface0/60 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-base/80 sticky top-0 z-10">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="status-dot w-2 h-2 rounded-full bg-green" />
        <span className="text-sm font-bold tracking-wider uppercase text-text group-hover:text-lavender transition-colors">
          yoink
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-xs text-overlay0 hidden sm:block">{t("spotifyDownloader")}</span>
        <a
          href="https://chasefrazier.dev/tip"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-overlay0 hover:text-peach transition-colors duration-200"
        >
          {t("tipJar")}
        </a>
        <LanguageSwitcher />
        <span className="text-xs text-surface2">v3.0</span>
      </div>
    </header>
  );
}
