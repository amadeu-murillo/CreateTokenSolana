"use client";

import { MULTILINGUAL_ROUTE_SEO, RoutePath } from "@/lib/seo";
import { TranslationDictionary } from "@/i18n/types";
import enDictionary from "@/i18n/locales/en";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

export type { TranslationDictionary };

/**
 * Top 5 global crypto market locales supported by CreateTokenSolana:
 * - 'en'    : English (Default global fallback)
 * - 'es'    : Español
 * - 'ru'    : Русский
 * - 'zh'    : 中文 (简体)
 * - 'pt-BR' : Português (Brasil)
 *
 * Note: 'pt' is retained in the union type as an alias for backwards compatibility.
 */
export type SupportedLocale = "en" | "es" | "ru" | "zh" | "pt-BR";
export type AppLocale = SupportedLocale | "pt";

export const SUPPORTED_APP_LOCALES: ReadonlyArray<{
  code: SupportedLocale;
  label: string;
  shortLabel: string;
  nativeName: string;
  flag: string;
  htmlLang: string;
}> = [
  { code: "en", label: "English", shortLabel: "EN", nativeName: "English", flag: "🇺🇸", htmlLang: "en" },
  { code: "es", label: "Español", shortLabel: "ES", nativeName: "Español", flag: "🇪🇸", htmlLang: "es" },
  { code: "ru", label: "Русский", shortLabel: "RU", nativeName: "Русский", flag: "🇷🇺", htmlLang: "ru" },
  { code: "zh", label: "中文", shortLabel: "ZH", nativeName: "中文", flag: "🇨🇳", htmlLang: "zh-CN" },
  { code: "pt-BR", label: "Português", shortLabel: "PT-BR", nativeName: "Português", flag: "🇧🇷", htmlLang: "pt-BR" },
] as const;

export const SUPPORTED_LOCALES = SUPPORTED_APP_LOCALES;

const STORAGE_KEY = "appLocale";

export function normalizeLocale(raw?: string | null): SupportedLocale | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();

  if (cleaned === "en" || cleaned.startsWith("en-")) return "en";
  if (cleaned === "es" || cleaned.startsWith("es-")) return "es";
  if (cleaned === "ru" || cleaned.startsWith("ru-")) return "ru";
  if (cleaned === "zh" || cleaned.startsWith("zh-")) return "zh";
  if (cleaned === "pt" || cleaned === "pt-br" || cleaned.startsWith("pt-")) return "pt-BR";

  return null;
}

export function detectLocaleFromPathname(pathname?: string | null): SupportedLocale | null {
  if (!pathname) return null;
  const firstSegment = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (!firstSegment) return null;
  if (firstSegment === "pt-br" || firstSegment === "pt") return "pt-BR";
  if (firstSegment === "es") return "es";
  if (firstSegment === "ru") return "ru";
  if (firstSegment === "zh") return "zh";
  return null;
}

export function detectBrowserLocale(): SupportedLocale {
  if (typeof window === "undefined") return "en";

  try {
    const fromPath = detectLocaleFromPathname(window.location.pathname);
    if (fromPath) {
      localStorage.setItem(STORAGE_KEY, fromPath);
      return fromPath;
    }
  } catch {
    // Ignore pathname or storage errors
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = normalizeLocale(params.get("lang"));
    if (fromQuery) {
      localStorage.setItem(STORAGE_KEY, fromQuery);
      return fromQuery;
    }
  } catch {
    // Ignore URL parsing or storage errors
  }

  try {
    const saved = normalizeLocale(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      return saved;
    }
  } catch {
    // Ignore storage read errors
  }

  if (typeof navigator !== "undefined") {
    const browserLanguages: readonly string[] =
      Array.isArray(navigator.languages) && navigator.languages.length > 0
        ? navigator.languages
        : navigator.language
        ? [navigator.language]
        : [];

    for (const candidate of browserLanguages) {
      const matched = normalizeLocale(candidate);
      if (matched) {
        return matched;
      }
    }
  }

  return "en";
}

export const detectUserCountryLocale = detectBrowserLocale;

const loadedDictionariesCache = new Map<SupportedLocale, TranslationDictionary>([
  ["en", enDictionary],
]);

/**
 * Phase 4.16: Dynamically loads only the active locale dictionary on demand.
 */
export async function loadLocaleDictionary(
  locale: SupportedLocale
): Promise<TranslationDictionary> {
  const cached = loadedDictionariesCache.get(locale);
  if (cached) return cached;

  let loaded: { default: TranslationDictionary };
  switch (locale) {
    case "pt-BR":
      loaded = await import("@/i18n/locales/pt-BR");
      break;
    case "es":
      loaded = await import("@/i18n/locales/es");
      break;
    case "ru":
      loaded = await import("@/i18n/locales/ru");
      break;
    case "zh":
      loaded = await import("@/i18n/locales/zh");
      break;
    case "en":
    default:
      loaded = { default: enDictionary };
      break;
  }

  loadedDictionariesCache.set(locale, loaded.default);
  return loaded.default;
}

interface LanguageContextValue {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: enDictionary,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>("en");
  const [dictionary, setDictionary] = useState<TranslationDictionary>(enDictionary);

  const syncDocumentLang = useCallback((target: SupportedLocale) => {
    if (typeof document !== "undefined") {
      const meta = SUPPORTED_LOCALES.find((item) => item.code === target);
      document.documentElement.lang = meta ? meta.htmlLang : target;

      try {
        const rawPath = window.location.pathname || "/";
        const normalizedPath = (
          rawPath === "/afiliates" || rawPath === "/afiliados"
            ? "/affiliates"
            : rawPath === "/docs"
            ? "/documentacao"
            : rawPath === "/create"
            ? "/"
            : rawPath
        ) as RoutePath;
        const routeSeo = MULTILINGUAL_ROUTE_SEO[normalizedPath]?.[target];
        if (routeSeo) {
          document.title = routeSeo.title;
          const setMetaContent = (selector: string, value: string) => {
            const el = document.querySelector(selector);
            if (el) el.setAttribute("content", value);
          };
          setMetaContent('meta[name="description"]', routeSeo.description);
          setMetaContent('meta[property="og:title"]', routeSeo.title);
          setMetaContent('meta[property="og:description"]', routeSeo.description);
          setMetaContent('meta[name="twitter:title"]', routeSeo.title);
          setMetaContent('meta[name="twitter:description"]', routeSeo.description);
        }
      } catch {
        // Ignore DOM meta update errors
      }
    }
  }, []);

  useEffect(() => {
    const detected = detectBrowserLocale();
    setLocaleState(detected);
    syncDocumentLang(detected);
    let active = true;
    loadLocaleDictionary(detected).then((dict) => {
      if (active) setDictionary(dict);
    });
    return () => {
      active = false;
    };
  }, [syncDocumentLang]);

  const setLocale = useCallback(
    (next: AppLocale) => {
      const normalized: SupportedLocale = normalizeLocale(next) ?? "en";
      setLocaleState(normalized);
      try {
        localStorage.setItem(STORAGE_KEY, normalized);
      } catch {
        // Ignore storage write errors
      }
      syncDocumentLang(normalized);
      loadLocaleDictionary(normalized).then((dict) => {
        setDictionary(dict);
      });
    },
    [syncDocumentLang]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: dictionary,
    }),
    [locale, setLocale, dictionary]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
