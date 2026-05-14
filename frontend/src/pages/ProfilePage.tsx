import { formatEther } from "ethers";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import CopyTextButton from "../components/CopyTextButton";
import { useDonationsRefresh } from "../context/DonationsContext";
import { useI18n } from "../context/I18nContext";
import { useOnchainCharity } from "../context/OnchainCharityContext";
import { useWallet } from "../context/WalletContext";
import {
  CAMPAIGNS,
  campaignTitle,
  formatDateTime,
  formatKzt,
  formatMemberSince,
  getCurrentUser,
  getUserStats,
  type OrderStatus,
  userDisplayName,
  userInitials
} from "../lib/app-data";
import { explorerAddressUrl } from "../lib/chain-config";

function shortAddr(addr: string, left = 6, right = 4): string {
  const a = addr.trim();
  if (a.length <= left + right + 1) return a;
  return `${a.slice(0, left)}…${a.slice(-right)}`;
}

function formatEthWei(wei: bigint): string {
  const s = formatEther(wei);
  const n = Number(s);
  if (!Number.isFinite(n)) return `${s} ETH`;
  const opts: Intl.NumberFormatOptions =
    n >= 1 ? { maximumFractionDigits: 4 } : { maximumSignificantDigits: 4 };
  return `${n.toLocaleString(undefined, opts)} ETH`;
}

