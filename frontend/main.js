import {
  CAMPAIGNS,
  GRID_SIZE,
  MAX_INDEX,
  ORDER_SIDES,
  ORDER_STATUSES,
  ORDER_TYPES,
  WALLET_STORAGE_KEY,
  campaignTitle,
  createUserRecord,
  donationKey,
  donationMap,
  donationTotals,
  donations,
  enrichDonation,
  formatDateTime,
  formatKzt,
  formatMemberSince,
  formatRelativeTime,
  getCurrentUser,
  getUserStats,
  isOrderActive,
  normalizeEmail,
  persistUser,
  readUsers,
  replaceDonations,
  saveAuthSession,
  seedDonations,
  syncDonationState,
  toKzt,
  userDisplayName,
  userInitials,
  userShortName,
  encodeSecret
} from "./lib/app-data.js";
import { EXTRA_I18N } from "./lib/extra-i18n.js";

let selectedCell = null;
/** Set by initHomePage; runs on every language change */
let homeLocaleRefresh = null;
function setHomeLocaleRefresh(fn) {
  homeLocaleRefresh = fn;
}
const THEME_STORAGE_KEY = "aether_theme_v1";
const ONBOARDING_STORAGE_KEY = "aether_onboarding_seen_v1";
const TIME_IN_FORCE_LABELS = {
  gtc: "GTC",
  ioc: "IOC",
  fok: "FOK"
};
const ONBOARDING_STEPS = [
  { selector: "#home", titleKey: "page.onb.s0t", descriptionKey: "page.onb.s0d" },
  { selector: "#donatePanel", titleKey: "page.onb.s1t", descriptionKey: "page.onb.s1d" },
  { selector: ".wall-tile", titleKey: "page.onb.s2t", descriptionKey: "page.onb.s2d" },
  { selector: ".donation-feed-panel", titleKey: "page.onb.s3t", descriptionKey: "page.onb.s3d" },
  { selector: "#connectBtn", titleKey: "page.onb.s4t", descriptionKey: "page.onb.s4d" }
];
const MARKET_WIDGET_SEED = {
  children: {
    symbol: "BTC / ETH Core",
    price: toKzt(84320),
    change: 1.84,
    volume: toKzt(1860000),
    spread: 0.12,
    funding: 0.008,
    sentiment: 72,
    high: toKzt(85120),
    low: toKzt(83280),
    volatility: 2.42,
    spark: [36, 42, 39, 48, 54, 52, 58, 62, 66, 61, 68, 73]
  },
  animals: {
    symbol: "SOL / AI Momentum",
    price: toKzt(218),
    change: 4.92,
    volume: toKzt(940000),
    spread: 0.28,
    funding: 0.021,
    sentiment: 81,
    high: toKzt(226),
    low: toKzt(209),
    volatility: 5.36,
    spark: [28, 34, 37, 41, 46, 50, 56, 53, 61, 65, 72, 79]
  },
  elderly: {
    symbol: "Stable Yield Desk",
    price: toKzt(1.02),
    change: 0.34,
    volume: toKzt(510000),
    spread: 0.04,
    funding: 0.002,
    sentiment: 64,
    high: toKzt(1.04),
    low: toKzt(0.99),
    volatility: 0.74,
    spark: [52, 51, 53, 54, 52, 55, 54, 56, 57, 56, 58, 59]
  }
};
const MARKET_MOVER_SEED = [
  { symbol: "BTC", price: toKzt(84200), change: 1.9, volume: toKzt(1220000) },
  { symbol: "ETH", price: toKzt(4060), change: 2.7, volume: toKzt(810000) },
  { symbol: "SOL", price: toKzt(217), change: 5.2, volume: toKzt(690000) }
];
const translations = {
  ru: {
    "nav.home": "Главная",
    "nav.features": "Рынки",
    "nav.profile": "Портфель",
    "btn.account": "Аккаунт",
    "btn.donateNow": "Открыть терминал",
    "btn.whitepaper": "Whitepaper",
    "btn.close": "Закрыть",
    "nav.impact": "Аналитика",
    "home.eyebrow": "Premium Crypto Exchange",
    "home.form.pixel": "Уровень ликвидности (0-999)",
    "home.form.amount": "Размер ордера (тг)",
    "home.form.message": "Торговая заметка",
    "home.form.submit": "Разместить ордер",
    "home.wall.title": "Live liquidity heatmap",
    "home.totalRaised": "24h volume",
    "home.totalRaisedHint": "Живая рыночная статистика",
    "home.latestDonation": "Последнее исполнение",
    "home.trustMarkers": "Маркеры доверия",
    "home.trust.1": "Smart execution",
    "home.trust.2": "Прозрачная история исполнения",
    "home.trust.3": "Глубокая liquidity map",
    "home.quote.author": "- Команда Aether",
    "func.eyebrow": "Архитектура исполнения",
    "func.c1.title": "01. Liquidity heatmap",
    "func.c2.title": "02. Прозрачный execution log",
    "func.c3.title": "03. Wallet-first UX",
    "func.flow.title": "Поток исполнения",
    "func.flow.1": "Пользователь подключает кошелек",
    "func.flow.2": "Выбирает свободный уровень",
    "func.flow.3": "Указывает размер и заметку",
    "func.flow.4": "Подтверждает ордер",
    "func.flow.5": "Статистика и heatmap обновляются в реальном времени",
    "profile.eyebrow": "Портфель трейдера",
    "profile.verified": "Активный участник с 2026 года",
    "profile.copy": "Скопировать адрес",
    "profile.donations": "Сделки",
    "profile.pixelsOwned": "Активные уровни",
    "profile.contributed": "Оборот",
    "profile.activity": "Последняя активность",
    "impact.eyebrow": "Market intelligence",
    "impact.totalRaised": "24h volume",
    "impact.occupiedPixels": "Активные уровни",
    "impact.avgDonation": "Средний ордер",
    "impact.fundTitle": "Структура оборота",
    "title.home": "Aether Exchange",
    "title.profile": "Портфель — Aether Exchange",
    "title.markets": "Рынки — Aether Exchange",
    "title.insights": "Аналитика — Aether Exchange",
    "misc.activeMarket": "Активный рынок:",
    "connect.hint": "Войти или создать аккаунт",
    "theme.useLight": "Светлая тема",
    "theme.useDark": "Тёмная тема",
    "theme.toLightHint": "Переключить на светлую тему",
    "theme.toDarkHint": "Переключить на тёмную тему",
    "auth.kicker": "Доступ к аккаунту",
    "auth.loginTab": "Вход",
    "auth.registerTab": "Регистрация",
    "auth.titleLogin": "Вход в Aether",
    "auth.titleRegister": "Создание аккаунта",
    "auth.hintLogin": "Войдите, чтобы размещать ордера и открыть персональный профиль.",
    "auth.hintRegister": "Создайте аккаунт, чтобы размещать ордера, собирать историю и вести персональный профиль.",
    "auth.nameLabel": "Имя",
    "auth.emailLabel": "Email",
    "auth.passwordLabel": "Пароль",
    "auth.placeholderName": "Например, Ayan Trader",
    "auth.placeholderPassword": "Минимум 6 символов",
    "auth.submitLogin": "Войти",
    "auth.submitRegister": "Создать аккаунт"
  },
  kz: {
    "nav.home": "Басты бет",
    "nav.features": "Нарықтар",
    "nav.profile": "Профиль",
    "btn.account": "Аккаунт",
    "btn.donateNow": "Терминалды ашу",
    "btn.whitepaper": "Whitepaper",
    "btn.close": "Жабу",
    "nav.impact": "Талдау",
    "home.eyebrow": "Web3 Қайырымдылық Платформасы",
    "home.kpi.security": "Қауіпсіздік",
    "home.kpi.securityValue": "Блокчейн дәлелі",
    "home.kpi.traceability": "Мөлдірлік",
    "home.kpi.traceabilityValue": "100% ашық журнал",
    "home.kpi.governance": "Басқару",
    "home.kpi.governanceValue": "Owner тексеретін шығару",
    "home.story.label": "Оқиға",
    "home.story.s1.title": "Стипендия қоры",
    "home.story.s1.text": "32 студент оқу төлеміне қолдау алды.",
    "home.story.s2.title": "Зертхана жаңарту",
    "home.story.s2.text": "18 жаңа құрылғы мектеп зертханаларына жеткізілді.",
    "home.story.s3.title": "Қоғамдық көмек",
    "home.story.s3.text": "Шұғыл гранттар 24 сағат ішінде берілді.",
    "home.form.pixel": "Пиксель индексі (0-999)",
    "home.form.amount": "Ордер көлемі (тг)",
    "home.form.message": "Хабарлама",
    "home.form.submit": "Қайырымдылықты растау",
    "home.wall.title": "Интерактивті қайырымдылық қабырғасы",
    "home.totalRaised": "Жалпы жиналды",
    "home.totalRaisedHint": "Ашық тірі статистика",
    "home.latestDonation": "Соңғы қайырымдылық",
    "home.trustMarkers": "Сенім көрсеткіштері",
    "home.trust.1": "On-chain жазбалар",
    "home.trust.2": "Қоғамға ашық тарих",
    "home.trust.3": "Пиксель қайталанбайды",
    "home.quote.author": "- Қор директоры",
    "func.eyebrow": "Функционал архитектурасы",
    "func.c1.title": "01. Бірегей пиксель алу",
    "func.c2.title": "02. Ашық реестр",
    "func.c3.title": "03. Wallet-first UX",
    "func.flow.title": "Қайырымдылық ағымы",
    "func.flow.1": "Пайдаланушы әмиян қосады",
    "func.flow.2": "Бос пиксельді таңдайды",
    "func.flow.3": "Сома мен хабарлама енгізеді",
    "func.flow.4": "Транзакцияны растайды",
    "func.flow.5": "Статистика мен heatmap бірден жаңарады",
    "profile.eyebrow": "Трейдер портфелі",
    "profile.verified": "2026 жылдан бері белсенді қатысушы",
    "profile.copy": "Адрес көшіру",
    "profile.donations": "Сауда",
    "profile.pixelsOwned": "Белсенді деңгейлер",
    "profile.contributed": "Айналым",
    "profile.activity": "Соңғы белсенділік",
    "impact.eyebrow": "Мөлдірлік есебі",
    "impact.totalRaised": "24h көлемі",
    "impact.occupiedPixels": "Белсенді деңгейлер",
    "impact.avgDonation": "Орташа ордер",
    "impact.fundTitle": "Айналым құрылымы",
    "title.home": "Aether Exchange",
    "title.profile": "Портфель — Aether Exchange",
    "title.markets": "Нарықтар — Aether Exchange",
    "title.insights": "Талдау — Aether Exchange",
    "misc.activeMarket": "Белсенді нарық:",
    "connect.hint": "Кіру немесе аккаунт жасау",
    "theme.useLight": "Жарық тема",
    "theme.useDark": "Қараңғы тема",
    "theme.toLightHint": "Жарық темаға ауысу",
    "theme.toDarkHint": "Қараңғы темаға ауысу",
    "auth.kicker": "Аккаунтқа кіру",
    "auth.loginTab": "Кіру",
    "auth.registerTab": "Тіркелу",
    "auth.titleLogin": "Aether-ке кіру",
    "auth.titleRegister": "Аккаунт жасау",
    "auth.hintLogin": "Ордерлер қою және жеке профиль үшін кіріңіз.",
    "auth.hintRegister": "Ордерлер, тарих және профиль үшін аккаунт жасаңыз.",
    "auth.nameLabel": "Аты",
    "auth.emailLabel": "Email",
    "auth.passwordLabel": "Құпия сөз",
    "auth.placeholderName": "Мысалы, Ayan Trader",
    "auth.placeholderPassword": "Кемінде 6 таңба",
    "auth.submitLogin": "Кіру",
    "auth.submitRegister": "Тіркелу"
  },
  en: {
    "nav.home": "Home",
    "nav.features": "Markets",
    "nav.profile": "Portfolio",
    "btn.account": "Account",
    "btn.donateNow": "Open Terminal",
    "btn.whitepaper": "Read Whitepaper",
    "btn.close": "Close",
    "nav.impact": "Insights",
    "home.eyebrow": "Premium Crypto Exchange",
    "home.kpi.security": "Security",
    "home.kpi.securityValue": "On-chain proof",
    "home.kpi.traceability": "Traceability",
    "home.kpi.traceabilityValue": "100% public log",
    "home.kpi.governance": "Governance",
    "home.kpi.governanceValue": "Owner-audited withdraw",
    "home.story.label": "Story",
    "home.story.s1.title": "Scholarship Fund",
    "home.story.s1.text": "32 students received tuition support through transparent monthly distributions.",
    "home.story.s2.title": "Lab Modernization",
    "home.story.s2.text": "Donations financed 18 new devices for science labs in underserved schools.",
    "home.story.s3.title": "Community Relief",
    "home.story.s3.text": "Emergency grants were delivered in under 24 hours with full public traceability.",
    "home.form.pixel": "Liquidity level (0-999)",
    "home.form.amount": "Order size (KZT)",
    "home.form.message": "Trade note",
    "home.form.submit": "Place Order",
    "home.wall.title": "Live Liquidity Heatmap",
    "home.totalRaised": "24h Volume",
    "home.totalRaisedHint": "Live market statistics",
    "home.latestDonation": "Latest Fill",
    "home.trustMarkers": "Trust Markers",
    "home.trust.1": "Smart execution",
    "home.trust.2": "Transparent history",
    "home.trust.3": "Deep liquidity map",
    "home.quote.author": "- Aether Team",
    "func.eyebrow": "Execution Architecture",
    "func.c1.title": "01. Liquidity Heatmap",
    "func.c2.title": "02. Transparent Execution Log",
    "func.c3.title": "03. Wallet-first UX",
    "func.flow.title": "Execution Flow",
    "func.flow.1": "User connects wallet",
    "func.flow.2": "Selects free liquidity level",
    "func.flow.3": "Sets order size and note",
    "func.flow.4": "Confirms the order",
    "func.flow.5": "Stats + heatmap update in real-time",
    "profile.eyebrow": "Trader Portfolio",
    "profile.verified": "Verified participant since 2026",
    "profile.copy": "Copy Address",
    "profile.donations": "Trades",
    "profile.pixelsOwned": "Active Levels",
    "profile.contributed": "Volume",
    "profile.activity": "Recent Activity",
    "impact.eyebrow": "Market Intelligence",
    "impact.totalRaised": "24h Volume",
    "impact.occupiedPixels": "Active Levels",
    "impact.avgDonation": "Avg Order",
    "impact.fundTitle": "Volume Allocation Snapshot",
    "title.home": "Aether Exchange",
    "title.profile": "Portfolio — Aether Exchange",
    "title.markets": "Markets — Aether Exchange",
    "title.insights": "Insights — Aether Exchange",
    "misc.activeMarket": "Active market:",
    "connect.hint": "Sign in or create an account",
    "theme.useLight": "Light mode",
    "theme.useDark": "Dark mode",
    "theme.toLightHint": "Switch to light theme",
    "theme.toDarkHint": "Switch to dark theme",
    "auth.kicker": "Account access",
    "auth.loginTab": "Sign in",
    "auth.registerTab": "Register",
    "auth.titleLogin": "Sign in to Aether",
    "auth.titleRegister": "Create account",
    "auth.hintLogin": "Sign in to place orders and open your portfolio.",
    "auth.hintRegister": "Create an account to place orders, keep history, and manage your profile.",
    "auth.nameLabel": "Name",
    "auth.emailLabel": "Email",
    "auth.passwordLabel": "Password",
    "auth.placeholderName": "e.g. Ayan Trader",
    "auth.placeholderPassword": "At least 6 characters",
    "auth.submitLogin": "Sign in",
    "auth.submitRegister": "Create account"
  }
};
const SUPPORTED_LANGS = ["ru", "kz", "en"];
const storedLang = localStorage.getItem("site_lang");
let currentLang = SUPPORTED_LANGS.includes(storedLang) ? storedLang : "ru";

