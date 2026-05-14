import { useId } from "react";
import { useI18n } from "../context/I18nContext";

/** Decorative emerald growth curve — corporate dashboard feel */
export default function GrowthSparkline() {
  const { t } = useI18n();
  const uid = useId();
  const fillId = `growthFill-${uid}`;
  const strokeId = `growthStroke-${uid}`;

  return (
    <div className="growth-chart glass-panel" aria-hidden="true">
      <div className="growth-chart__header">
        <span className="growth-chart__label">{t("chart.portfolioLabel")}</span>
        <span className="growth-chart__delta">{t("chart.sampleDelta")}</span>
      </div>
      <svg className="growth-chart__svg" viewBox="0 0 280 72" preserveAspectRatio="none">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-emerald)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--chart-emerald)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <path
          className="growth-chart__area"
          d="M0,58 C28,56 42,52 56,48 C78,42 98,44 112,38 C132,30 148,22 168,18 C196,12 220,8 280,4 L280,72 L0,72 Z"
          fill={`url(#${fillId})`}
        />
        <path
          className="growth-chart__line"
          d="M0,58 C28,56 42,52 56,48 C78,42 98,44 112,38 C132,30 148,22 168,18 C196,12 220,8 280,4"
          fill="none"
          stroke={`url(#${strokeId})`}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
