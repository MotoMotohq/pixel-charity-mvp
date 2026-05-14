import { useMemo } from "react";
import { useDonationsList, useDonationsRefresh } from "../context/DonationsContext";
import { CAMPAIGNS, campaignTitle, donationTotals, formatKzt } from "../lib/app-data";

export default function InsightsPage() {
  const { version } = useDonationsRefresh();
  const list = useDonationsList();
  const totals = useMemo(() => donationTotals(), [version]);

  const allocation = useMemo(() => {
    const sums: Record<string, number> = {};
    let total = 0;
    list.forEach((d) => {
      sums[d.campaignId] = (sums[d.campaignId] ?? 0) + d.amountUsd;
      total += d.amountUsd;
    });
    const rows = CAMPAIGNS.map((c) => {
      const v = sums[c.id] ?? 0;
      const pct = total > 0 ? (v / total) * 100 : 100 / CAMPAIGNS.length;
      return { id: c.id, title: c.title, pct };
    });
    const maxPct = Math.max(...rows.map((r) => r.pct), 1e-6);
    return rows.map((r) => ({ ...r, barW: (r.pct / maxPct) * 100 }));
  }, [list, version]);

  return (
    <section className="page-hero">
      <p className="hero-kicker">Отчётность фонда</p>
      <h1>Открытая аналитика по пожертвованиям и результатам</h1>
      <p className="lead">Здесь видно объём помощи, распределение по кампаниям и последние обновления фонда.</p>

      <div className="grid grid--below-hero">
        <article className="card card--pulse">
          <h2>Собрано всего</h2>
          <p className="stat-value">{formatKzt(totals.total)}</p>
        </article>
        <article className="card">
          <h2>Активные пиксели</h2>
          <p className="stat-value">{totals.occupied} / 1000</p>
        </article>
        <article className="card">
          <h2>Среднее пожертвование</h2>
          <p className="stat-value">{formatKzt(totals.avg)}</p>
        </article>
      </div>

      <div className="metrics-subgrid" style={{ marginTop: "1.25rem" }}>
        <div className="metric-tile">
          <span className="metric-tile__l">Крупнейшее пожертвование (24ч)</span>
          <span className="metric-tile__v">{formatKzt(totals.largest)}</span>
        </div>
        <div className="metric-tile">
          <span className="metric-tile__l">Самый активный донор</span>
          <span className="metric-tile__v" style={{ fontSize: "0.8125rem", wordBreak: "break-all" }}>
            {totals.topDonor}
          </span>
        </div>
        <div className="metric-tile">
          <span className="metric-tile__l">Среднее пожертвование</span>
          <span className="metric-tile__v">{formatKzt(totals.avg)}</span>
        </div>
        <div className="metric-tile">
          <span className="metric-tile__l">Занятые пиксели</span>
          <span className="metric-tile__v">{totals.occupied}</span>
        </div>
      </div>

      <div className="section-head">
        <h2>Распределение помощи по кампаниям</h2>
      </div>
      <div className="card">
        <div className="alloc-list">
          {allocation.map((a) => (
            <div key={a.id} className="alloc-row">
              <span className="alloc-row__label">{campaignTitle(a.id)}</span>
              <span className="alloc-row__pct">{a.pct.toFixed(1)}%</span>
              <div className="alloc-bar">
                <span style={{ width: `${a.barW}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-head">
        <h2>Последние обновления фонда</h2>
      </div>
      <div className="news-grid">
        <article className="card news-card">
          <h3>Запущен новый сбор на школьные наборы</h3>
          <p>Фонд начал кампанию по обеспечению детей учебными материалами к новому семестру.</p>
        </article>
        <article className="card news-card">
          <h3>Опубликован отчёт по ветеринарной помощи</h3>
          <p>В разделе отчётности доступны подтверждённые расходы и результаты лечения животных.</p>
        </article>
        <article className="card news-card">
          <h3>Расширена программа срочной поддержки</h3>
          <p>Добавлены новые регионы и ускорен процесс обработки заявок на экстренную помощь.</p>
        </article>
      </div>
    </section>
  );
}
