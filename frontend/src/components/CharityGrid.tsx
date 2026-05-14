import { useCallback, useEffect, useMemo, useRef } from "react";
import type { KeyboardEvent } from "react";
import { useDonationsRefresh } from "../context/DonationsContext";
import { useI18n } from "../context/I18nContext";
import { donationKey, donationMap, GRID_SIZE, type CampaignId } from "../lib/app-data";

export type CharityGridFilter = "all" | "free" | "onchain" | "demo" | "mine";

const COLS = 40;
const _ROWS = 25;

type Props = {
  campaignId: CampaignId;
  selected: number | null;
  onSelect: (index: number) => void;
  onchainOccupied?: ReadonlySet<number>;
  filter?: CharityGridFilter;
  isMine?: (index: number) => boolean;
  pendingPixel?: number | null;
  jumpToPixel?: number | null;
  onJumpComplete?: () => void;
};

function dimForFilter(
  filter: CharityGridFilter,
  i: number,
  demoBusy: boolean,
  onchain: boolean,
  mine: boolean
): boolean {
  switch (filter) {
    case "all":
      return false;
    case "free":
      return demoBusy || onchain;
    case "onchain":
      return !onchain;
    case "demo":
      return !demoBusy;
    case "mine":
      return !mine;
    default:
      return false;
  }
}

export default function CharityGrid({
  campaignId,
  selected,
  onSelect,
  onchainOccupied,
  filter = "all",
  isMine,
  pendingPixel,
  jumpToPixel,
  onJumpComplete
}: Props) {
  const { t, tf } = useI18n();
  const { version } = useDonationsRefresh();
  void version;
  const wrapRef = useRef<HTMLDivElement>(null);
  const indices = useMemo(() => Array.from({ length: GRID_SIZE }, (_, i) => i), []);

  useEffect(() => {
    if (jumpToPixel === null || jumpToPixel === undefined) return;
    const el = wrapRef.current?.querySelector<HTMLElement>(`button[data-pixel="${jumpToPixel}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = window.setTimeout(() => onJumpComplete?.(), 700);
    return () => clearTimeout(t);
  }, [jumpToPixel, onJumpComplete]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " "].includes(e.key)) return;

      let cur = selected;
      if (cur === null) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") cur = 0;
        else return;
      }

      const row = Math.floor(cur / COLS);
      const c = cur % COLS;
      let next = cur;

      if (e.key === "ArrowLeft") next = row * COLS + Math.max(0, c - 1);
      if (e.key === "ArrowRight") next = row * COLS + Math.min(COLS - 1, c + 1);
      if (e.key === "ArrowUp") next = Math.max(0, row - 1) * COLS + c;
      if (e.key === "ArrowDown") next = Math.min(_ROWS - 1, row + 1) * COLS + c;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(cur);
        return;
      }

      if (next !== cur) {
        e.preventDefault();
        onSelect(next);
      }
    },
    [selected, onSelect]
  );

  return (
    <div
      ref={wrapRef}
      className="charity-grid"
      tabIndex={0}
      role="group"
      aria-label={t("grid.a11yLabel")}
      onKeyDown={onKeyDown}
    >
      {indices.map((i) => {
        const busy = donationMap.has(donationKey(campaignId, i));
        const onchain = onchainOccupied?.has(i) ?? false;
        const mine = isMine?.(i) ?? false;
        const dim = dimForFilter(filter, i, busy, onchain, mine);
        const pending = pendingPixel === i;
        let status = t("grid.cellStatusFree");
        if (busy && onchain) status = t("grid.cellStatusBoth");
        else if (busy) status = t("grid.cellStatusDemo");
        else if (onchain) status = t("grid.cellStatusOnchain");
        if (mine) status = `${status} · ${t("grid.cellStatusMine")}`;
        const cls = [
          "charity-cell",
          onchain ? "charity-cell--onchain" : "",
          busy ? "charity-cell--busy" : "",
          dim ? "charity-cell--dimmed" : "",
          pending ? "charity-cell--pending" : "",
          selected === i ? "charity-cell--sel" : ""
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={i}
            type="button"
            data-pixel={i}
            className={cls}
            title={tf("grid.cellTooltip", { i, status })}
            onClick={() => onSelect(i)}
            aria-label={tf("grid.cellLabel", { i })}
            aria-current={selected === i ? "true" : undefined}
          />
        );
      })}
    </div>
  );
}
