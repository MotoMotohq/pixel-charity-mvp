import { BrowserProvider, type Eip1193Provider } from "ethers";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { chainDefinitionForEnv, toHexChainId } from "../lib/chain-config";

const SESSION_CLOSED_KEY = "aether_wallet_ui_closed";
const INJECTED_IDX_KEY = "aether_injected_provider_idx";
const LAST_CHAIN_KEY = "aether_last_chain_id";

type InjectedWin = Eip1193Provider & { providers?: Eip1193Provider[] };

export type WalletConnectionSource = "injected" | "walletconnect" | null;

type WalletCtx = {
  address: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  eip1193: Eip1193Provider | null;
  isConnecting: boolean;
  error: string | null;
  hasInjected: boolean;
  connectionSource: WalletConnectionSource;
  injectedList: Eip1193Provider[];
  injectedIndex: number;
  setInjectedIndex: (n: number) => void;
  walletConnectConfigured: boolean;
  connectInjected: () => Promise<void>;
  connectWalletConnect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchToChain: (targetChainId: number) => Promise<void>;
  txEpoch: number;
  bumpTxEpoch: () => void;
};

const WalletContext = createContext<WalletCtx | null>(null);

function getInjectedCandidates(): Eip1193Provider[] {
  if (typeof window === "undefined") return [];
  const eth = (window as unknown as { ethereum?: InjectedWin }).ethereum;
  if (!eth) return [];
  if (Array.isArray(eth.providers) && eth.providers.length > 0) return eth.providers;
  return [eth];
}

function pickInjected(index: number): Eip1193Provider | null {
  const c = getInjectedCandidates();
  if (!c.length) return null;
  const i = Math.min(Math.max(0, index), c.length - 1);
  return c[i] ?? null;
}

type WcProvider = Eip1193Provider & { disconnect: () => Promise<void> };

