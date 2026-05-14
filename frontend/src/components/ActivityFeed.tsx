import { useMemo } from "react";
import { useI18n } from "../context/I18nContext";
import { useDonationsList } from "../context/DonationsContext";
import {
  campaignTitle,
  formatKzt,
  formatRelativeTime
} from "../lib/app-data";

export default function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const { t } = useI18n();
  const list = useDonationsList();
  const rows = useMemo(
    () => [...list].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit),
    [list, limit]
  );

  if (!rows.length) {
    return <p className="activity-feed__empty">{t("home.activityEmpty")}</p>;
  }

  return (
    <ul className="activity-feed">
      {rows.map((d) => (
        <li key={d.id} className="activity-feed__row">
          <div className="activity-feed__main">
            <span className="activity-feed__pair">{campaignTitle(d.campaignId)}</span>
            <span className="activity-feed__meta">
              #{d.pixelIndex} · {d.message || t("home.charity.activityDefaultMsg")}
            </span>
          </div>
          <div className="activity-feed__right">
            <span className="activity-feed__amt">{formatKzt(d.amountUsd)}</span>
            <span className="activity-feed__time">{formatRelativeTime(d.updatedAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
