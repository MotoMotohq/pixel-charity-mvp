import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import type { Lang } from "../context/I18nContext";
import { useI18n } from "../context/I18nContext";
import { shortAddress, useWallet } from "../context/WalletContext";
import { eip1193Label } from "../lib/eip1193-label";
import { getCurrentUser, userShortName } from "../lib/app-data";
import AuthDialog from "./AuthDialog";
import { IconChart, IconHome, IconInsight, IconMoon, IconSun, IconUser } from "./NavIcons";

const THEME_KEY = "aether_theme_v1";

const titleKey: Record<string, string> = {
  "/": "title.home",
  "/markets": "title.markets",
  "/profile": "title.profile",
  "/insights": "title.insights"
};

export default function Layout() {
  const { lang, setLang, t } = useI18n();
  const loc = useLocation();
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof localStorage !== "undefined" && localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"
  );
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const navRef = useRef<HTMLElement | null>(null);
  const [indicator, setIndicator] = useState<{ left: number; top: number; width: number; height: number; ready: boolean }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false
  });
  const user = getCurrentUser();
  const {
    address,
    connectInjected,
    connectWalletConnect,
    disconnect,
    hasInjected,
    isConnecting,
    walletConnectConfigured,
    injectedList,
    injectedIndex,
    setInjectedIndex
  } = useWallet();

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const key = titleKey[loc.pathname] ?? "title.home";
    document.title = t(key);
  }, [loc.pathname, t]);

  useLayoutEffect(() => {
    const update = () => {
      const nav = navRef.current;
      if (!nav) return;
      const active = nav.querySelector<HTMLAnchorElement>(".nav__link.active");
      if (!active) return;
      setIndicator({
        left: active.offsetLeft,
        top: active.offsetTop,
        width: active.offsetWidth,
        height: active.offsetHeight,
        ready: true
      });
    };

    const raf = window.requestAnimationFrame(update);
    const nav = navRef.current;
    const ro = typeof ResizeObserver !== "undefined" && nav ? new ResizeObserver(update) : null;
    if (ro && nav) ro.observe(nav);
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [loc.pathname]);

  const navCls = ({ isActive }: { isActive: boolean }) => "nav__link" + (isActive ? " active" : "");

  return (
    <div className="shell">
      <div className="topbar" role="banner">
        <NavLink to="/" className="brand">
          <span className="brand__text">Aether Charity Fund</span>
        </NavLink>
        <nav ref={navRef} className="nav" aria-label="Main">
          <span
            className={"nav__indicator" + (indicator.ready ? " is-ready" : "")}
            style={{
              transform: `translate(${indicator.left}px, ${indicator.top}px)`,
              width: `${indicator.width}px`,
              height: `${indicator.height}px`
            }}
            aria-hidden="true"
          />
          <NavLink to="/" className={navCls} end>
            <IconHome />
            <span>{t("nav.home")}</span>
          </NavLink>
          <NavLink to="/markets" className={navCls}>
            <IconChart />
            <span>{t("nav.features")}</span>
          </NavLink>
          <NavLink to="/profile" className={navCls}>
            <IconUser />
            <span>{t("nav.profile")}</span>
          </NavLink>
          <NavLink to="/insights" className={navCls}>
            <IconInsight />
            <span>{t("nav.impact")}</span>
          </NavLink>
        </nav>
        <div className="topbar-actions">
          <div className="lang-switch" role="group" aria-label="Language">
            {(["ru", "kz", "en"] as Lang[]).map((code) => (
              <button
                key={code}
                type="button"
                className="lang-btn"
                aria-pressed={lang === code}
                onClick={() => setLang(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="ghost"
            title={theme === "dark" ? t("theme.toLightHint") : t("theme.toDarkHint")}
            onClick={() => setTheme((x) => (x === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <IconSun /> : <IconMoon />}
            <span>{theme === "dark" ? t("theme.useLight") : t("theme.useDark")}</span>
          </button>
          {!address && injectedList.length > 1 ? (
            <label className="provider-pick-wrap">
              <span className="sr-only">{t("wallet.pickProvider")}</span>
              <select
                className="provider-pick"
                value={injectedIndex}
                onChange={(ev) => setInjectedIndex(Number(ev.target.value))}
                aria-label={t("wallet.pickProvider")}
              >
                {injectedList.map((p, i) => (
                  <option key={i} value={i}>
                    {eip1193Label(p, i)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {address ? (
            <button
              type="button"
              className="connect-pill connect-pill--signed"
              title={address}
              onClick={() => void disconnect()}
            >
              {shortAddress(address)}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="ghost"
                disabled={!hasInjected || isConnecting}
                title={!hasInjected ? t("chain.noInjected") : undefined}
                onClick={() => void connectInjected()}
              >
                {t("btn.walletConnect")}
              </button>
              {walletConnectConfigured ? (
                <button type="button" className="ghost" disabled={isConnecting} onClick={() => void connectWalletConnect()}>
                  {t("btn.wc")}
                </button>
              ) : null}
            </>
          )}
          <button
            type="button"
            className={user ? "connect-pill connect-pill--signed" : "connect-pill"}
            onClick={() => {
              if (user) return;
              setAuthTab("login");
              setAuthOpen(true);
            }}
          >
            {user ? userShortName(user) : t("btn.account")}
          </button>
        </div>
      </div>

      <main className="page">
        <Suspense
          fallback={
            <div className="page-loading" role="status">
              <div className="page-loading__dot" />
              <p>{t("page.loading")}</p>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <footer className="footer">
        <div className="footer__row">
          <span>{t("footer.blurb")}</span>
        </div>
        <div className="footer__row">
          <span>{t("footer.env")}</span>
          <code>VITE_PIXEL_CHARITY_ADDRESS</code>
          <code>VITE_RPC_URL</code>
          <code>VITE_WALLETCONNECT_PROJECT_ID</code>
        </div>
      </footer>

      <AuthDialog open={authOpen} initialTab={authTab} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