export function WalletProvider({ children }: { children: ReactNode }) {
  const [eip1193, setEip1193] = useState<Eip1193Provider | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txEpoch, setTxEpoch] = useState(0);
  const [connectionSource, setConnectionSource] = useState<WalletConnectionSource>(null);
  const [injectedIndex, setInjectedIndexState] = useState(() =>
    Number(typeof localStorage !== "undefined" ? localStorage.getItem(INJECTED_IDX_KEY) : "0") || 0
  );

  const sessionClosedRef = useRef(
    typeof localStorage !== "undefined" && localStorage.getItem(SESSION_CLOSED_KEY) === "1"
  );
  const wcRef = useRef<WcProvider | null>(null);

  const hasInjected = getInjectedCandidates().length > 0;
  const walletConnectConfigured = Boolean(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim());

  const syncFromBrowserProvider = useCallback(async (bp: BrowserProvider) => {
    const net = await bp.getNetwork();
    const id = Number(net.chainId);
    setChainId(id);
    try {
      localStorage.setItem(LAST_CHAIN_KEY, String(id));
    } catch {
      /* ignore */
    }
    if (sessionClosedRef.current) {
      setAddress(null);
      return;
    }
    const accs = (await bp.send("eth_accounts", [])) as string[];
    setAddress(accs[0] ? accs[0].toLowerCase() : null);
  }, []);

  const setInjectedIndex = useCallback((n: number) => {
    const max = Math.max(0, getInjectedCandidates().length - 1);
    const v = Math.min(Math.max(0, n), max);
    setInjectedIndexState(v);
    try {
      localStorage.setItem(INJECTED_IDX_KEY, String(v));
    } catch {
      /* ignore */
    }
    if (connectionSource !== "walletconnect" && !wcRef.current) {
      const inj = pickInjected(v);
      if (inj) setEip1193(inj);
    }
  }, [connectionSource]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (wcRef.current) return;
    const inj = pickInjected(injectedIndex);
    if (inj) setEip1193(inj);
  }, [injectedIndex]);

  useEffect(() => {
    if (!eip1193) {
      setProvider(null);
      return;
    }

    const bp = new BrowserProvider(eip1193);
    setProvider(bp);
    void syncFromBrowserProvider(bp).catch(() => {
      setAddress(null);
    });

    const onAccounts = (accs: string[]) => {
      if (sessionClosedRef.current) {
        setAddress(null);
        return;
      }
      setAddress(accs[0] ? accs[0].toLowerCase() : null);
    };

    const onChain = (hex: string) => {
      const id = parseInt(String(hex), 16);
      setChainId(id);
      try {
        localStorage.setItem(LAST_CHAIN_KEY, String(id));
      } catch {
        /* ignore */
      }
      void syncFromBrowserProvider(new BrowserProvider(eip1193)).catch(() => {});
    };

    eip1193.on?.("accountsChanged", onAccounts);
    eip1193.on?.("chainChanged", onChain);
    return () => {
      eip1193.removeListener?.("accountsChanged", onAccounts);
      eip1193.removeListener?.("chainChanged", onChain);
    };
  }, [eip1193, syncFromBrowserProvider]);

  const bumpTxEpoch = useCallback(() => setTxEpoch((n) => n + 1), []);

  const connectInjected = useCallback(async () => {
    const inj = pickInjected(injectedIndex);
    setError(null);
    if (!inj) {
      setError("no_injected");
      return;
    }
    setIsConnecting(true);
    try {
      if (wcRef.current) {
        await wcRef.current.disconnect();
        wcRef.current = null;
      }
      setConnectionSource(null);
      await inj.request({ method: "eth_requestAccounts" });
      sessionClosedRef.current = false;
      try {
        localStorage.removeItem(SESSION_CLOSED_KEY);
      } catch {
        /* ignore */
      }
      setEip1193(inj);
      setConnectionSource("injected");
      const bp = new BrowserProvider(inj);
      await syncFromBrowserProvider(bp);
    } catch (e) {
      setError(e instanceof Error ? e.message : "connect_failed");
    } finally {
      setIsConnecting(false);
    }
  }, [injectedIndex, syncFromBrowserProvider]);

  const connectWalletConnect = useCallback(async () => {
    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim();
    setError(null);
    if (!projectId) {
      setError("wc_no_project");
      return;
    }
    setIsConnecting(true);
    let wc: WcProvider | null = null;
    try {
      const { default: EthereumProvider } = await import("@walletconnect/ethereum-provider");
      const envRpc = import.meta.env.VITE_RPC_URL?.trim() || "http://127.0.0.1:8545";
      wc = (await EthereumProvider.init({
        projectId,
        chains: [11155111],
        optionalChains: [1, 31337, 17000, 8453],
        rpcMap: {
          11155111: "https://rpc.sepolia.org",
          1: "https://cloudflare-eth.com",
          31337: envRpc,
          17000: "https://ethereum-holesky.publicnode.com",
          8453: "https://mainnet.base.org"
        },
        showQrModal: true,
        metadata: {
          name: "Aether Exchange",
          description: "PixelCharity",
          url: typeof window !== "undefined" ? window.location.origin : "",
          icons: []
        }
      })) as WcProvider;
      await wc.connect();
      wcRef.current = wc;
      sessionClosedRef.current = false;
      try {
        localStorage.removeItem(SESSION_CLOSED_KEY);
      } catch {
        /* ignore */
      }
      setEip1193(wc);
      setConnectionSource("walletconnect");
      const bp = new BrowserProvider(wc);
      await syncFromBrowserProvider(bp);
    } catch (e) {
      if (wc) {
        try {
          await wc.disconnect();
        } catch {
          /* ignore */
        }
      }
      wcRef.current = null;
      setError(e instanceof Error ? e.message : "wc_failed");
    } finally {
      setIsConnecting(false);
    }
  }, [syncFromBrowserProvider]);

  const disconnect = useCallback(async () => {
    sessionClosedRef.current = true;
    try {
      localStorage.setItem(SESSION_CLOSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setAddress(null);
    setError(null);
    setConnectionSource(null);
    if (wcRef.current) {
      try {
        await wcRef.current.disconnect();
      } catch {
        /* ignore */
      }
      wcRef.current = null;
    }
    const inj = pickInjected(injectedIndex);
    if (inj) setEip1193(inj);
    else setEip1193(null);
  }, [injectedIndex]);

  const switchToChain = useCallback(
    async (targetChainId: number) => {
      if (!eip1193) return;
      const hex = toHexChainId(targetChainId);
      const envRpc = import.meta.env.VITE_RPC_URL;
      try {
        await eip1193.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: hex }]
        });
      } catch (e: unknown) {
        const code = (e as { code?: number })?.code;
        if (code !== 4902) throw e;
        const def = chainDefinitionForEnv(targetChainId, envRpc);
        if (!def) throw e;
        await eip1193.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hex,
              chainName: def.name,
              nativeCurrency: def.nativeCurrency,
              rpcUrls: def.rpcUrls
            }
          ]
        });
      }
    },
    [eip1193]
  );

  const value = useMemo(
    () => ({
      address,
      chainId,
      provider,
      eip1193,
      isConnecting,
      error,
      hasInjected,
      connectionSource,
      injectedList: getInjectedCandidates(),
      injectedIndex,
      setInjectedIndex,
      walletConnectConfigured,
      connectInjected,
      connectWalletConnect,
      disconnect,
      switchToChain,
      txEpoch,
      bumpTxEpoch
    }),
    [
      address,
      chainId,
      provider,
      eip1193,
      isConnecting,
      error,
      hasInjected,
      connectionSource,
      injectedIndex,
      setInjectedIndex,
      walletConnectConfigured,
      connectInjected,
      connectWalletConnect,
      disconnect,
      switchToChain,
      txEpoch,
      bumpTxEpoch
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletCtx {
  const v = useContext(WalletContext);
  if (!v) throw new Error("useWallet outside WalletProvider");
  return v;
}

export function shortAddress(addr: string, left = 6, right = 4): string {
  if (addr.length <= left + right + 1) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}
