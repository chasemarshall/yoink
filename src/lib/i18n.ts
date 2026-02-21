export const SUPPORTED_LANGUAGES = ["en", "es", "fr", "de", "pt"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
};

export const DEFAULT_LANGUAGE: Language = "en";

export function isSupportedLanguage(value: string): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

export function pickLanguageFromLocale(locale: string): Language {
  const short = locale.toLowerCase().split("-")[0];
  if (isSupportedLanguage(short)) return short;
  return DEFAULT_LANGUAGE;
}

export const translations = {
  en: {
    spotifyDownloader: "spotify downloader",
    tipJar: "tip jar",
    inputPlaceholder: "https://open.spotify.com/track or playlist...",
    paste: "paste",
    clear: "clear",
    enterToDownload: "to download",
    fetchingInfo: "fetching info",
    tryAgain: "try again",
    downloadFailed: "Download failed",
    download: "download",
    downloading: "downloading",
    downloaded: "downloaded",
    downloadAll: "download all",
    new: "new",
    metadataIncluded: "metadata included",
  },
  es: {
    spotifyDownloader: "descargador de spotify",
    tipJar: "propinas",
    inputPlaceholder: "https://open.spotify.com/track o playlist...",
    paste: "pegar",
    clear: "borrar",
    enterToDownload: "para descargar",
    fetchingInfo: "cargando información",
    tryAgain: "intentar de nuevo",
    downloadFailed: "Descarga fallida",
    download: "descargar",
    downloading: "descargando",
    downloaded: "descargado",
    downloadAll: "descargar todo",
    new: "nuevo",
    metadataIncluded: "metadatos incluidos",
  },
  fr: {
    spotifyDownloader: "téléchargeur spotify",
    tipJar: "pourboire",
    inputPlaceholder: "https://open.spotify.com/track ou playlist...",
    paste: "coller",
    clear: "effacer",
    enterToDownload: "pour télécharger",
    fetchingInfo: "récupération des infos",
    tryAgain: "réessayer",
    downloadFailed: "Échec du téléchargement",
    download: "télécharger",
    downloading: "téléchargement",
    downloaded: "téléchargé",
    downloadAll: "tout télécharger",
    new: "nouveau",
    metadataIncluded: "métadonnées incluses",
  },
  de: {
    spotifyDownloader: "spotify-downloader",
    tipJar: "trinkgeld",
    inputPlaceholder: "https://open.spotify.com/track oder playlist...",
    paste: "einfügen",
    clear: "löschen",
    enterToDownload: "zum herunterladen",
    fetchingInfo: "infos werden geladen",
    tryAgain: "erneut versuchen",
    downloadFailed: "Download fehlgeschlagen",
    download: "herunterladen",
    downloading: "lädt herunter",
    downloaded: "heruntergeladen",
    downloadAll: "alle herunterladen",
    new: "neu",
    metadataIncluded: "metadaten enthalten",
  },
  pt: {
    spotifyDownloader: "baixador do spotify",
    tipJar: "gorjeta",
    inputPlaceholder: "https://open.spotify.com/track ou playlist...",
    paste: "colar",
    clear: "limpar",
    enterToDownload: "para baixar",
    fetchingInfo: "buscando informações",
    tryAgain: "tentar novamente",
    downloadFailed: "Falha no download",
    download: "baixar",
    downloading: "baixando",
    downloaded: "baixado",
    downloadAll: "baixar tudo",
    new: "novo",
    metadataIncluded: "metadados incluídos",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];