function dict(lang = currentLang) {
  const L = SUPPORTED_LANGS.includes(lang) ? lang : "ru";
  return { ...translations.ru, ...translations[L], ...EXTRA_I18N.ru, ...EXTRA_I18N[L] };
}

function t(key) {
  const d = dict();
  return d[key] ?? dict("ru")[key] ?? key;
}

function tf(key, vars = {}) {
  let s = t(key);
  Object.entries(vars).forEach(([k, v]) => {
    s = s.split(`{${k}}`).join(String(v));
  });
  return s;
}

const ROUTING_MODES = ["auto", "passive", "aggressive"];

function orderStatusLabel(status) {
  return t(`page.order.status.${status}`) || t("page.order.status.filled");
}

function orderStatusBadge(status) {
  return `<span class="status-badge status-badge--${status}">${orderStatusLabel(status)}</span>`;
}

function orderSideLabel(side) {
  return t(`page.order.side.${side}`) || t("page.order.side.buy");
}

function orderTypeLabel(orderType) {
  return t(`page.order.type.${orderType}`) || t("page.order.type.market");
}

function orderSideBadge(side) {
  return `<span class="trade-side trade-side--${side}">${orderSideLabel(side)}</span>`;
}

function timeInForceLabel(value) {
  return TIME_IN_FORCE_LABELS[value] || TIME_IN_FORCE_LABELS.gtc;
}