export default function ProfilePage() {
  const { t } = useI18n();
  const { version } = useDonationsRefresh();
  const user = getCurrentUser();
  const stats = useMemo(() => (user ? getUserStats(user) : null), [user, version]);
  const { address: web3Address, chainId } = useWallet();
  const { contractAddress, donations: onchainAll, loading: onchainLoading, error: onchainError, refresh } =
    useOnchainCharity();

  const web3Lower = web3Address?.toLowerCase() ?? null;
  const myOnchain = useMemo(() => {
    if (!web3Lower) return [];
    return onchainAll.filter((r) => r.donor === web3Lower).sort((a, b) => b.pixelIndex - a.pixelIndex);
  }, [onchainAll, web3Lower]);

  const campaignSplit = useMemo(() => {
    const trades = stats?.trades ?? [];
    if (!trades.length) return [];
    const by: Record<string, number> = {};
    let total = 0;
    for (const tr of trades) {
      by[tr.campaignId] = (by[tr.campaignId] ?? 0) + tr.amountUsd;
      total += tr.amountUsd;
    }
    if (total <= 0) return [];
    return CAMPAIGNS.map((c) => ({
      id: c.id,
      title: campaignTitle(c.id),
      amount: by[c.id] ?? 0,
      pct: ((by[c.id] ?? 0) / total) * 100
    })).filter((row) => row.amount > 0);
  }, [stats]);

  const explorerWallet =
    web3Address && chainId != null ? explorerAddressUrl(chainId, web3Address) : null;

  const statusLabel = (s: OrderStatus): string => {
    if (s === "filled") return t("profile.statusFilled");
    if (s === "open") return t("profile.statusOpen");
    return t("profile.statusCancelled");
  };

  const statusClass = (s: OrderStatus): string => {
    if (s === "filled") return "profile-status profile-status--filled";
    if (s === "open") return "profile-status profile-status--open";
    return "profile-status profile-status--cancelled";
  };

  if (!user) {
    return (
      <section className="page-hero profile-pro">
        <div className="profile-pro-empty card">
          <p className="hero-kicker">{t("profile.emptyKicker")}</p>
          <h1 className="profile-pro-empty__title">{t("profile.pro.emptyTitle")}</h1>
          <p className="lead profile-pro-empty__lead">{t("profile.pro.emptyLead")}</p>
          <ol className="profile-pro-steps">
            <li>{t("profile.pro.stepAuth")}</li>
            <li>{t("profile.pro.stepWallet")}</li>
            <li>{t("profile.pro.stepDonate")}</li>
          </ol>
          <div className="profile-empty-actions">
            <Link to="/" className="connect-pill">
              {t("profile.pro.ctaHome")}
            </Link>
            <Link to="/#terminal" className="ghost">
              {t("profile.goTrade")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-hero profile-page profile-pro">
      <header className="card profile-pro-hero">
        <div className="profile-pro-hero__main">
          <div className="profile-avatar" aria-hidden="true">
            {userInitials(user)}
          </div>
          <div className="profile-pro-hero__text">
            <div className="profile-header__title-row">
              <h1 className="profile-header__name">{userDisplayName(user)}</h1>
              <span className="profile-tier-pill">{t("profile.pro.donorBadge")}</span>
            </div>
            <dl className="profile-pro-dl">
              <div>
                <dt>{t("auth.emailLabel")}</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>{t("profile.memberSince")}</dt>
                <dd>{formatMemberSince(user.memberSince)}</dd>
              </div>
              <div>
                <dt>{t("profile.prefMarketLabel")}</dt>
                <dd>{user.preferredMarket}</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      <div className="profile-pro-layout">
        <div className="profile-pro-main">
          <article className="card profile-pro-card">
            <div className="profile-pro-card__head">
              <div>
                <h2 className="profile-pro-card__title">{t("profile.pro.sectionWallets")}</h2>
                <p className="profile-pro-card__sub">{t("profile.pro.walletsSub")}</p>
              </div>
            </div>
            <div className="profile-wallet-pair">
              <div className="profile-wallet-row">
                <span className="profile-wallet-row__label">{t("profile.pro.demoWallet")}</span>
                <p className="profile-wallet-row__hint">{t("profile.pro.demoWalletHint")}</p>
                <div className="profile-wallet-row__mono">
                  <code className="profile-wallet-block__addr profile-wallet-block__addr--grow">{user.wallet}</code>
                  <CopyTextButton text={user.wallet} label={t("profile.copyWallet")} className="profile-copy-btn" />
                </div>
              </div>
              <div className="profile-wallet-row">
                <span className="profile-wallet-row__label">{t("profile.pro.web3Wallet")}</span>
                <p className="profile-wallet-row__hint">{t("profile.pro.web3WalletHint")}</p>
                {web3Address ? (
                  <div className="profile-wallet-row__mono">
                    <code className="profile-wallet-block__addr profile-wallet-block__addr--grow" title={web3Address}>
                      {shortAddr(web3Address)}
                    </code>
                    <CopyTextButton text={web3Address} label={t("profile.copyWallet")} className="profile-copy-btn" />
                    {explorerWallet ? (
                      <a className="profile-pro-link" href={explorerWallet} target="_blank" rel="noreferrer">
                        {t("profile.pro.viewExplorer")}
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <p className="profile-pro-muted">{t("profile.pro.notConnected")}</p>
                )}
              </div>
            </div>
          </article>

          <article className="card profile-pro-card profile-trades-card">
            <div className="profile-trades-head">
              <div>
                <h2 className="profile-pro-card__title profile-card-title">{t("profile.pro.sectionAppHistory")}</h2>
                <p className="profile-pro-card__sub profile-pro-card__sub--tight">{t("profile.pro.appHistorySub")}</p>
              </div>
              {stats?.trades[0] ? (
                <span className="profile-trades-sub">
                  {t("profile.activity")}: {formatDateTime(stats.trades[0].updatedAt)}
                </span>
              ) : null}
            </div>
            {stats?.trades.length ? (
              <div className="data-table-wrap profile-table-wrap">
                <table className="data-table profile-trades-table">
                  <thead>
                    <tr>
                      <th>{t("profile.colTime")}</th>
                      <th>{t("profile.colMarket")}</th>
                      <th>{t("profile.colLevel")}</th>
                      <th>{t("chain.colMessage")}</th>
                      <th>{t("profile.colStatus")}</th>
                      <th className="data-table__num">{t("profile.colAmount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.trades.map((tr) => (
                      <tr key={tr.id}>
                        <td className="mono-tight">{formatDateTime(tr.updatedAt)}</td>
                        <td>
                          <strong>{campaignTitle(tr.campaignId)}</strong>
                        </td>
                        <td className="mono-tight">#{tr.pixelIndex}</td>
                        <td className="cell-clip" title={tr.message || ""}>
                          {tr.message || "—"}
                        </td>
                        <td>
                          <span className={statusClass(tr.status)}>{statusLabel(tr.status)}</span>
                        </td>
                        <td className="data-table__num mono-tight">{formatKzt(tr.amountUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="activity-feed__empty">{t("profile.noTrades")}</p>
            )}
            <div className="profile-trades-footer">
              <Link to="/#terminal" className="connect-pill">
                {t("profile.goTrade")}
              </Link>
            </div>
          </article>

          {contractAddress ? (
            <article className="card profile-pro-card">
              <div className="profile-pro-card__head">
                <div>
                  <h2 className="profile-pro-card__title">{t("profile.pro.sectionOnchain")}</h2>
                  <p className="profile-pro-card__sub">{t("profile.pro.onchainSub")}</p>
                </div>
              </div>
              {onchainLoading ? (
                <p className="profile-pro-muted">{t("page.loading")}</p>
              ) : onchainError ? (
                <div className="chain-sync-banner chain-sync-banner--compact" role="alert">
                  <p className="profile-pro-warn chain-sync-banner__title">{t("profile.pro.onchainError")}</p>
                  <p className="profile-pro-muted chain-sync-banner__hint">{t("ux.chainRpcHint")}</p>
                  <button type="button" className="ghost chain-sync-banner__retry" disabled={onchainLoading} onClick={() => refresh()}>
                    {onchainLoading ? t("page.loading") : t("ux.retryLoad")}
                  </button>
                </div>
              ) : !web3Address ? (
                <p className="profile-pro-muted">{t("profile.pro.onchainNeedWallet")}</p>
              ) : myOnchain.length === 0 ? (
                <p className="profile-pro-muted">{t("profile.pro.onchainEmpty")}</p>
              ) : (
                <div className="data-table-wrap profile-table-wrap">
                  <table className="data-table profile-trades-table">
                    <thead>
                      <tr>
                        <th>{t("chain.colPixel")}</th>
                        <th>{t("chain.colAmount")}</th>
                        <th>{t("chain.colMessage")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myOnchain.map((row) => (
                        <tr key={`oc-${row.pixelIndex}-${row.amount.toString()}`}>
                          <td className="mono-tight">#{row.pixelIndex}</td>
                          <td className="mono-tight">{formatEthWei(row.amount)}</td>
                          <td className="cell-clip" title={row.message}>
                            {row.message || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          ) : null}
        </div>

        <aside className="profile-pro-aside">
          <article className="card profile-pro-card profile-pro-card--aside">
            <h2 className="profile-pro-card__title">{t("profile.pro.sectionSummary")}</h2>
            <p className="profile-pro-card__sub profile-pro-card__sub--tight">{t("profile.pro.summarySub")}</p>
            <ul className="profile-kpi-compact">
              <li>
                <span>{t("profile.donations")}</span>
                <strong>{stats?.historyCount ?? 0}</strong>
              </li>
              <li>
                <span>{t("profile.pixelsOwned")}</span>
                <strong>{stats?.activeLevels ?? 0}</strong>
              </li>
              <li>
                <span>{t("profile.contributed")}</span>
                <strong>{formatKzt(stats?.total ?? 0)}</strong>
              </li>
              <li>
                <span>{t("profile.pro.avgDonation")}</span>
                <strong>{stats?.historyCount ? formatKzt(stats.avg) : formatKzt(0)}</strong>
              </li>
              <li>
                <span>{t("profile.pro.maxDonation")}</span>
                <strong>{formatKzt(stats?.largest ?? 0)}</strong>
              </li>
              <li>
                <span>{t("profile.favMarketLabel")}</span>
                <strong className="profile-kpi-compact__emph">{stats?.favoriteMarket ?? "—"}</strong>
              </li>
            </ul>
          </article>

          <article className="card profile-pro-card profile-pro-card--aside">
            <h2 className="profile-pro-card__title">{t("profile.pro.sectionSplit")}</h2>
            <p className="profile-pro-card__sub profile-pro-card__sub--tight">{t("profile.pro.splitSub")}</p>
            {campaignSplit.length ? (
              <ul className="profile-split-list">
                {campaignSplit.map((row) => (
                  <li key={row.id} className="profile-split-row">
                    <div className="profile-split-row__top">
                      <span className="profile-split-row__label">{row.title}</span>
                      <span className="profile-split-row__val">{formatKzt(row.amount)}</span>
                    </div>
                    <div className="profile-split-bar-wrap" role="presentation">
                      <span className="profile-split-bar" style={{ width: `${Math.min(100, row.pct)}%` }} />
                    </div>
                    <span className="profile-split-pct">{row.pct.toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="profile-pro-muted">{t("profile.pro.splitEmpty")}</p>
            )}
          </article>
        </aside>
      </div>
    </section>
  );
}
