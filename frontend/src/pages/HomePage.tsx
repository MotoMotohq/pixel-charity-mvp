import { Contract, parseEther } from "ethers";
import { FormEvent, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ActivityFeed from "../components/ActivityFeed";
import CharityGrid, { type CharityGridFilter } from "../components/CharityGrid";
import CopyTextButton from "../components/CopyTextButton";
import GrowthSparkline from "../components/GrowthSparkline";
import OnchainDonationsTable from "../components/OnchainDonationsTable";
import { useDonationsRefresh } from "../context/DonationsContext";
import { useI18n } from "../context/I18nContext";
import { useOnchainCharity } from "../context/OnchainCharityContext";
import { useToast } from "../context/ToastContext";
import { useWallet } from "../context/WalletContext";
import {
  appendDonation,
  CAMPAIGNS,
  campaignTitle,
  donationKey,
  donationMap,
  donationTotals,
  formatKzt,
  getCurrentUser,
  GRID_SIZE,
  MAX_INDEX,
  type CampaignId
} from "../lib/app-data";
import { rememberPixelTx } from "../lib/pixel-tx-cache";
import { PIXEL_CHARITY_ABI } from "../lib/pixel-charity";

const SNAPSHOT_ROWS = [
  { snapKey: "home.charity.snap1", last: 84_200, chg: 1.24, vol: 3_820_000_000 },
  { snapKey: "home.charity.snap2", last: 218_400, chg: -0.42, vol: 1_240_000_000 },
  { snapKey: "home.charity.snap3", last: 1.02, chg: 0.08, vol: 410_000_000 },
  { snapKey: "home.charity.snap4", last: 3_180, chg: 2.1, vol: 980_000_000 },
  { snapKey: "home.charity.snap5", last: 104_500, chg: 0.55, vol: 220_000_000 }
] as const;

type TxPhase = "idle" | "signing" | "mining" | "success" | "error";

export default function HomePage() {
  const { t, tf, lang } = useI18n();
  const { push } = useToast();
  const { version, bump } = useDonationsRefresh();
  const { provider, address, chainId, bumpTxEpoch } = useWallet();
  const {
    occupiedPixels,
    loading: chainLoading,
    error: chainSyncErr,
    contractAddress: pixelContract,
    donations,
    refresh: refreshChainData
  } = useOnchainCharity();
  const [campaignId, setCampaignId] = useState<CampaignId>(CAMPAIGNS[0].id);
  const [pixelIndex, setPixelIndex] = useState<number | null>(null);
  const [amount, setAmount] = useState(500_000);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [ethDonation, setEthDonation] = useState("0.001");
  const [chainStatus, setChainStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [gridFilter, setGridFilter] = useState<CharityGridFilter>("all");
  const [pixelSearch, setPixelSearch] = useState("");
  const [jumpPixel, setJumpPixel] = useState<number | null>(null);
  const [txPhase, setTxPhase] = useState<TxPhase>("idle");
  const [pendingPixel, setPendingPixel] = useState<number | null>(null);

  useLayoutEffect(() => {
    setMessage(t("home.defaultMessage"));
  }, [lang, t]);

  const totals = useMemo(() => donationTotals(campaignId), [campaignId, version]);
  const totalsAll = useMemo(() => donationTotals(), [version]);

  const gridStats = useMemo(() => {
    let free = 0;
    let demo = 0;
    let onchain = 0;
    const occ = occupiedPixels;
    for (let i = 0; i < GRID_SIZE; i++) {
      const busy = donationMap.has(donationKey(campaignId, i));
      const oc = occ?.has(i) ?? false;
      if (!busy && !oc) free++;
      if (busy) demo++;
      if (oc) onchain++;
    }
    return { free, demo, onchain };
  }, [campaignId, version, occupiedPixels]);

  const explorerChainId = useMemo(() => {
    if (chainId !== null) return chainId;
    const ex = import.meta.env.VITE_EXPECTED_CHAIN_ID?.trim();
    if (ex && /^\d+$/.test(ex)) return Number(ex);
    return null;
  }, [chainId]);

  const isPixelMine = useCallback(
    (i: number) => {
      const w = address?.toLowerCase();
      if (w && donations.some((d) => d.pixelIndex === i && d.donor === w)) return true;
      const user = getCurrentUser();
      if (!user) return false;
      const row = donationMap.get(donationKey(campaignId, i));
      return row?.donor === user.wallet;
    },
    [address, donations, campaignId]
  );

  useEffect(() => {
    if (txPhase !== "success") return;
    const timer = window.setTimeout(() => setTxPhase("idle"), 2200);
    return () => clearTimeout(timer);
  }, [txPhase]);

  const statStrip = useMemo(
    () =>
      [
        { label: t("home.charity.stat1l"), value: t("home.charity.stat1v") },
        { label: t("home.charity.stat2l"), value: t("home.charity.stat2v") },
        { label: t("home.charity.stat3l"), value: t("home.charity.stat3v") },
        { label: t("home.charity.stat4l"), value: t("home.charity.stat4v") },
        { label: t("home.charity.stat5l"), value: t("home.charity.stat5v") },
        { label: t("home.charity.stat6l"), value: t("home.charity.stat6v") }
      ] as const,
    [t]
  );

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setStatus(null);
      const user = getCurrentUser();
      if (!user) {
        setStatus({ kind: "err", text: t("order.needAuth") });
        return;
      }
      const idx = pixelIndex;
      if (idx === null || !Number.isInteger(idx) || idx < 0 || idx > MAX_INDEX) {
        setStatus({ kind: "err", text: t("order.badLevel") });
        return;
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        setStatus({ kind: "err", text: t("order.badAmount") });
        return;
      }
      const row = appendDonation({
        campaignId,
        pixelIndex: idx,
        donor: user.wallet,
        amountUsd: Math.round(amount),
        message: message.slice(0, 80),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        side: "buy",
        orderType: "market",
        limitPrice: null,
        executionPrice: Math.round(amount),
        feeBps: 0,
        feeAmount: 0,
        timeInForce: "now",
        routingMode: "direct",
        reduceOnly: false,
        status: "filled"
      });
      if (!row) {
        setStatus({ kind: "err", text: t("order.busy") });
        return;
      }
      bump();
      setStatus({
        kind: "ok",
        text: tf("home.charity.donationAccepted", { idx, amount: formatKzt(amount) })
      });
    },
    [t, tf, campaignId, pixelIndex, amount, message, bump]
  );

  const goSearchPixel = useCallback(() => {
    const n = Number(pixelSearch.trim());
    if (!Number.isInteger(n) || n < 0 || n > MAX_INDEX) {
      push(t("grid.jumpInvalid"), "err");
      return;
    }
    setPixelIndex(n);
    setJumpPixel(n);
    window.setTimeout(() => setJumpPixel(null), 900);
    push(tf("grid.jumpOk", { n }), "ok");
  }, [pixelSearch, push, t, tf]);

  const donateButtonLabel = useMemo(() => {
    if (txPhase === "signing") return t("chain.txPhaseWallet");
    if (txPhase === "mining") return t("chain.txPhasePending");
    if (txPhase === "success") return t("chain.txOk");
    if (txPhase === "error") return t("chain.donateBtnRetry");
    return t("chain.donateBtn");
  }, [t, txPhase]);

  const submitOnChain = useCallback(async () => {
    setChainStatus(null);
    setTxPhase("idle");
    const addr = import.meta.env.VITE_PIXEL_CHARITY_ADDRESS?.trim();
    if (!addr) {
      const err = t("home.charity.errNoContractAddr");
      setChainStatus({ kind: "err", text: err });
      push(t("chain.noContract"), "err");
      return;
    }
    if (!provider || !address) {
      const err = t("home.charity.errConnectOnchain");
      setChainStatus({ kind: "err", text: err });
      push(t("chain.needWallet"), "err");
      return;
    }
    const expected = import.meta.env.VITE_EXPECTED_CHAIN_ID?.trim();
    if (expected && chainId !== null && String(chainId) !== expected) {
      const msg = tf("chain.wrongNetwork", { expected, current: chainId });
      setChainStatus({ kind: "err", text: msg });
      push(msg, "err");
      return;
    }
    const idx = pixelIndex;
    if (idx === null || !Number.isInteger(idx) || idx < 0 || idx > MAX_INDEX) {
      setChainStatus({ kind: "err", text: t("order.badLevel") });
      return;
    }
    if (occupiedPixels.has(idx)) {
      const err = t("chain.pixelOccupied");
      setChainStatus({ kind: "err", text: err });
      push(err, "err");
      return;
    }
    let valueWei: bigint;
    try {
      valueWei = parseEther(ethDonation.trim() || "0");
    } catch {
      setChainStatus({ kind: "err", text: t("home.charity.errEthParse") });
      return;
    }
    if (valueWei <= 0n) {
      setChainStatus({ kind: "err", text: t("home.charity.errEthParse") });
      return;
    }

    try {
      const bal = await provider.getBalance(address);
      if (bal < valueWei) {
        const msg = t("chain.txLowBalance");
        setChainStatus({ kind: "err", text: msg });
        push(msg, "err");
        setTxPhase("error");
        return;
      }
    } catch {
      /* ignore balance probe */
    }

    setPendingPixel(idx);
    try {
      setTxPhase("signing");
      const signer = await provider.getSigner();
      const c = new Contract(addr, PIXEL_CHARITY_ABI, signer);
      const msg = message.slice(0, 200);
      const tx = await c.donate(idx, msg, { value: valueWei });
      const sent = tf("home.charity.txSentHash", { hash: tx.hash });
      setChainStatus({ kind: "ok", text: sent });
      push(sent, "info");
      setTxPhase("mining");
      await tx.wait();
      rememberPixelTx(idx, tx.hash);
      bumpTxEpoch();
      const ok = t("home.charity.txConfirmedOnchain");
      setChainStatus({ kind: "ok", text: ok });
      push(ok, "ok");
      setTxPhase("success");
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (m.includes("Pixel already occupied") || m.includes("already occupied")) {
        bumpTxEpoch();
        const err = t("chain.pixelOccupied");
        setChainStatus({ kind: "err", text: err });
        push(err, "err");
      } else if (/user rejected|User denied|ACTION_REJECTED/i.test(m)) {
        const err = t("chain.userRejected");
        setChainStatus({ kind: "err", text: err });
        push(err, "err");
      } else {
        const err = t("chain.txFail");
        setChainStatus({ kind: "err", text: err });
        push(err, "err");
      }
      setTxPhase("error");
    } finally {
      setPendingPixel(null);
    }
  }, [provider, address, chainId, pixelIndex, message, ethDonation, occupiedPixels, bumpTxEpoch, push, t, tf]);

  const chainBtnDisabledFinal = chainLoading || txPhase === "signing" || txPhase === "mining";

  return (
    <>
      <section className="hero hero--split">
        <div className="hero__inner">
          <p className="hero-kicker">{t("home.charity.hero.kicker")}</p>
          <h1>{t("home.charity.hero.title")}</h1>
          <p>{t("home.charity.hero.lead")}</p>
          <div className="pill-row">
            <span className="pill">{t("home.charity.pill1")}</span>
            <span className="pill">{t("home.charity.pill2")}</span>
            <span className="pill">{t("home.charity.pill3")}</span>
          </div>
        </div>
        <aside className="hero__visual" aria-label={t("home.charity.heroAria")}>
          <GrowthSparkline />
        </aside>
      </section>

      <div className="stats-strip" aria-label={t("home.charity.statsAria")}>
        {statStrip.map((s) => (
          <div key={s.label} className="stat-chip">
            <span className="stat-chip__value">{s.value}</span>
            <span className="stat-chip__label">{s.label}</span>
          </div>
        ))}
      </div>

      <section className="grid">
        <article className="card card--pulse">
          <span className="kicker">{t("home.charity.cardActive.kicker")}</span>
          <h2>{campaignTitle(campaignId)}</h2>
          <p>
            {t("home.charity.totalAllLabel")} <strong>{formatKzt(totalsAll.total)}</strong>
          </p>
          <p>{tf("home.charity.pixelsOccupied", { occupied: totals.occupied })}</p>
        </article>
        <article className="card">
          <h2>{t("home.charity.howTitle")}</h2>
          <p>{t("home.charity.howP")}</p>
        </article>
        <article className="card">
          <h2>{t("home.charity.trustTitle")}</h2>
          <p>{t("home.charity.trustP")}</p>
        </article>
      </section>

      <div className="section-head">
        <h2>{t("home.charity.whyTitle")}</h2>
      </div>
      <section className="grid">
        <article className="card">
          <span className="kicker">01</span>
          <h2>{t("home.charity.why1t")}</h2>
          <p>{t("home.charity.why1p")}</p>
        </article>
        <article className="card">
          <span className="kicker">02</span>
          <h2>{t("home.charity.why2t")}</h2>
          <p>{t("home.charity.why2p")}</p>
        </article>
        <article className="card">
          <span className="kicker">03</span>
          <h2>{t("home.charity.why3t")}</h2>
          <p>{t("home.charity.why3p")}</p>
        </article>
      </section>

      <div className="section-head">
        <h2>{t("home.charity.feedTitle")}</h2>
      </div>
      <div className="bento">
        <div className="card">
          <ActivityFeed limit={10} />
        </div>
        <div className="card">
          <p className="kicker">{t("home.charity.faqKicker")}</p>
          <div className="faq-stack">
            <details open>
              <summary>{t("home.charity.faq1q")}</summary>
              <p>{t("home.charity.faq1a")}</p>
            </details>
            <details>
              <summary>{t("home.charity.faq2q")}</summary>
              <p>{t("home.charity.faq2a")}</p>
            </details>
            <details>
              <summary>{t("home.charity.faq3q")}</summary>
              <p>{t("home.charity.faq3a")}</p>
            </details>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>{t("home.charity.snapTitle")}</h2>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("home.charity.thCampaign")}</th>
              <th>{t("home.charity.thMetric")}</th>
              <th>{t("home.charity.thChg")}</th>
              <th>{t("home.charity.thVol")}</th>
            </tr>
          </thead>
          <tbody>
            {SNAPSHOT_ROWS.map((row) => (
              <tr key={row.snapKey}>
                <td>
                  <strong>{t(row.snapKey)}</strong>
                </td>
                <td>{formatKzt(row.last)}</td>
                <td className={row.chg >= 0 ? "chg--up" : "chg--down"}>
                  {row.chg >= 0 ? "+" : ""}
                  {row.chg.toFixed(2)}%
                </td>
                <td>{formatKzt(row.vol)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-head" id="terminal">
        <h2>{t("home.charity.formTitle")}</h2>
      </div>
      <div className="split-2">
        <div className="terminal-stack">
          <form className="card donation-form" onSubmit={onSubmit}>
            <label>
              <span>{t("home.charity.fieldCampaign")}</span>
              <select value={campaignId} onChange={(ev) => setCampaignId(ev.target.value as CampaignId)}>
                {CAMPAIGNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t("home.charity.fieldPixel")}</span>
              <input
                type="number"
                min={0}
                max={MAX_INDEX}
                value={pixelIndex ?? ""}
                placeholder="0–999"
                onChange={(ev) => {
                  const v = ev.target.value;
                  setPixelIndex(v === "" ? null : Number(v));
                }}
              />
            </label>
            <label>
              <span>{t("home.charity.fieldAmountKzt")}</span>
              <input type="number" min={1} value={amount} onChange={(ev) => setAmount(Number(ev.target.value))} />
            </label>
            <label>
              <span>{t("home.charity.fieldComment")}</span>
              <input value={message} onChange={(ev) => setMessage(ev.target.value)} maxLength={80} />
            </label>
            <button type="submit">{t("home.charity.submitDonation")}</button>
            {status ? (
              <p
                className={`form-status ${status.kind === "err" ? "form-status--error" : "form-status--ok"}`}
                role={status.kind === "err" ? "alert" : "status"}
                aria-live={status.kind === "err" ? "assertive" : "polite"}
              >
                {status.text}
              </p>
            ) : null}
          </form>

          <div className="card chain-panel">
            <p className="kicker">{t("home.charity.chainKicker")}</p>
            <p className="muted-line">{t("home.charity.chainLead")}</p>
            {pixelContract ? (
              <p className="muted-line chain-panel__addr">
                <code>{pixelContract}</code> <CopyTextButton text={pixelContract} label={t("chain.copyContract")} />
              </p>
            ) : null}
            {chainSyncErr ? (
              <div className="chain-sync-banner" role="alert">
                <p className="form-status form-status--error chain-sync-banner__title">{t("chain.syncError")}</p>
                <p className="muted-line chain-sync-banner__hint">{t("ux.chainRpcHint")}</p>
                <button
                  type="button"
                  className="ghost chain-sync-banner__retry"
                  disabled={chainLoading}
                  onClick={() => {
                    refreshChainData();
                  }}
                >
                  {chainLoading ? t("page.loading") : t("ux.retryLoad")}
                </button>
              </div>
            ) : null}
            <label>
              <span>{t("chain.ethLabel")}</span>
              <input
                type="text"
                inputMode="decimal"
                value={ethDonation}
                onChange={(ev) => setEthDonation(ev.target.value)}
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              className="connect-pill"
              disabled={chainBtnDisabledFinal}
              onClick={() => void submitOnChain()}
            >
              {donateButtonLabel}
            </button>
            {chainStatus ? (
              <p
                className={`form-status ${chainStatus.kind === "err" ? "form-status--error" : "form-status--ok"}`}
                role={chainStatus.kind === "err" ? "alert" : "status"}
                aria-live={chainStatus.kind === "err" ? "assertive" : "polite"}
              >
                {chainStatus.text}
              </p>
            ) : null}
          </div>
        </div>

        <div className="card">
          <p className="kicker">{t("home.charity.gridTitle")}</p>
          <p className="muted-line">{t("home.charity.gridHint")}</p>
          <p className="muted-line">
            {tf("home.charity.gridStats", {
              free: gridStats.free,
              demo: gridStats.demo,
              onchain: gridStats.onchain
            })}
          </p>
          <p className="muted-line">
            {t("home.charity.activeCampaign")} <strong>{campaignTitle(campaignId)}</strong>
          </p>
          <div className="grid-toolbar">
            <label className="grid-toolbar__field">
              <span>{t("grid.filterLabel")}</span>
              <select value={gridFilter} onChange={(ev) => setGridFilter(ev.target.value as CharityGridFilter)}>
                <option value="all">{t("grid.filterAll")}</option>
                <option value="free">{t("grid.filterFree")}</option>
                <option value="onchain">{t("grid.filterOnchain")}</option>
                <option value="demo">{t("grid.filterDemo")}</option>
                <option value="mine">{t("grid.filterMine")}</option>
              </select>
            </label>
            <div className="grid-toolbar__field grid-toolbar__search">
              <label>
                <span>{t("grid.searchLabel")}</span>
                <input
                  value={pixelSearch}
                  onChange={(ev) => setPixelSearch(ev.target.value)}
                  placeholder="0–999"
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") {
                      ev.preventDefault();
                      goSearchPixel();
                    }
                  }}
                />
              </label>
              <button type="button" className="ghost" onClick={goSearchPixel}>
                {t("grid.jumpBtn")}
              </button>
            </div>
          </div>
          <p className="grid-kbd-hint">{t("grid.kbdHint")}</p>
          <div className="charity-legend">
            <span>
              <span className="charity-legend__swatch charity-legend__swatch--demo" />
              {t("chain.legendDemo")}
            </span>
            <span>
              <span className="charity-legend__swatch charity-legend__swatch--onchain" />
              {t("chain.legendOnchain")}
            </span>
          </div>
          <div className="charity-grid-wrap">
            <CharityGrid
              campaignId={campaignId}
              selected={pixelIndex}
              onSelect={setPixelIndex}
              onchainOccupied={occupiedPixels}
              filter={gridFilter}
              isMine={isPixelMine}
              pendingPixel={pendingPixel}
              jumpToPixel={jumpPixel}
            />
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>{t("chain.tableTitle")}</h2>
      </div>
      <div className="card chain-table-card">
        <OnchainDonationsTable donations={donations} chainId={explorerChainId} />
      </div>

      <div className="cta-band">
        <div className="cta-band__copy">
          <h2>{t("home.charity.ctaTitle")}</h2>
          <p>{t("home.charity.ctaLead")}</p>
        </div>
        <div className="cta-band__actions">
          <Link to="/markets" className="connect-pill">
            {t("home.charity.ctaCampaigns")}
          </Link>
          <Link to="/insights" className="ghost">
            {t("home.charity.ctaReports")}
          </Link>
        </div>
      </div>
    </>
  );
}