function routingLabel(value) {
  return t(`page.routing.${value}`) || t("page.routing.auto");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatCompactKzt(value) {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function formatSignedPercent(value, digits = 2) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function formatSignedKzt(value) {
  if (value === 0) return formatKzt(0);
  return `${value > 0 ? "+" : "-"}${formatKzt(Math.abs(value))}`;
}

function applyPnlState(node, value) {
  if (!node) return;
  node.classList.toggle("metric-positive", value > 0);
  node.classList.toggle("metric-negative", value < 0);
  node.classList.toggle("metric-neutral", value === 0);
}

function resolveInitialTheme() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function updateThemeToggle(theme) {
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (!themeToggleBtn) return;
  themeToggleBtn.textContent = theme === "dark" ? t("theme.useLight") : t("theme.useDark");
  themeToggleBtn.title = theme === "dark" ? t("theme.toLightHint") : t("theme.toDarkHint");
  themeToggleBtn.dataset.theme = theme;
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  updateThemeToggle(theme);
}

function ensureThemeToggle() {
  const topbarInner = document.querySelector(".bank-topbar__inner");
  const connectBtn = document.getElementById("connectBtn");
  if (!topbarInner || !connectBtn) return;
  let themeToggleBtn = document.getElementById("themeToggleBtn");
  if (!themeToggleBtn) {
    themeToggleBtn = document.createElement("button");
    themeToggleBtn.id = "themeToggleBtn";
    themeToggleBtn.type = "button";
    themeToggleBtn.className = "ghost theme-toggle";
    connectBtn.before(themeToggleBtn);
    themeToggleBtn.addEventListener("click", () => {
      const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  }
  updateThemeToggle(document.body.dataset.theme || resolveInitialTheme());
}

function initTheme() {
  applyTheme(resolveInitialTheme());
  ensureThemeToggle();
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function ensureToastViewport() {
  let viewport = document.getElementById("toastViewport");
  if (viewport) return viewport;
  viewport = document.createElement("div");
  viewport.id = "toastViewport";
  viewport.className = "toast-viewport";
  document.body.appendChild(viewport);
  return viewport;
}

function showToast(message, type = "info", duration = 3200) {
  const viewport = ensureToastViewport();
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<strong>${message}</strong>`;
  viewport.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 220);
  }, duration);
}

function setInlineStatus(element, message = "", type = "info") {
  if (!element) return;
  element.textContent = message;
  element.dataset.state = message ? type : "";
}

function setButtonLoading(button, isLoading, loadingText = "Загрузка...") {
  if (!button) return;
  if (isLoading) {
    if (!button.dataset.idleLabel) button.dataset.idleLabel = button.textContent || "";
    button.dataset.loading = "true";
    button.disabled = true;
    button.textContent = loadingText;
    return;
  }
  button.dataset.loading = "false";
  button.disabled = false;
  if (button.dataset.idleLabel) button.textContent = button.dataset.idleLabel;
}

function clearOnboardingHighlight() {
  document.querySelectorAll(".onboarding-target").forEach((node) => node.classList.remove("onboarding-target"));
}

function getOnboardingTarget(step) {
  return step?.selector ? document.querySelector(step.selector) : null;
}

function finishOnboarding(markSeen = true) {
  clearOnboardingHighlight();
  const overlay = document.getElementById("onboardingOverlay");
  if (overlay) overlay.hidden = true;
  document.body.classList.remove("onboarding-active");
  if (markSeen) localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
}

function renderOnboardingStep(index) {
  const overlay = document.getElementById("onboardingOverlay");
  const title = document.getElementById("onboardingTitle");
  const description = document.getElementById("onboardingDescription");
  const progress = document.getElementById("onboardingProgress");
  const prevBtn = document.getElementById("onboardingPrevBtn");
  const nextBtn = document.getElementById("onboardingNextBtn");
  const skipBtn = document.getElementById("onboardingSkipBtn");
  if (!overlay || !title || !description || !progress || !prevBtn || !nextBtn) return;

  const step = ONBOARDING_STEPS[index];
  if (!step) {
    finishOnboarding(true);
    return;
  }

  clearOnboardingHighlight();
  const target = getOnboardingTarget(step);
  target?.classList.add("onboarding-target");
  target?.scrollIntoView({ behavior: "smooth", block: "center" });

  overlay.hidden = false;
  overlay.dataset.step = String(index);
  document.body.classList.add("onboarding-active");
  title.textContent = t(step.titleKey);
  description.textContent = t(step.descriptionKey);
  progress.textContent = tf("page.onb.step", { n: index + 1, m: ONBOARDING_STEPS.length });
  prevBtn.disabled = index === 0;
  nextBtn.textContent = index === ONBOARDING_STEPS.length - 1 ? t("page.onb.done") : t("page.onb.next");
  if (skipBtn) skipBtn.textContent = t("page.onb.skip");
  if (prevBtn) prevBtn.textContent = t("page.onb.back");
}

function startOnboarding(force = false) {
  if (document.body.dataset.page !== "home") return;
  if (!force && localStorage.getItem(ONBOARDING_STORAGE_KEY)) return;
  ensureOnboardingUi();
  renderOnboardingStep(0);
}

function ensureOnboardingUi() {
  if (document.getElementById("onboardingOverlay")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div id="onboardingOverlay" class="onboarding-overlay" hidden>
        <div class="onboarding-card">
          <span id="onboardingProgress" class="hero-kicker">Шаг 1</span>
          <h3 id="onboardingTitle">Добро пожаловать</h3>
          <p id="onboardingDescription"></p>
          <div class="onboarding-actions">
            <button id="onboardingSkipBtn" class="ghost" type="button">Пропустить</button>
            <div class="onboarding-actions__group">
              <button id="onboardingPrevBtn" class="ghost" type="button">Назад</button>
              <button id="onboardingNextBtn" class="hero-btn" type="button">Дальше</button>
            </div>
          </div>
        </div>
      </div>
    `
  );

  const overlay = document.getElementById("onboardingOverlay");
  const prevBtn = document.getElementById("onboardingPrevBtn");
  const nextBtn = document.getElementById("onboardingNextBtn");
  const skipBtn = document.getElementById("onboardingSkipBtn");

  prevBtn?.addEventListener("click", () => {
    const currentIndex = Number(overlay?.dataset.step || "0");
    renderOnboardingStep(Math.max(0, currentIndex - 1));
  });
  nextBtn?.addEventListener("click", () => {
    const currentIndex = Number(overlay?.dataset.step || "0");
    if (currentIndex >= ONBOARDING_STEPS.length - 1) {
      finishOnboarding(true);
      return;
    }
    renderOnboardingStep(currentIndex + 1);
  });
  skipBtn?.addEventListener("click", () => finishOnboarding(true));
}

function initOnboarding() {
  if (document.body.dataset.page !== "home") return;
  ensureOnboardingUi();
  const guideBtn = document.getElementById("guideBtn");
  if (guideBtn) guideBtn.onclick = () => startOnboarding(true);
  if (!localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
    window.setTimeout(() => startOnboarding(false), 700);
  }
}

function ensureAuthDialog() {
  if (document.getElementById("authDialog")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <dialog id="authDialog" class="dialog auth-dialog">
        <div class="auth-dialog__top">
          <div>
            <span class="hero-kicker" data-i18n="auth.kicker">Доступ к аккаунту</span>
            <h3 id="authDialogTitle">Вход в Aether</h3>
            <p id="authDialogHint" class="auth-dialog__hint">
              Войдите, чтобы размещать ордера и открыть персональный профиль.
            </p>
          </div>
          <button id="authDialogCloseBtn" class="ghost" type="button" data-i18n="btn.close">Закрыть</button>
        </div>
        <div class="auth-mode-switch">
          <button id="authModeLoginBtn" class="ghost auth-mode-btn" type="button" data-i18n="auth.loginTab">Вход</button>
          <button id="authModeRegisterBtn" class="ghost auth-mode-btn" type="button" data-i18n="auth.registerTab">Регистрация</button>
        </div>
        <form id="authForm" class="auth-form">
          <label id="authNameField" class="auth-field auth-field--wide">
            <span data-i18n="auth.nameLabel">Имя</span>
            <input id="authNameInput" type="text" minlength="2" maxlength="40" data-i18n-placeholder="auth.placeholderName" placeholder="Например, Ayan Trader" />
          </label>
          <label class="auth-field">
            <span data-i18n="auth.emailLabel">Email</span>
            <input id="authEmailInput" type="email" required placeholder="trader@aether.exchange" />
          </label>
          <label class="auth-field">
            <span data-i18n="auth.passwordLabel">Пароль</span>
            <input id="authPasswordInput" type="password" minlength="6" required data-i18n-placeholder="auth.placeholderPassword" placeholder="Минимум 6 символов" />
          </label>
          <button id="authSubmitBtn" type="submit">Войти</button>
        </form>
        <p id="authStatus" class="form-status"></p>
      </dialog>
    `
  );

  const dialog = document.getElementById("authDialog");
  const authForm = document.getElementById("authForm");
  const closeBtn = document.getElementById("authDialogCloseBtn");
  const loginBtn = document.getElementById("authModeLoginBtn");
  const registerBtn = document.getElementById("authModeRegisterBtn");

  closeBtn?.addEventListener("click", () => dialog?.close());
  loginBtn?.addEventListener("click", () => applyAuthDialogMode("login"));
  registerBtn?.addEventListener("click", () => applyAuthDialogMode("register"));
  dialog?.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const isOutside =
      event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (isOutside) dialog.close();
  });

  authForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const mode = dialog?.dataset.mode || "login";
    const nameInput = document.getElementById("authNameInput");
    const emailInput = document.getElementById("authEmailInput");
    const passwordInput = document.getElementById("authPasswordInput");
    const authStatus = document.getElementById("authStatus");
    const authSubmitBtn = document.getElementById("authSubmitBtn");
    const name = nameInput?.value?.trim() || "";
    const email = normalizeEmail(emailInput?.value || "");
    const password = passwordInput?.value || "";

    if (!email || !password) {
      setInlineStatus(authStatus, "Заполни email и пароль.", "error");
      return;
    }

    const users = readUsers();
    let successUser = null;
    if (mode === "register") {
      if (name.length < 2) {
        setInlineStatus(authStatus, "Укажи имя не короче 2 символов.", "error");
        return;
      }
      if (password.length < 6) {
        setInlineStatus(authStatus, "Пароль должен содержать минимум 6 символов.", "error");
        return;
      }
      if (users.some((user) => user.email === email)) {
        setInlineStatus(authStatus, "Аккаунт с таким email уже существует.", "error");
        return;
      }
      setInlineStatus(authStatus);
      setButtonLoading(authSubmitBtn, true, "Создаем...");
      await sleep(220);
      successUser = persistUser(createUserRecord(name, email, password));
    } else {
      const user = users.find((item) => item.email === email && item.passwordHash === encodeSecret(password));
      if (!user) {
        setInlineStatus(authStatus, "Неверный email или пароль.", "error");
        return;
      }
      setInlineStatus(authStatus);
      setButtonLoading(authSubmitBtn, true, "Входим...");
      await sleep(180);
      saveAuthSession({ email: user.email });
      successUser = user;
    }

    authForm.reset();
    dialog?.close();
    setButtonLoading(authSubmitBtn, false);
    syncAuthUi();
    showToast(
      mode === "register"
        ? `Аккаунт ${userShortName(successUser)} создан.`
        : `С возвращением, ${userShortName(successUser)}.`,
      "success"
    );
  });

  applyLanguage(currentLang);
  applyAuthDialogMode("login");
}

function applyAuthDialogMode(mode) {
  const dialog = document.getElementById("authDialog");
  const title = document.getElementById("authDialogTitle");
  const hint = document.getElementById("authDialogHint");
  const nameField = document.getElementById("authNameField");
  const nameInput = document.getElementById("authNameInput");
  const submitBtn = document.getElementById("authSubmitBtn");
  const loginBtn = document.getElementById("authModeLoginBtn");
  const registerBtn = document.getElementById("authModeRegisterBtn");
  const authStatus = document.getElementById("authStatus");

  if (!dialog) return;
  dialog.dataset.mode = mode;
  const isRegister = mode === "register";
  if (title) title.textContent = isRegister ? t("auth.titleRegister") : t("auth.titleLogin");
  if (hint) {
    hint.textContent = isRegister ? t("auth.hintRegister") : t("auth.hintLogin");
  }
  if (nameField) nameField.hidden = !isRegister;
  if (nameInput) nameInput.required = isRegister;
  if (submitBtn) submitBtn.textContent = isRegister ? t("auth.submitRegister") : t("auth.submitLogin");
  loginBtn?.classList.toggle("is-active", !isRegister);
  registerBtn?.classList.toggle("is-active", isRegister);
  setInlineStatus(authStatus);
}

function openAuthDialog(mode = "login") {
  ensureAuthDialog();
  applyAuthDialogMode(mode);
  const dialog = document.getElementById("authDialog");
  if (dialog && !dialog.open) dialog.showModal();
}

function logoutCurrentUser() {
  saveAuthSession(null);
  localStorage.removeItem(WALLET_STORAGE_KEY);
  syncAuthUi();
}

function syncAuthUi() {
  const connectBtn = document.getElementById("connectBtn");
  const user = getCurrentUser();
  if (user?.wallet) localStorage.setItem(WALLET_STORAGE_KEY, user.wallet);
  else localStorage.removeItem(WALLET_STORAGE_KEY);
  if (connectBtn) {
    connectBtn.dataset.connected = user ? "true" : "false";
    connectBtn.textContent = user ? userShortName(user) : t("btn.account");
    connectBtn.title = user ? `${userDisplayName(user)} • ${user.email}` : t("connect.hint");
  }
  initOtherPages();
}

function bindWalletButton() {
  const connectBtn = document.getElementById("connectBtn");
  if (!connectBtn) return;
  ensureAuthDialog();
  if (connectBtn.dataset.authBound === "true") {
    syncAuthUi();
    return;
  }
  connectBtn.dataset.authBound = "true";
  connectBtn.addEventListener("click", () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      openAuthDialog("login");
      return;
    }
    localStorage.setItem(WALLET_STORAGE_KEY, currentUser.wallet);
    if (document.body.dataset.page === "profile") {
      document.getElementById("profileForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.location.href = "/profile.html";
  });
  syncAuthUi();
}

function applyLanguage(lang) {
  const normalized = SUPPORTED_LANGS.includes(lang) ? lang : "ru";
  currentLang = normalized;
  localStorage.setItem("site_lang", normalized);
  const dictionary = dict(normalized);
  document.documentElement.lang = normalized === "kz" ? "kk" : normalized === "en" ? "en" : "ru";
  const titleKey = document.body?.dataset?.i18nTitle;
  if (titleKey && dictionary[titleKey] !== undefined) document.title = String(dictionary[titleKey]);

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (!key) return;
    const val = dictionary[key];
    if (val !== undefined) node.textContent = String(val);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    if (!key) return;
    const val = dictionary[key];
    if (val !== undefined) node.placeholder = String(val);
  });
  document.querySelectorAll("option[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (!key) return;
    const val = dictionary[key];
    if (val !== undefined) node.textContent = String(val);
  });

  const activeCampaignLabel = document.getElementById("activeCampaignLabel");
  const campaignInput = document.getElementById("campaignInput");
  if (activeCampaignLabel && campaignInput) {
    activeCampaignLabel.textContent = `${t("misc.activeMarket")} ${campaignTitle(campaignInput.value || "children")}`;
  }

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const isActive = btn.dataset.lang === normalized;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  updateThemeToggle(document.body.dataset.theme || resolveInitialTheme());

  const authDialog = document.getElementById("authDialog");
  if (authDialog?.open) applyAuthDialogMode(authDialog.dataset.mode || "login");

  syncAuthUi();

  window.dispatchEvent(new CustomEvent("aether-locale"));
}

function initLanguage() {
  applyLanguage(currentLang);
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyLanguage(btn.dataset.lang || "ru");
    });
  });
}

function initRevealAnimations() {
  const blocks = document.querySelectorAll(".reveal, .section-block, .hero-banner, .tile, .service-card, .mini-service");
  blocks.forEach((el) => {
    if (!el.classList.contains("reveal")) el.classList.add("reveal");
  });
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );
  blocks.forEach((el) => observer.observe(el));
}

function initMascot() {
  const mascot = document.createElement("div");
  mascot.id = "mascot";
  mascot.innerHTML = `
    <div class="body">
      <div class="eyes">
        <span class="eye"></span>
        <span class="eye"></span>
      </div>
      <span class="smile"></span>
    </div>
  `;
  document.body.appendChild(mascot);
}

function initHomePage() {
  const gridEl = document.getElementById("charityGrid");
  if (!gridEl) return;
  const tooltipEl = document.getElementById("tooltip");
  const occupiedEl = document.getElementById("occupiedCount");
  const totalRaisedEl = document.getElementById("totalRaised");
  const latestDonationEl = document.getElementById("latestDonation");
  const donateNowBtn = document.getElementById("donateNowBtn");
  const donateNowBtnBottom = document.getElementById("donateNowBtnBottom");
  const whitepaperBtn = document.getElementById("whitepaperBtn");
  const whitepaperDialog = document.getElementById("whitepaperDialog");
  const closeWhitepaperBtn = document.getElementById("closeWhitepaperBtn");
  const donationForm = document.getElementById("donationForm");
  const orderSubmitBtn = donationForm?.querySelector('button[type="submit"]');
  const orderSideTabs = document.getElementById("orderSideTabs");
  const orderTypeInput = document.getElementById("orderTypeInput");
  const pixelInput = document.getElementById("pixelInput");
  const amountInput = document.getElementById("amountInput");
  const limitPriceField = document.getElementById("limitPriceField");
  const limitPriceInput = document.getElementById("limitPriceInput");
  const timeInForceInput = document.getElementById("timeInForceInput");
  const routingModeInput = document.getElementById("routingModeInput");
  const reduceOnlyInput = document.getElementById("reduceOnlyInput");
  const messageInput = document.getElementById("messageInput");
  const formStatus = document.getElementById("formStatus");
  const donatePanel = document.getElementById("donatePanel");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const quickAmountButtons = document.querySelectorAll(".quick-amount");
  const avgDonationEl = document.getElementById("avgDonation");
  const largestDonationEl = document.getElementById("largestDonation");
  const topDonorEl = document.getElementById("topDonor");
  const pickFreePixelBtn = document.getElementById("pickFreePixelBtn");
  const smartAmountBtn = document.getElementById("smartAmountBtn");
  const suggestMessageBtn = document.getElementById("suggestMessageBtn");
  const undoLastDonationBtn = document.getElementById("undoLastDonationBtn");
  const resetDemoBtn = document.getElementById("resetDemoBtn");
  const donationFeedList = document.getElementById("donationFeedList");
  const donationFeedCount = document.getElementById("donationFeedCount");
  const donationSearchInput = document.getElementById("donationSearchInput");
  const donationSortSelect = document.getElementById("donationSortSelect");
  const donationMinAmountSelect = document.getElementById("donationMinAmountSelect");
  const donationStatusSelect = document.getElementById("donationStatusSelect");
  const exportDonationsBtn = document.getElementById("exportDonationsBtn");
  const importDonationsBtn = document.getElementById("importDonationsBtn");
  const importDonationsInput = document.getElementById("importDonationsInput");
  const clearFeedFiltersBtn = document.getElementById("clearFeedFiltersBtn");
  const campaignPicker = document.getElementById("campaignPicker");
  const campaignInput = document.getElementById("campaignInput");
  const activeCampaignLabel = document.getElementById("activeCampaignLabel");
  const showOnlyOccupiedInput = document.getElementById("showOnlyOccupiedInput");
  const clearWallSelectionBtn = document.getElementById("clearWallSelectionBtn");
  const wallInspector = document.getElementById("wallInspector");
  const fillLastOrderBtn = document.getElementById("fillLastOrderBtn");
  const marketPrimarySymbol = document.getElementById("marketPrimarySymbol");
  const marketPrimaryPrice = document.getElementById("marketPrimaryPrice");
  const marketPrimaryChange = document.getElementById("marketPrimaryChange");
  const marketPrimaryMeta = document.getElementById("marketPrimaryMeta");
  const marketVolume = document.getElementById("marketVolume");
  const marketSpread = document.getElementById("marketSpread");
  const marketSentimentValue = document.getElementById("marketSentimentValue");
  const marketSentimentBar = document.getElementById("marketSentimentBar");
  const marketHigh = document.getElementById("marketHigh");
  const marketLow = document.getElementById("marketLow");
  const marketVolatility = document.getElementById("marketVolatility");
  const marketSpark = document.getElementById("marketSpark");
  const marketMoversList = document.getElementById("marketMoversList");
  const terminalPreviewType = document.getElementById("terminalPreviewType");
  const terminalPreviewPair = document.getElementById("terminalPreviewPair");
  const terminalPreviewMark = document.getElementById("terminalPreviewMark");
  const terminalPreviewSide = document.getElementById("terminalPreviewSide");
  const terminalPreviewSummary = document.getElementById("terminalPreviewSummary");
  const terminalExecutionPrice = document.getElementById("terminalExecutionPrice");
  const terminalFeeValue = document.getElementById("terminalFeeValue");
  const terminalSlippage = document.getElementById("terminalSlippage");
  const terminalFillMode = document.getElementById("terminalFillMode");
  const terminalTimeInForce = document.getElementById("terminalTimeInForce");
  const terminalRouting = document.getElementById("terminalRouting");
  const terminalNotional = document.getElementById("terminalNotional");
  const terminalFeeRate = document.getElementById("terminalFeeRate");
  let showOnlyOccupied = false;
  let currentCampaignId = campaignInput?.value || "children";
  let currentOrderSide = "buy";
  const marketState = JSON.parse(JSON.stringify(MARKET_WIDGET_SEED));
  const marketMovers = JSON.parse(JSON.stringify(MARKET_MOVER_SEED));

  if (amountInput && Number(amountInput.value) < 250000) {
    amountInput.value = "500000";
  }

  function notifyHome(message, type = "info") {
    setInlineStatus(formStatus);
    showToast(message, type);
  }

  function currentMarket() {
    return marketState[currentCampaignId] || MARKET_WIDGET_SEED[currentCampaignId];
  }

  function suggestedLimitPrice() {
    const market = currentMarket();
    if (!market) return 0;
    const spreadBias = Math.max(0.0015, market.spread / 100);
    const multiplier = currentOrderSide === "buy" ? 1 - spreadBias : 1 + spreadBias;
    return Math.max(1, Math.round(market.price * multiplier));
  }

  function getTerminalEstimate() {
    const market = currentMarket();
    const orderType = ORDER_TYPES.includes(orderTypeInput?.value) ? orderTypeInput.value : "market";
    const timeInForce = TIME_IN_FORCE_LABELS[timeInForceInput?.value] ? timeInForceInput.value : "gtc";
    const routingMode = ROUTING_MODES.includes(routingModeInput?.value) ? routingModeInput.value : "auto";
    const reduceOnly = Boolean(reduceOnlyInput?.checked);
    const amount = Math.max(0, Number(amountInput?.value || 0));
    const markPrice = Math.max(1, Math.round(market?.price || 1));
    const feeBps =
      routingMode === "passive"
        ? orderType === "limit"
          ? 4
          : 8
        : routingMode === "aggressive"
          ? orderType === "market"
            ? 12
            : 8
          : orderType === "limit"
            ? 6
            : 10;
    const depthBase = Math.max(market?.volume || toKzt(800000), 1);
    const impact = amount ? clamp((amount / depthBase) * 110, 0.02, 0.9) : 0.02;
    const routingBias = routingMode === "aggressive" ? 0.18 : routingMode === "passive" ? -0.06 : 0;
    const slippage = Number(
      (orderType === "market" ? market.spread * 0.45 + impact + routingBias : Math.max(0.01, market.spread * 0.2 + routingBias)).toFixed(2)
    );
    const fallbackLimitPrice = suggestedLimitPrice();
    const rawLimitPrice = Number(limitPriceInput?.value || fallbackLimitPrice);
    const sanitizedLimitPrice = Number.isFinite(rawLimitPrice) && rawLimitPrice > 0 ? Math.round(rawLimitPrice) : fallbackLimitPrice;
    const executionPrice =
      orderType === "limit"
        ? sanitizedLimitPrice
        : Math.max(1, Math.round(markPrice * (1 + (currentOrderSide === "buy" ? 1 : -1) * (slippage / 100))));
    const feeAmount = Math.round(amount * (feeBps / 10000));
    let fillModeKey = "page.preview.fillInstant";
    if (orderType === "market") {
      if (routingMode === "aggressive") fillModeKey = "page.preview.fillFullSweep";
      else if (timeInForce === "fok") fillModeKey = "page.preview.fillAON";
      else fillModeKey = "page.preview.fillInstant";
    } else if (routingMode === "passive") {
      fillModeKey = "page.preview.fillPostOnly";
    } else {
      fillModeKey = currentOrderSide === "buy" ? "page.preview.fillBidQueue" : "page.preview.fillAskQueue";
    }
    const routeStr = routingLabel(routingMode);
    const tifStr = timeInForceLabel(timeInForce);
    let summary = tf(
      orderType === "market" ? "page.preview.summaryMarket" : "page.preview.summaryLimit",
      {
        side: orderSideLabel(currentOrderSide),
        pair: campaignTitle(currentCampaignId),
        price: formatCompactKzt(executionPrice),
        route: routeStr,
        tif: tifStr
      }
    );
    if (reduceOnly) summary += t("page.preview.summaryReduceSuffix");
    return {
      orderType,
      amount,
      markPrice,
      executionPrice,
      feeBps,
      feeAmount,
      slippage,
      fillModeKey,
      summary,
      timeInForce,
      routingMode,
      reduceOnly
    };
  }

  function syncLimitPrice(force = false) {
    if (!limitPriceInput || (orderTypeInput?.value || "market") !== "limit") return;
    const currentValue = Number(limitPriceInput.value);
    if (force || !Number.isFinite(currentValue) || currentValue <= 0) {
      limitPriceInput.value = String(suggestedLimitPrice());
    }
  }

  function updateOrderSideUi() {
    orderSideTabs?.querySelectorAll("[data-side]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.side === currentOrderSide);
    });
  }

  function updateSubmitLabel() {
    if (!orderSubmitBtn) return;
    const orderType = ORDER_TYPES.includes(orderTypeInput?.value) ? orderTypeInput.value : "market";
    const side = orderSideLabel(currentOrderSide).toLowerCase();
    orderSubmitBtn.textContent =
      orderType === "market" ? tf("page.order.btnMarket", { side }) : tf("page.order.btnLimit", { side });
  }

  function renderTerminalPreview() {
    const estimate = getTerminalEstimate();
    if (terminalPreviewType) terminalPreviewType.textContent = orderTypeLabel(estimate.orderType);
    if (terminalPreviewPair) terminalPreviewPair.textContent = campaignTitle(currentCampaignId);
    if (terminalPreviewMark) terminalPreviewMark.textContent = formatCompactKzt(estimate.markPrice);
    if (terminalPreviewSide) {
      terminalPreviewSide.textContent = orderSideLabel(currentOrderSide);
      terminalPreviewSide.classList.toggle("trade-side--buy", currentOrderSide === "buy");
      terminalPreviewSide.classList.toggle("trade-side--sell", currentOrderSide === "sell");
    }
    if (terminalPreviewSummary) terminalPreviewSummary.textContent = estimate.summary;
    if (terminalExecutionPrice) terminalExecutionPrice.textContent = formatCompactKzt(estimate.executionPrice);
    if (terminalFeeValue) terminalFeeValue.textContent = formatKzt(estimate.feeAmount);
    if (terminalSlippage) terminalSlippage.textContent = `${estimate.slippage.toFixed(2)}%`;
    if (terminalFillMode) terminalFillMode.textContent = t(estimate.fillModeKey);
    if (terminalTimeInForce) terminalTimeInForce.textContent = timeInForceLabel(estimate.timeInForce);
    if (terminalRouting) terminalRouting.textContent = routingLabel(estimate.routingMode);
    if (terminalNotional) terminalNotional.textContent = tf("page.preview.notionalLine", { amount: formatKzt(estimate.amount) });
    if (terminalFeeRate) {
      const feeLabel = estimate.reduceOnly ? t("page.preview.reduceOnly") : t("page.preview.feeRate");
      terminalFeeRate.textContent = `${feeLabel} · ${(estimate.feeBps / 100).toFixed(2)}%`;
    }
    if (limitPriceField) limitPriceField.hidden = estimate.orderType !== "limit";
    updateOrderSideUi();
    updateSubmitLabel();
  }

  function campaignDonation(pixelIndex) {
    return donationMap.get(donationKey(currentCampaignId, pixelIndex));
  }

  function renderSpark(points) {
    if (!marketSpark) return;
    marketSpark.innerHTML = points
      .map((point) => `<span style="height:${clamp(point, 18, 100)}%"></span>`)
      .join("");
  }

  function renderMovers() {
    if (!marketMoversList) return;
    marketMoversList.innerHTML = marketMovers
      .map(
        (item) => `
          <article class="service-card market-mover-card">
            <div class="market-mover-card__top">
              <strong>${item.symbol}</strong>
              <span class="market-change ${item.change >= 0 ? "market-change--up" : "market-change--down"}">${formatSignedPercent(item.change)}</span>
            </div>
            <h3>${formatCompactKzt(item.price)}</h3>
            <p>${tf("page.market.moverVol", { vol: formatCompactKzt(item.volume) })}</p>
          </article>
        `
      )
      .join("");
  }

  function renderMarketWidgets() {
    const market = marketState[currentCampaignId];
    if (!market) return;
    if (marketPrimarySymbol) marketPrimarySymbol.textContent = market.symbol;
    if (marketPrimaryPrice) marketPrimaryPrice.textContent = formatCompactKzt(market.price);
    if (marketPrimaryChange) {
      marketPrimaryChange.textContent = formatSignedPercent(market.change);
      marketPrimaryChange.classList.toggle("market-change--up", market.change >= 0);
      marketPrimaryChange.classList.toggle("market-change--down", market.change < 0);
    }
    if (marketPrimaryMeta) {
      marketPrimaryMeta.textContent = tf("page.market.meta", {
        vol: formatCompactKzt(market.volume),
        spread: market.spread.toFixed(2),
        funding: formatSignedPercent(market.funding, 3)
      });
    }
    if (marketVolume) marketVolume.textContent = formatCompactKzt(market.volume);
    if (marketSpread) marketSpread.textContent = `${market.spread.toFixed(2)}%`;
    if (marketSentimentValue) marketSentimentValue.textContent = `${market.sentiment} / 100`;
    if (marketSentimentBar) marketSentimentBar.style.width = `${market.sentiment}%`;
    if (marketHigh) marketHigh.textContent = formatCompactKzt(market.high);
    if (marketLow) marketLow.textContent = formatCompactKzt(market.low);
    if (marketVolatility) marketVolatility.textContent = `${market.volatility.toFixed(2)}%`;
    renderSpark(market.spark);
    renderMovers();
    syncLimitPrice();
    renderTerminalPreview();
  }

  function tickMarketWidgets() {
    Object.values(marketState).forEach((market) => {
      const priceDelta = 1 + (Math.random() - 0.5) * 0.018;
      market.price = Math.max(1, Math.round(market.price * priceDelta));
      market.change = clamp(market.change + (Math.random() - 0.5) * 0.42, -8, 9);
      market.volume = Math.max(10000, Math.round(market.volume * (1 + (Math.random() - 0.3) * 0.025)));
      market.spread = clamp(market.spread + (Math.random() - 0.5) * 0.03, 0.02, 0.65);
      market.funding = clamp(market.funding + (Math.random() - 0.5) * 0.004, -0.025, 0.04);
      market.sentiment = clamp(Math.round(market.sentiment + (Math.random() - 0.5) * 6), 28, 91);
      market.high = Math.max(market.high, market.price);
      market.low = Math.min(market.low, market.price);
      market.volatility = clamp(Number((market.volatility + (Math.random() - 0.5) * 0.24 + Math.abs(market.change) * 0.01).toFixed(2)), 0.3, 9.8);
      const nextSparkPoint = clamp(Math.round(market.spark[market.spark.length - 1] + (Math.random() - 0.45) * 12), 18, 100);
      market.spark = [...market.spark.slice(1), nextSparkPoint];
    });

    marketMovers.forEach((item) => {
      item.price = Math.max(1, Math.round(item.price * (1 + (Math.random() - 0.5) * 0.02)));
      item.change = clamp(item.change + (Math.random() - 0.5) * 0.55, -9, 12);
      item.volume = Math.max(10000, Math.round(item.volume * (1 + (Math.random() - 0.35) * 0.03)));
    });

    marketMovers.sort((a, b) => b.change - a.change);
    renderMarketWidgets();
  }

  function latestCampaignOrder({ includeCancelled = false } = {}) {
    return [...donations]
      .reverse()
      .find((item) => item.campaignId === currentCampaignId && (includeCancelled || isOrderActive(item)));
  }

  function updateCampaignUi() {
    if (campaignInput) campaignInput.value = currentCampaignId;
    if (activeCampaignLabel) activeCampaignLabel.textContent = `${t("misc.activeMarket")} ${campaignTitle(currentCampaignId)}`;
    campaignPicker?.querySelectorAll(".campaign-card").forEach((card) => {
      card.classList.toggle("is-active", card.dataset.campaign === currentCampaignId);
    });
  }

  function donationTier(amountUsd) {
    if (amountUsd >= toKzt(700)) return "tier-4";
    if (amountUsd >= toKzt(300)) return "tier-3";
    if (amountUsd >= toKzt(120)) return "tier-2";
    return "tier-1";
  }

  function updateHomeStats() {
    const totals = donationTotals(currentCampaignId);
    occupiedEl.textContent = tf("page.stats.occupied", { n: totals.occupied, max: GRID_SIZE });
    totalRaisedEl.textContent = formatKzt(totals.total);
    if (avgDonationEl) avgDonationEl.textContent = formatKzt(totals.avg);
    if (largestDonationEl) largestDonationEl.textContent = formatKzt(totals.largest);
    if (topDonorEl) topDonorEl.textContent = totals.topDonor;
    const percent = Math.min(100, Math.round((totals.occupied / GRID_SIZE) * 100));
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressText) progressText.textContent = tf("page.stats.progress", { pct: percent });
    const latest = latestCampaignOrder();
    latestDonationEl.textContent = latest
      ? `${orderSideLabel(latest.side).toLowerCase()} ${orderTypeLabel(latest.orderType).toLowerCase()} • #${latest.pixelIndex} • ${formatKzt(latest.amountUsd)}`
      : t("page.stats.latestNone");
  }

  function showTooltip(event, donation, index) {
    tooltipEl.hidden = false;
    tooltipEl.style.left = `${event.clientX + 14}px`;
    tooltipEl.style.top = `${event.clientY + 14}px`;
    tooltipEl.innerHTML = donation
      ? `<strong>${tf("page.tooltip.level", { n: index })}</strong><br>${campaignTitle(donation.campaignId)}<br>${orderSideLabel(donation.side)} ${orderTypeLabel(donation.orderType)} · ${orderStatusLabel(donation.status)}<br>${donation.donor}<br>${formatKzt(donation.amountUsd)}<br>${donation.message}`
      : `<strong>${tf("page.tooltip.level", { n: index })}</strong><br>${t("page.tooltip.available")}`;
  }
  function hideTooltip() {
    tooltipEl.hidden = true;
  }
  function selectCell(cell, index) {
    if (selectedCell) selectedCell.classList.remove("selected");
    selectedCell = cell;
    selectedCell.classList.add("selected");
    pixelInput.value = String(index);
    const donation = campaignDonation(index);
    if (wallInspector) {
      wallInspector.innerHTML = donation
        ? `
          <h4>${tf("page.wall.levelActive", { n: index })}</h4>
          <p><strong>${orderSideLabel(donation.side)} ${orderTypeLabel(donation.orderType)}</strong> · ${formatKzt(donation.amountUsd)}<br/>${orderStatusLabel(donation.status)} · ${donation.message || t("page.feed.noNote")}</p>
          <span>${donation.donor}</span>
        `
        : `
          <h4>${tf("page.wall.levelFree", { n: index })}</h4>
          <p>${t("page.wall.levelFreeP")}</p>
        `;
    }
    donatePanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderGrid() {
    gridEl.classList.add("zoom-fixed");
    const latest = latestCampaignOrder();
    const fragment = document.createDocumentFragment();
    for (let index = 0; index <= MAX_INDEX; index += 1) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.type = "button";
      const donation = campaignDonation(index);
      if (donation) {
        cell.classList.add("occupied", donationTier(donation.amountUsd));
        if (latest && latest.pixelIndex === index) cell.classList.add("is-latest");
      }
      if (showOnlyOccupied && !donation) cell.classList.add("hidden-by-filter");
      cell.addEventListener("mousemove", (event) => showTooltip(event, donation, index));
      cell.addEventListener("mouseleave", hideTooltip);
      cell.addEventListener("click", () => selectCell(cell, index));
      fragment.appendChild(cell);
    }
    gridEl.appendChild(fragment);
  }

  function feedItems() {
    const query = (donationSearchInput?.value || "").trim().toLowerCase();
    const sortMode = donationSortSelect?.value || "latest";
    const minAmount = Number(donationMinAmountSelect?.value || "0");
    const status = donationStatusSelect?.value || "all";
    const filtered = donations.filter((item) => {
      if (item.campaignId !== currentCampaignId) return false;
      if (item.amountUsd < minAmount) return false;
      if (status !== "all" && item.status !== status) return false;
      if (!query) return true;
      return (
        item.donor.toLowerCase().includes(query) ||
        (item.message || "").toLowerCase().includes(query) ||
        String(item.pixelIndex).includes(query)
      );
    });
    if (sortMode === "largest") filtered.sort((a, b) => b.amountUsd - a.amountUsd);
    else if (sortMode === "smallest") filtered.sort((a, b) => a.amountUsd - b.amountUsd);
    else filtered.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    return filtered.slice(0, 14);
  }

  function renderFeed() {
    if (!donationFeedList) return;
    const items = feedItems();
    if (donationFeedCount) {
      const campaignTotal = donations.filter((item) => item.campaignId === currentCampaignId).length;
      donationFeedCount.textContent = tf("page.feed.count", {
        shown: items.length,
        total: campaignTotal,
        market: campaignTitle(currentCampaignId)
      });
    }
    donationFeedList.innerHTML = "";
    if (!items.length) {
      donationFeedList.innerHTML = `<li class="donation-feed__empty">${t("page.feed.empty")}</li>`;
      return;
    }
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const element = document.createElement("li");
      element.className = "donation-feed__item";
      element.innerHTML = `
        <div class="donation-feed__header">
          <strong>${orderSideLabel(item.side)} ${orderTypeLabel(item.orderType)} · ${t("page.feed.level")} #${item.pixelIndex}</strong>
          <div class="donation-feed__badges">
            ${orderSideBadge(item.side)}
            ${orderStatusBadge(item.status)}
          </div>
        </div>
        <span>${campaignTitle(item.campaignId)} · ${formatKzt(item.amountUsd)}</span>
        <span>${item.donor}</span>
        <span>${item.message || t("page.feed.noNote")}</span>
        <span class="donation-feed__meta">
          ${item.orderType === "limit" && item.limitPrice ? `${orderTypeLabel("limit")} ${formatCompactKzt(item.limitPrice)} · ` : ""}
          ${routingLabel(item.routingMode)} · ${timeInForceLabel(item.timeInForce || "gtc")}${item.reduceOnly ? ` · ${t("page.preview.reduceOnly")}` : ""} ·
          ${t("page.feed.feeLabel")} ${formatKzt(item.feeAmount || 0)} · ${formatDateTime(item.updatedAt || item.createdAt)}
        </span>
      `;
      fragment.appendChild(element);
    });
    donationFeedList.appendChild(fragment);
  }

  function rerenderHome() {
    updateCampaignUi();
    gridEl.innerHTML = "";
    renderGrid();
    renderFeed();
    updateHomeStats();
    renderMarketWidgets();
    initOtherPages();
  }

  function pickRandomFreePixel() {
    const occupiedInCampaign = donations.filter((item) => item.campaignId === currentCampaignId && isOrderActive(item)).length;
    if (occupiedInCampaign >= GRID_SIZE) return null;
    let attempts = 0;
    while (attempts < GRID_SIZE * 2) {
      const maybeIndex = Math.floor(Math.random() * GRID_SIZE);
      if (!campaignDonation(maybeIndex)) return maybeIndex;
      attempts += 1;
    }
    for (let index = 0; index < GRID_SIZE; index += 1) {
      if (!campaignDonation(index)) return index;
    }
    return null;
  }

  donateNowBtn?.addEventListener("click", () => {
    donatePanel.scrollIntoView({ behavior: "smooth", block: "center" });
    pixelInput.focus();
  });
  donateNowBtnBottom?.addEventListener("click", () => {
    donatePanel.scrollIntoView({ behavior: "smooth", block: "center" });
    pixelInput.focus();
  });
  whitepaperBtn?.addEventListener("click", () => whitepaperDialog.showModal());
  closeWhitepaperBtn?.addEventListener("click", () => whitepaperDialog.close());
  whitepaperDialog?.addEventListener("click", (event) => {
    const rect = whitepaperDialog.getBoundingClientRect();
    const isOutside =
      event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (isOutside) whitepaperDialog.close();
  });

  quickAmountButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const amount = button.dataset.amount;
      if (amount) {
        amountInput.value = amount;
        renderTerminalPreview();
      }
    });
  });
  orderSideTabs?.querySelectorAll("[data-side]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextSide = button.dataset.side;
      if (!ORDER_SIDES.includes(nextSide)) return;
      currentOrderSide = nextSide;
      syncLimitPrice(true);
      renderTerminalPreview();
    });
  });
  orderTypeInput?.addEventListener("change", () => {
    syncLimitPrice(true);
    renderTerminalPreview();
  });
  timeInForceInput?.addEventListener("change", renderTerminalPreview);
  routingModeInput?.addEventListener("change", renderTerminalPreview);
  reduceOnlyInput?.addEventListener("change", renderTerminalPreview);
  amountInput?.addEventListener("input", renderTerminalPreview);
  limitPriceInput?.addEventListener("input", renderTerminalPreview);
  smartAmountBtn?.addEventListener("click", () => {
    const totals = donationTotals(currentCampaignId);
    const suggested = totals.avg > 0 ? Math.max(toKzt(500), Math.round(totals.avg / 10000) * 10000) : toKzt(1000);
    amountInput.value = String(suggested);
    renderTerminalPreview();
    notifyHome(tf("page.quick.suggestedSize", { amount: formatKzt(suggested) }));
  });
  suggestMessageBtn?.addEventListener("click", () => {
    const amount = Number(amountInput.value) || 0;
    const suggestions =
      currentOrderSide === "sell"
        ? amount >= toKzt(500)
          ? ["Take profit into strength", "Reduce risk near resistance"]
          : ["Light trim on bounce", "Scaling out into liquidity"]
        : amount >= toKzt(500)
          ? ["Accumulating into strength", "Defensive liquidity allocation"]
          : amount >= toKzt(100)
            ? ["Core pair scaling", "Momentum entry confirmed"]
            : ["Test position opened", "Watching liquidity response"];
    const next = suggestions[Math.floor(Math.random() * suggestions.length)];
    messageInput.value = next;
    notifyHome("Подставили торговую заметку в форму.");
  });
  pickFreePixelBtn?.addEventListener("click", () => {
    const freePixel = pickRandomFreePixel();
    if (freePixel === null) {
      notifyHome("Свободных уровней больше нет.", "error");
      return;
    }
    pixelInput.value = String(freePixel);
    notifyHome(`Выбран свободный уровень #${freePixel} в рынке "${campaignTitle(currentCampaignId)}".`);
  });
  campaignPicker?.querySelectorAll(".campaign-card").forEach((card) => {
    card.addEventListener("click", () => {
      currentCampaignId = card.dataset.campaign || "children";
      syncLimitPrice(true);
      updateCampaignUi();
      rerenderHome();
    });
  });
  campaignInput?.addEventListener("change", () => {
    currentCampaignId = campaignInput.value || "children";
    syncLimitPrice(true);
    updateCampaignUi();
    rerenderHome();
  });
  showOnlyOccupiedInput?.addEventListener("change", () => {
    showOnlyOccupied = showOnlyOccupiedInput.checked;
    rerenderHome();
  });
  clearWallSelectionBtn?.addEventListener("click", () => {
    if (selectedCell) selectedCell.classList.remove("selected");
    selectedCell = null;
    if (wallInspector) {
      wallInspector.innerHTML = `
        <h4>${t("page.wall.clearTitle")}</h4>
        <p>${t("page.wall.clearP")}</p>
      `;
    }
  });
  resetDemoBtn?.addEventListener("click", () => {
    replaceDonations(seedDonations);
    rerenderHome();
    notifyHome(t("page.notify.resetDemo"), "success");
  });
  undoLastDonationBtn?.addEventListener("click", () => {
    const lastDonation = latestCampaignOrder();
    if (!lastDonation) {
      notifyHome(t("page.notify.undoNone"), "error");
      return;
    }
    lastDonation.status = "cancelled";
    lastDonation.updatedAt = Date.now();
    syncDonationState();
    rerenderHome();
    notifyHome(
      tf("page.notify.undoOk", { level: lastDonation.pixelIndex, market: campaignTitle(lastDonation.campaignId) }),
      "success"
    );
  });
  fillLastOrderBtn?.addEventListener("click", () => {
    const lastOpenOrder = [...donations]
      .reverse()
      .find((item) => item.campaignId === currentCampaignId && item.status === "open");
    if (!lastOpenOrder) {
      notifyHome("Нет открытых ордеров для подтверждения.", "error");
      return;
    }
    lastOpenOrder.status = "filled";
    lastOpenOrder.updatedAt = Date.now();
    syncDonationState();
    rerenderHome();
    notifyHome(`Ордер на уровне #${lastOpenOrder.pixelIndex} переведен в статус "Исполнен".`, "success");
  });
  donationSearchInput?.addEventListener("input", renderFeed);
  donationSortSelect?.addEventListener("change", renderFeed);
  donationMinAmountSelect?.addEventListener("change", renderFeed);
  donationStatusSelect?.addEventListener("change", renderFeed);
  clearFeedFiltersBtn?.addEventListener("click", () => {
    if (donationSearchInput) donationSearchInput.value = "";
    if (donationSortSelect) donationSortSelect.value = "latest";
    if (donationMinAmountSelect) donationMinAmountSelect.value = "0";
    if (donationStatusSelect) donationStatusSelect.value = "all";
    renderFeed();
  });
  exportDonationsBtn?.addEventListener("click", () => {
    const payload = JSON.stringify(
      [...donations].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)),
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `market-orders-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifyHome("История ордеров экспортирована в JSON.", "success");
  });
  importDonationsBtn?.addEventListener("click", () => importDonationsInput?.click());
  importDonationsInput?.addEventListener("change", async () => {
    const file = importDonationsInput.files?.[0];
    if (!file) return;
    setButtonLoading(importDonationsBtn, true, "Импорт...");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("invalid");
      let imported = 0;
      parsed.forEach((item) => {
        const campaignId =
          typeof item?.campaignId === "string" && CAMPAIGNS.some((campaign) => campaign.id === item.campaignId)
            ? item.campaignId
            : currentCampaignId;
        const pixelIndex = Number(item?.pixelIndex);
        const amountUsd = Number(item?.amountUsd);
        const status = ORDER_STATUSES.includes(item?.status) ? item.status : "filled";
        const side = ORDER_SIDES.includes(item?.side) ? item.side : "buy";
        const orderType = ORDER_TYPES.includes(item?.orderType) ? item.orderType : "market";
        if (!Number.isInteger(pixelIndex) || pixelIndex < 0 || pixelIndex > MAX_INDEX) return;
        if (!Number.isFinite(amountUsd) || amountUsd <= 0) return;
        if (status !== "cancelled" && donationMap.has(donationKey(campaignId, pixelIndex))) return;
        const donation = enrichDonation(
          {
            campaignId,
            pixelIndex,
            amountUsd,
            donor: typeof item?.donor === "string" && item.donor.trim() ? item.donor : "0xImport...000",
            message: typeof item?.message === "string" ? item.message.slice(0, 80) : "Imported order flow",
            createdAt: Number.isFinite(Number(item?.createdAt)) ? Number(item.createdAt) : Date.now(),
            updatedAt: Number.isFinite(Number(item?.updatedAt)) ? Number(item.updatedAt) : Date.now(),
            status,
            side,
            orderType,
            limitPrice: Number.isFinite(Number(item?.limitPrice)) ? Number(item.limitPrice) : null,
            executionPrice: Number.isFinite(Number(item?.executionPrice)) ? Number(item.executionPrice) : null,
            feeBps: Number.isFinite(Number(item?.feeBps)) ? Number(item.feeBps) : undefined,
            feeAmount: Number.isFinite(Number(item?.feeAmount)) ? Number(item.feeAmount) : undefined,
            timeInForce: typeof item?.timeInForce === "string" ? item.timeInForce : "gtc",
            routingMode: typeof item?.routingMode === "string" ? item.routingMode : "auto",
            reduceOnly: Boolean(item?.reduceOnly)
          },
          donations.length + imported
        );
        donations.push(donation);
        imported += 1;
      });
      syncDonationState();
      rerenderHome();
      notifyHome(
        imported
          ? `Импортировано ${imported} ордеров.`
          : "Не удалось импортировать новые ордера (проверь формат или уникальность уровней).",
        imported ? "success" : "error"
      );
    } catch {
      notifyHome("Ошибка импорта JSON. Проверь структуру файла.", "error");
    } finally {
      setButtonLoading(importDonationsBtn, false);
      importDonationsInput.value = "";
    }
  });

  donationForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const currentUser = getCurrentUser();
    const campaignId = campaignInput?.value || currentCampaignId;
    const pixelIndex = Number(pixelInput.value);
    const amountUsd = Number(amountInput.value);
    const orderType = ORDER_TYPES.includes(orderTypeInput?.value) ? orderTypeInput.value : "market";
    const message = messageInput.value.trim();
    const estimate = getTerminalEstimate();
    const limitPrice = orderType === "limit" ? Number(limitPriceInput?.value) : null;

    if (!currentUser) {
      notifyHome("Авторизуйтесь, чтобы размещать ордера и сохранять их в профиле.", "error");
      openAuthDialog("login");
      return;
    }

    if (!Number.isInteger(pixelIndex) || pixelIndex < 0 || pixelIndex > MAX_INDEX) {
      notifyHome(
        currentLang === "en"
          ? "Choose a valid liquidity level between 0 and 999."
          : currentLang === "kz"
            ? "0 мен 999 аралығындағы деңгейді таңдаңыз."
            : "Выберите уровень от 0 до 999.",
        "error"
      );
      return;
    }
    if (donationMap.has(donationKey(campaignId, pixelIndex))) {
      notifyHome(
        currentLang === "en"
          ? `Level #${pixelIndex} is already active. Pick another one.`
          : currentLang === "kz"
            ? `#${pixelIndex} деңгейі бос емес. Басқасын таңдаңыз.`
            : `Уровень #${pixelIndex} уже активен. Выберите другой.`,
        "error"
      );
      return;
    }
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      notifyHome(
        currentLang === "en"
          ? "Order size must be greater than 0."
          : currentLang === "kz"
            ? "Ордер көлемі 0-ден үлкен болуы керек."
            : "Размер ордера должен быть больше 0.",
        "error"
      );
      return;
    }
    if (orderType === "limit" && (!Number.isFinite(limitPrice) || limitPrice <= 0)) {
      notifyHome("Укажи корректную limit price для пассивного ордера.", "error");
      return;
    }

    setButtonLoading(orderSubmitBtn, true, "Размещаем...");
    await sleep(260);
    const donor = currentUser.wallet;
    const donation = {
      campaignId,
      pixelIndex,
      donor,
      amountUsd,
      message,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      side: currentOrderSide,
      orderType,
      limitPrice: orderType === "limit" ? Math.round(limitPrice) : null,
      executionPrice: estimate.executionPrice,
      feeBps: estimate.feeBps,
      feeAmount: estimate.feeAmount,
      timeInForce: estimate.timeInForce,
      routingMode: estimate.routingMode,
      reduceOnly: estimate.reduceOnly,
      status: orderType === "market" ? "filled" : "open"
    };
    donations.push(donation);
    syncDonationState();
    currentCampaignId = campaignId;
    rerenderHome();
    setButtonLoading(orderSubmitBtn, false);
    notifyHome(
      tf(orderType === "market" ? "page.notify.orderOkMarket" : "page.notify.orderOkLimit", {
        level: pixelIndex,
        amount: formatKzt(amountUsd)
      }),
      "success"
    );
    donationForm.reset();
    if (campaignInput) campaignInput.value = currentCampaignId;
    amountInput.value = "500000";
    orderTypeInput.value = "market";
    if (timeInForceInput) timeInForceInput.value = "gtc";
    if (routingModeInput) routingModeInput.value = "auto";
    if (reduceOnlyInput) reduceOnlyInput.checked = false;
    syncLimitPrice(true);
    renderTerminalPreview();
  });

  syncLimitPrice(true);
  renderTerminalPreview();
  rerenderHome();
  renderMarketWidgets();
  setHomeLocaleRefresh(() => {
    updateCampaignUi();
    updateHomeStats();
    renderFeed();
    renderMarketWidgets();
    renderTerminalPreview();
    const overlay = document.getElementById("onboardingOverlay");
    if (overlay && !overlay.hidden) {
      const step = Number(overlay.dataset.step || "0");
      renderOnboardingStep(Number.isFinite(step) ? step : 0);
    }
    if (wallInspector && !selectedCell) {
      wallInspector.innerHTML = `<h4>${t("page.wall.clearTitle")}</h4><p>${t("page.wall.clearP")}</p>`;
    }
  });
  window.setInterval(tickMarketWidgets, 3200);
}

