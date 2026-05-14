export const GRID_SIZE = 1000;
export const MAX_INDEX = GRID_SIZE - 1;
export const ORDER_SIDES = ["buy", "sell"] as const;
export type OrderSide = (typeof ORDER_SIDES)[number];
export const ORDER_STATUSES = ["open", "filled", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const ORDER_TYPES = ["market", "limit"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const WALLET_STORAGE_KEY = "aether_wallet_demo";
const USERS_KEY = "aether_users_v1";
const SESSION_KEY = "aether_session_v1";
const DONATIONS_KEY = "aether_donations_v1";

export const CAMPAIGNS = [
  { id: "children", title: "Помощь детям" },
  { id: "animals", title: "Помощь животным" },
  { id: "elderly", title: "Помощь пожилым" }
] as const;

export type CampaignId = (typeof CAMPAIGNS)[number]["id"];

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  wallet: string;
  memberSince: number;
  preferredMarket: string;
  riskLevel: string;
  bio: string;
};

export type Donation = {
  id: string;
  campaignId: string;
  pixelIndex: number;
  donor: string;
  amountUsd: number;
  message: string;
  createdAt: number;
  updatedAt: number;
  status: OrderStatus;
  side: OrderSide;
  orderType: OrderType;
  limitPrice: number | null;
  executionPrice?: number;
  feeBps?: number;
  feeAmount?: number;
  timeInForce?: string;
  routingMode?: string;
  reduceOnly?: boolean;
};

export const donations: Donation[] = [];
export const donationMap = new Map<string, Donation>();

export function donationKey(campaignId: string, pixelIndex: number): string {
  return `${campaignId}:${pixelIndex}`;
}

export function campaignTitle(campaignId: string): string {
  return CAMPAIGNS.find((c) => c.id === campaignId)?.title ?? campaignId;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function encodeSecret(password: string): string {
  let h = 2166136261;
  for (let i = 0; i < password.length; i += 1) {
    h ^= password.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `ph${(h >>> 0).toString(16)}_${password.length}`;
}

function randomWallet(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex.slice(0, 4)}…${hex.slice(-3)}`;
}

export function createUserRecord(name: string, email: string, password: string): User {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizeEmail(email),
    passwordHash: encodeSecret(password),
    wallet: randomWallet(),
    memberSince: Date.now(),
    preferredMarket: CAMPAIGNS[0].title,
    riskLevel: "Сбалансированный",
    bio: ""
  };
}

export function readUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as User[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistUser(user: User): User {
  const users = readUsers().filter((u) => u.id !== user.id && u.email !== user.email);
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return user;
}

export function saveAuthSession(email: string | null): void {
  if (!email) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify({ email: normalizeEmail(email) }));
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { email } = JSON.parse(raw) as { email: string };
    return readUsers().find((u) => u.email === normalizeEmail(email)) ?? null;
  } catch {
    return null;
  }
}

export function toKzt(n: number): number {
  return Math.round(n);
}

export function formatKzt(value: number): string {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatMemberSince(ts: number): string {
  return new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(new Date(ts));
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} ч`;
  return `${Math.floor(h / 24)} дн`;
}

export function formatDateTime(ts: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(ts));
}

export function userInitials(user: User): string {
  const p = user.name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "AE";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}

export function userDisplayName(user: User): string {
  return user.name.trim() || user.email;
}

export function userShortName(user: User): string {
  const n = user.name.trim();
  if (n.length <= 14) return n || user.email.split("@")[0];
  return `${n.slice(0, 12)}…`;
}

export function isOrderActive(d: Donation): boolean {
  return d.status === "open" || d.status === "filled";
}

export function donationTotals(campaignId?: string) {
  const list = campaignId ? donations.filter((d) => d.campaignId === campaignId) : donations;
  const occupied = list.filter((d) => isOrderActive(d)).length;
  const total = list.reduce((s, d) => s + d.amountUsd, 0);
  const avg = occupied ? total / occupied : 0;
  const largest = list.reduce((m, d) => Math.max(m, d.amountUsd), 0);
  const topDonor = list[0]?.donor ?? "-";
  return { occupied, total, avg, largest, topDonor };
}

export type WatchItem = {
  title: string;
  change: number;
  price: number;
  signal: string;
  exposure: number;
  pnl: number;
};

export type UserStats = {
  historyCount: number;
  activeLevels: number;
  total: number;
  avg: number;
  largest: number;
  totalPnl: number;
  realizedPnl: number;
  winRate: number;
  accountTier: string;
  openCount: number;
  filledCount: number;
  cancelledCount: number;
  favoriteMarket: string;
  avgHoldingHours: number;
  bestMarket: string;
  watchlist: WatchItem[];
  trades: Donation[];
};

export function getUserStats(user: User): UserStats {
  const trades = donations.filter((d) => d.donor === user.wallet);
  const historyCount = trades.length;
  const activeLevels = trades.filter((d) => d.status !== "cancelled").length;
  const total = trades.reduce((s, d) => s + d.amountUsd, 0);
  const avg = historyCount ? total / historyCount : 0;
  const largest = trades.reduce((m, d) => Math.max(m, d.amountUsd), 0);
  const openCount = trades.filter((d) => d.status === "open").length;
  const filledCount = trades.filter((d) => d.status === "filled").length;
  const cancelledCount = trades.filter((d) => d.status === "cancelled").length;
  const byMarket: Record<string, number> = {};
  trades.forEach((t) => {
    byMarket[t.campaignId] = (byMarket[t.campaignId] ?? 0) + t.amountUsd;
  });
  let favoriteMarket = user.preferredMarket;
  let bestVal = 0;
  Object.entries(byMarket).forEach(([k, v]) => {
    if (v > bestVal) {
      bestVal = v;
      favoriteMarket = campaignTitle(k);
    }
  });
  return {
    historyCount,
    activeLevels,
    total,
    avg,
    largest,
    totalPnl: Math.round(total * 0.02),
    realizedPnl: Math.round(filledCount * 1200),
    winRate: historyCount ? Math.min(99, Math.round((filledCount / historyCount) * 100)) : 0,
    accountTier: historyCount > 20 ? "Pro" : "Explorer",
    openCount,
    filledCount,
    cancelledCount,
    favoriteMarket,
    avgHoldingHours: 4 + (historyCount % 12),
    bestMarket: favoriteMarket,
    watchlist: [
      {
        title: "Помощь детям",
        change: 1.2,
        price: toKzt(84300),
        signal: "Прогресс",
        exposure: toKzt(120000),
        pnl: toKzt(400)
      },
      {
        title: "Помощь животным",
        change: -0.4,
        price: toKzt(218),
        signal: "Прогресс",
        exposure: toKzt(80000),
        pnl: -toKzt(120)
      },
      { title: "Помощь пожилым", change: 0.1, price: toKzt(1.02), signal: "Прогресс", exposure: toKzt(20000), pnl: toKzt(40) }
    ],
    trades: [...trades].sort((a, b) => b.updatedAt - a.updatedAt)
  };
}

export function enrichDonation(partial: Omit<Donation, "id">, seq: number): Donation {
  return { ...partial, id: `d-${Date.now()}-${seq}` };
}

export function seedDonations(): Donation[] {
  const demo: Donation[] = [];
  const base = Date.now() - 86400000;
  for (let i = 0; i < 8; i += 1) {
    const campaignId = CAMPAIGNS[i % 3].id;
    const pixelIndex = 10 + i * 37;
    const d = enrichDonation(
      {
        campaignId,
        pixelIndex,
        donor: "0xDemo…Wallet",
        amountUsd: toKzt(250000 + i * 50000),
        message: i % 2 ? "Core scale" : "Momentum add",
        createdAt: base + i * 3600000,
        updatedAt: base + i * 3600000,
        status: i % 5 === 0 ? "open" : "filled",
        side: i % 2 ? "buy" : "sell",
        orderType: i % 3 ? "market" : "limit",
        limitPrice: i % 3 ? null : toKzt(84000),
        executionPrice: toKzt(84200),
        feeBps: 8,
        feeAmount: toKzt(200 + i * 20),
        timeInForce: "gtc",
        routingMode: "auto",
        reduceOnly: false
      },
      i
    );
    demo.push(d);
  }
  return demo;
}

export function replaceDonations(next: Donation[]): void {
  donations.length = 0;
  donationMap.clear();
  next.forEach((d) => {
    donations.push(d);
    donationMap.set(donationKey(d.campaignId, d.pixelIndex), d);
  });
  localStorage.setItem(DONATIONS_KEY, JSON.stringify(donations));
}

export function syncDonationState(): void {
  donationMap.clear();
  donations.forEach((d) => {
    donationMap.set(donationKey(d.campaignId, d.pixelIndex), d);
  });
  localStorage.setItem(DONATIONS_KEY, JSON.stringify(donations));
}

/** Append one donation if the (campaign, pixel) slot is free. */
export function appendDonation(partial: Omit<Donation, "id">): Donation | null {
  const key = donationKey(partial.campaignId, partial.pixelIndex);
  if (donationMap.has(key)) return null;
  const row = enrichDonation(partial, donations.length);
  donations.push(row);
  syncDonationState();
  return row;
}

export function loadDonationsFromStorage(): void {
  try {
    const raw = localStorage.getItem(DONATIONS_KEY);
    if (!raw) {
      replaceDonations(seedDonations());
      return;
    }
    const parsed = JSON.parse(raw) as Donation[];
    if (!Array.isArray(parsed) || !parsed.length) {
      replaceDonations(seedDonations());
      return;
    }
    replaceDonations(parsed);
  } catch {
    replaceDonations(seedDonations());
  }
}
