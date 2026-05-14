import { Contract, JsonRpcProvider } from "ethers";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { PIXEL_CHARITY_ABI, type OnchainDonationRow } from "../lib/pixel-charity";
import { useWallet } from "./WalletContext";

type Ctx = {
  contractAddress: string | null;
  occupiedPixels: Set<number>;
  donations: OnchainDonationRow[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const OnchainCharityContext = createContext<Ctx | null>(null);

function parseDonations(raw: unknown): OnchainDonationRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const r = row as { donor: string; amount: bigint; message: string; pixelIndex: bigint };
    return {
      donor: String(r.donor).toLowerCase(),
      amount: BigInt(r.amount),
      message: String(r.message),
      pixelIndex: Number(r.pixelIndex)
    };
  });
}

function mergeByPixel(prev: OnchainDonationRow[], nextRow: OnchainDonationRow): OnchainDonationRow[] {
  if (prev.some((r) => r.pixelIndex === nextRow.pixelIndex)) return prev;
  return [...prev, nextRow];
}

export function OnchainCharityProvider({ children }: { children: ReactNode }) {
  const { txEpoch } = useWallet();
  const [tick, setTick] = useState(0);
  const [occupiedPixels, setOccupiedPixels] = useState<Set<number>>(new Set());
  const [donations, setDonations] = useState<OnchainDonationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = import.meta.env.VITE_PIXEL_CHARITY_ADDRESS?.trim() || null;
  const rpcUrl = import.meta.env.VITE_RPC_URL?.trim() || "http://127.0.0.1:8545";

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    void txEpoch;
    void tick;
    if (!contractAddress) {
      setOccupiedPixels(new Set());
      setDonations([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const provider = new JsonRpcProvider(rpcUrl);
    const c = new Contract(contractAddress, PIXEL_CHARITY_ABI, provider);

    const onNewDonation = (donor: string, pixelIndex: bigint, amount: bigint, message: string) => {
      if (cancelled) return;
      const row: OnchainDonationRow = {
        donor: donor.toLowerCase(),
        pixelIndex: Number(pixelIndex),
        amount: BigInt(amount),
        message: String(message)
      };
      setDonations((prev) => mergeByPixel(prev, row));
      setOccupiedPixels((prev) => {
        if (prev.has(row.pixelIndex)) return prev;
        const next = new Set(prev);
        next.add(row.pixelIndex);
        return next;
      });
    };

    c.on("NewDonation", onNewDonation);

    (async () => {
      try {
        const list = await c.getDonations();
        if (cancelled) return;
        const rows = parseDonations(list);
        setDonations(rows);
        setOccupiedPixels(new Set(rows.map((r) => r.pixelIndex)));
      } catch {
        if (!cancelled) {
          setDonations([]);
          setOccupiedPixels(new Set());
          setError("fetch_failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      c.off("NewDonation", onNewDonation);
      provider.destroy?.();
    };
  }, [contractAddress, rpcUrl, tick, txEpoch]);

  const value = useMemo(
    () => ({
      contractAddress,
      occupiedPixels,
      donations,
      loading,
      error,
      refresh
    }),
    [contractAddress, occupiedPixels, donations, loading, error, refresh]
  );

  return <OnchainCharityContext.Provider value={value}>{children}</OnchainCharityContext.Provider>;
}

export function useOnchainCharity(): Ctx {
  const v = useContext(OnchainCharityContext);
  if (!v) throw new Error("useOnchainCharity outside OnchainCharityProvider");
  return v;
}
