import { useEffect, useState, type FormEvent } from "react";
import {
  encodeSecret,
  getCurrentUser,
  normalizeEmail,
  persistUser,
  readUsers,
  saveAuthSession,
  createUserRecord
} from "../lib/app-data";
import { useI18n } from "../context/I18nContext";

type Tab = "login" | "register";

export default function AuthDialog({
  open,
  onClose,
  initialTab = "login"
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setError(null);
    }
  }, [open, initialTab]);

  if (!open) return null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const em = normalizeEmail(email);
    const pw = password;
    if (!em || pw.length < 6) {
      setError(t("auth.errShort"));
      return;
    }
    if (tab === "register") {
      if (!name.trim()) {
        setError(t("auth.errName"));
        return;
      }
      const exists = readUsers().some((u) => u.email === em);
      if (exists) {
        setError(t("auth.errExists"));
        return;
      }
      const user = createUserRecord(name, em, pw);
      persistUser(user);
      saveAuthSession(user.email);
      onClose();
      return;
    }
    const user = readUsers().find((u) => u.email === em);
    if (!user || user.passwordHash !== encodeSecret(pw)) {
      setError(t("auth.errLogin"));
      return;
    }
    saveAuthSession(user.email);
    onClose();
  }

  return (
    <dialog className="dialog" open>
      <div className="auth-dialog__inner">
        <p className="hero-kicker">{t("auth.kicker")}</p>
        <div className="auth-tabs" role="tablist">
          <button type="button" className={tab === "login" ? "is-active" : ""} onClick={() => setTab("login")}>
            {t("auth.loginTab")}
          </button>
          <button type="button" className={tab === "register" ? "is-active" : ""} onClick={() => setTab("register")}>
            {t("auth.registerTab")}
          </button>
        </div>
        <h3>{tab === "login" ? t("auth.titleLogin") : t("auth.titleRegister")}</h3>
        <p className="auth-hint">{tab === "login" ? t("auth.hintLogin") : t("auth.hintRegister")}</p>
        <form onSubmit={onSubmit} className="donation-form">
          {tab === "register" ? (
            <label>
              <span>{t("auth.nameLabel")}</span>
              <input value={name} onChange={(ev) => setName(ev.target.value)} autoComplete="name" />
            </label>
          ) : null}
          <label>
            <span>{t("auth.emailLabel")}</span>
            <input
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            <span>{t("auth.passwordLabel")}</span>
            <input
              type="password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              placeholder={t("auth.placeholderPassword")}
              required
            />
          </label>
          {error ? <p className="form-status form-status--error">{error}</p> : null}
          <button type="submit">{tab === "login" ? t("auth.submitLogin") : t("auth.submitRegister")}</button>
        </form>
        <button type="button" className="ghost" onClick={onClose}>
          {t("btn.close")}
        </button>
      </div>
    </dialog>
  );
}