function renderProfilePage() {
  const authGate = document.getElementById("profileAuthGate");
  const workspace = document.getElementById("profileWorkspace");
  const activitySection = document.getElementById("profileActivitySection");
  const openAuthBtn = document.getElementById("openAuthFromProfileBtn");

  if (openAuthBtn) openAuthBtn.onclick = () => openAuthDialog("login");
  if (!authGate || !workspace || !activitySection) return;

  const user = getCurrentUser();
  if (!user) {
    authGate.hidden = false;
    workspace.hidden = true;
    activitySection.hidden = true;
    return;
  }

  const stats = getUserStats(user);
  const favoriteMarket = stats.historyCount ? stats.favoriteMarket : user.preferredMarket;
  authGate.hidden = true;
  workspace.hidden = false;
  activitySection.hidden = false;

  const profileAvatar = document.getElementById("profileAvatar");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileAddress = document.getElementById("profileAddress");
  const profileStatusText = document.getElementById("profileStatusText");
  const profileRiskChip = document.getElementById("profileRiskChip");
  const profileMarketChip = document.getElementById("profileMarketChip");
  const profileDonations = document.getElementById("profileDonations");
  const profilePixels = document.getElementById("profilePixels");
  const profileTotal = document.getElementById("profileTotal");
  const profileAvg = document.getElementById("profileAvg");
  const profileLargest = document.getElementById("profileLargest");
  const profileTotalPnl = document.getElementById("profileTotalPnl");
  const profileRealizedPnl = document.getElementById("profileRealizedPnl");
  const profileWinRate = document.getElementById("profileWinRate");
  const profileAccountTier = document.getElementById("profileAccountTier");
  const profileOpenCount = document.getElementById("profileOpenCount");
  const profileFilledCount = document.getElementById("profileFilledCount");
  const profileCancelledCount = document.getElementById("profileCancelledCount");
  const profileFavoriteMarket = document.getElementById("profileFavoriteMarket");
  const profileMemberSince = document.getElementById("profileMemberSince");
  const profileAvgHold = document.getElementById("profileAvgHold");
  const profileBestMarket = document.getElementById("profileBestMarket");
  const profileBioPreview = document.getElementById("profileBioPreview");
  const profileWatchlist = document.getElementById("profileWatchlist");
  const copyAddressBtn = document.getElementById("copyAddressBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileForm = document.getElementById("profileForm");
  const profileFormStatus = document.getElementById("profileFormStatus");
  const profileActivityList = document.getElementById("profileActivityList");
  const profileNameInput = document.getElementById("profileNameInput");
  const profileEmailInput = document.getElementById("profileEmailInput");
  const profileMarketInput = document.getElementById("profileMarketInput");
  const profileRiskInput = document.getElementById("profileRiskInput");
  const profileBioInput = document.getElementById("profileBioInput");
  const profileSubmitBtn = profileForm?.querySelector('button[type="submit"]');

  if (profileAvatar) profileAvatar.textContent = userInitials(user);
  if (profileName) profileName.textContent = userDisplayName(user);
  if (profileEmail) profileEmail.textContent = user.email;
  if (profileAddress) profileAddress.textContent = user.wallet;
  if (profileStatusText) {
    const since = formatMemberSince(user.memberSince);
    const tail = stats.historyCount ? t("page.profile.statusSynced") : t("page.profile.statusPending");
    profileStatusText.textContent = `${tf("page.profile.statusIntro", { since })} ${tail}`;
  }
  if (profileRiskChip) profileRiskChip.textContent = user.riskLevel;
  if (profileMarketChip) profileMarketChip.textContent = favoriteMarket;
  if (profileDonations) profileDonations.textContent = tf("page.profile.ordersCount", { n: stats.historyCount });
  if (profilePixels) profilePixels.textContent = `${stats.activeLevels} / ${GRID_SIZE}`;
  if (profileTotal) profileTotal.textContent = formatKzt(stats.total);
  if (profileAvg) profileAvg.textContent = formatKzt(stats.avg);
  if (profileLargest) profileLargest.textContent = formatKzt(stats.largest);
  if (profileTotalPnl) profileTotalPnl.textContent = formatSignedKzt(stats.totalPnl);
  if (profileRealizedPnl) profileRealizedPnl.textContent = formatSignedKzt(stats.realizedPnl);
  if (profileWinRate) profileWinRate.textContent = `${stats.winRate}%`;
  if (profileAccountTier) profileAccountTier.textContent = stats.accountTier;
  applyPnlState(profileTotalPnl, stats.totalPnl);
  applyPnlState(profileRealizedPnl, stats.realizedPnl);
  if (profileOpenCount) profileOpenCount.textContent = String(stats.openCount);
  if (profileFilledCount) profileFilledCount.textContent = String(stats.filledCount);
  if (profileCancelledCount) profileCancelledCount.textContent = String(stats.cancelledCount);
  if (profileFavoriteMarket) profileFavoriteMarket.textContent = favoriteMarket;
  if (profileMemberSince) profileMemberSince.textContent = tf("page.profile.memberSinceShort", { date: formatMemberSince(user.memberSince) });
  if (profileAvgHold) profileAvgHold.textContent = tf("page.profile.avgHoldHours", { n: stats.avgHoldingHours });
  if (profileBestMarket) profileBestMarket.textContent = stats.bestMarket;
  if (profileBioPreview) profileBioPreview.textContent = user.bio;

  if (profileWatchlist) {
    const maxExposure = Math.max(...stats.watchlist.map((item) => item.exposure), 0);
    profileWatchlist.innerHTML = stats.watchlist
      .map(
        (item) => `
          <article class="mini-service watchlist-card">
            <div class="watchlist-card__top">
              <strong>${item.title}</strong>
              <span class="market-change ${item.change >= 0 ? "market-change--up" : "market-change--down"}">${formatSignedPercent(item.change)}</span>
            </div>
            <h3>${formatCompactKzt(item.price)}</h3>
            <p>${item.signal}</p>
            <div class="watchlist-card__allocation"><span style="width:${maxExposure ? Math.max(10, Math.round((item.exposure / maxExposure) * 100)) : 10}%"></span></div>
            <div class="watchlist-card__meta">
              <span>${t("page.profile.watchExposure")} ${item.exposure ? formatCompactKzt(item.exposure) : "₸0"}</span>
              <span class="${item.pnl > 0 ? "metric-positive" : item.pnl < 0 ? "metric-negative" : "metric-neutral"}">${formatSignedKzt(item.pnl)}</span>
            </div>
          </article>
        `
      )
      .join("");
  }

  if (profileNameInput) profileNameInput.value = userDisplayName(user);
  if (profileEmailInput) profileEmailInput.value = user.email;
  if (profileMarketInput) profileMarketInput.value = user.preferredMarket;
  if (profileRiskInput) profileRiskInput.value = user.riskLevel;
  if (profileBioInput) profileBioInput.value = user.bio;

  if (profileActivityList) {
    profileActivityList.innerHTML = stats.trades.length
      ? stats.trades
          .slice(0, 4)
          .map(
            (trade) => `
              <article>
                <div class="donation-feed__header">
                  <h4>${tf("page.profile.activityHeading", { pair: campaignTitle(trade.campaignId), level: trade.pixelIndex })}</h4>
                  ${orderStatusBadge(trade.status)}
                </div>
                <p>${formatKzt(trade.amountUsd)} · ${trade.message || t("page.feed.noNote")}</p>
                <span>${formatRelativeTime(trade.updatedAt || trade.createdAt)}</span>
              </article>
            `
          )
          .join("")
      : `
          <article class="profile-empty">
            <h4>${t("page.profile.activityEmptyH")}</h4>
            <p>${t("page.profile.activityEmptyP")}</p>
            <span>${t("page.profile.activityEmptyHint")}</span>
          </article>
        `;
  }

  if (copyAddressBtn) {
    copyAddressBtn.onclick = async () => {
      const value = profileAddress?.textContent || user.wallet;
      try {
        await navigator.clipboard.writeText(value);
        showToast(t("page.profile.toastCopied"), "success");
      } catch {
        showToast(t("page.profile.toastCopyErr"), "error");
      }
    };
  }

  if (logoutBtn) {
    logoutBtn.onclick = () => {
      logoutCurrentUser();
      window.location.href = "/index.html";
    };
  }

  if (profileForm) {
    profileForm.onsubmit = async (event) => {
      event.preventDefault();
      const nextName = profileNameInput?.value?.trim() || "";
      if (nextName.length < 2) {
        setInlineStatus(profileFormStatus, t("page.profile.formNameShort"), "error");
        return;
      }
      setInlineStatus(profileFormStatus);
      setButtonLoading(profileSubmitBtn, true, t("page.profile.formSaving"));
      await sleep(220);
      const nextUser = persistUser({
        ...user,
        name: nextName,
        preferredMarket: profileMarketInput?.value || user.preferredMarket,
        riskLevel: profileRiskInput?.value || user.riskLevel,
        bio: profileBioInput?.value?.trim() || user.bio
      });
      syncAuthUi();
      setButtonLoading(profileSubmitBtn, false);
      const nextStatus = document.getElementById("profileFormStatus");
      setInlineStatus(nextStatus);
      showToast(tf("page.profile.formSavedToast", { name: userShortName(nextUser) }), "success");
    };
  }
}

function initOtherPages() {
  const totals = donationTotals();
  const impactRaised = document.getElementById("impactRaised");
  const impactPixels = document.getElementById("impactPixels");
  const impactAvg = document.getElementById("impactAvg");

  if (impactRaised) impactRaised.textContent = formatKzt(totals.total);
  if (impactPixels) impactPixels.textContent = `${totals.occupied} / ${GRID_SIZE}`;
  if (impactAvg) impactAvg.textContent = formatKzt(totals.avg);
  renderProfilePage();
}

window.addEventListener("aether-locale", () => {
  homeLocaleRefresh?.();
  if (document.body?.dataset?.page === "profile") renderProfilePage();
  initOtherPages();
});

initTheme();
bindWalletButton();
initLanguage();
initRevealAnimations();
initMascot();
initHomePage();
initOtherPages();
initOnboarding();
