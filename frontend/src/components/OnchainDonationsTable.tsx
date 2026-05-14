import { formatEther } from "ethers";
import { useMemo } from "react";
import { useI18n } from "../context/I18nContext";
import { explorerTxUrl } from "../lib/chain-config";
import type { OnchainDonationRow } from "../lib/pixel-charity";
import { shortAddress } from "../context/WalletContext";
import { txHashForPixel } from "../lib/pixel-tx-cache";
import CopyTextButton from "./CopyTextButton";

type Props = {
  donations: OnchainDonationRow[];
  chainId: number | null;
};

export default function OnchainDonationsTable({ donations, chainId }: Props) {
  const { t } = useI18n();

  const rows = useMemo(() => [...donations].reverse(), [donations]);

  if (rows.length === 0) {
    return <p className="muted-line">{t("chain.tableEmpty")}</p>;
  }

  return (
    <div className="data-table-wrap chain-table-wrap">
      <table className="data-table data-table--compact">
        <thead>
          <tr>
            <th>{t("chain.colPixel")}</th>
            <th>{t("chain.colAmount")}</th>
            <th>{t("chain.colDonor")}</th>
            <th>{t("chain.colMessage")}</th>
            <th>{t("chain.colTx")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const hash = txHashForPixel(r.pixelIndex);
            const txUrl = chainId !== null && hash ? explorerTxUrl(chainId, hash) : null;
            return (
              <tr key={`${r.pixelIndex}-${r.donor}-${r.message.slice(0, 8)}`}>
                <td>
                  <strong>{r.pixelIndex}</strong>
                </td>
                <td>{formatEther(r.amount)} ETH</td>
                <td>
                  <code className="mono-tight">{shortAddress(r.donor, 8, 6)}</code>{" "}
                  <CopyTextButton text={r.donor} label={t("chain.copyAddr")} />
                </td>
                <td className="cell-clip">{r.message || "—"}</td>
                <td>
                  {txUrl && hash ? (
                    <a href={txUrl} target="_blank" rel="noreferrer" className="table-link">
                      {shortAddress(hash, 10, 8)}
                    </a>
                  ) : (
                    <span className="muted-line">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
