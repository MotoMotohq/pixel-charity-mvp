import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { EXTRA_I18N } from "../../lib/extra-i18n.js";
import { CORE_TRANSLATIONS } from "../i18n/core-translations";

export type Lang = "ru" | "kz" | "en";

const SUPPORTED: Lang[] = ["ru", "kz", "en"];

function readStoredLang(): Lang {
  const v = localStorage.getItem("site_lang");
  return SUPPORTED.includes(v as Lang) ? (v as Lang) : "ru";
}

function buildDict(lang: Lang): Record<string, string> {
  const L = SUPPORTED.includes(lang) ? lang : "ru";
  if (L === "ru") {
    return { ...CORE_TRANSLATIONS.ru, ...EXTRA_I18N.ru };
  }
  return {
    ...CORE_TRANSLATIONS.ru,
    ...EXTRA_I18N.ru,
    ...CORE_TRANSLATIONS[L],
    ...EXTRA_I18N[L]
  };
}

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  tf: (key: string, vars: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    const n = lang;
    document.documentElement.lang = n === "kz" ? "kk" : n === "en" ? "en" : "ru";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    const n = SUPPORTED.includes(l) ? l : "ru";
    setLangState(n);
    localStorage.setItem("site_lang", n);
    document.documentElement.lang = n === "kz" ? "kk" : n === "en" ? "en" : "ru";
    window.dispatchEvent(new CustomEvent("aether-locale"));
  }, []);

  const dict = useMemo(() => buildDict(lang), [lang]);

  const t = useCallback(
    (key: string) => {
      return dict[key] ?? buildDict("ru")[key] ?? key;
    },
    [dict]
  );

  const tf = useCallback(
    (key: string, vars: Record<string, string | number>) => {
      let s = t(key);
      Object.entries(vars).forEach(([k, v]) => {
        s = s.split(`{${k}}`).join(String(v));
      });
      return s;
    },
    [t]
  );

  const value = useMemo(() => ({ lang, setLang, t, tf }), [lang, setLang, t, tf]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const v = useContext(I18nContext);
  if (!v) throw new Error("useI18n outside I18nProvider");
  return v;
}
