/** Known chains for switch/add network + block explorer links */

export type ChainDefinition = {
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  /** Base URL without trailing slash; empty = no public explorer */
  explorer?: string;
};

export const CHAIN_DEFINITIONS: Record<number, ChainDefinition> = {
  1: {
    name: "Ethereum Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://cloudflare-eth.com"],
    explorer: "https://etherscan.io"
  },
  11155111: {
    name: "Sepolia",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.sepolia.org"],
    explorer: "https://sepolia.etherscan.io"
  },
  17000: {
    name: "Holesky",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://ethereum-holesky.publicnode.com"],
    explorer: "https://holesky.etherscan.io"
  },
  31337: {
    name: "Hardhat Local",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["http://127.0.0.1:8545"],
    explorer: ""
  },
  8453: {
    name: "Base",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.base.org"],
    explorer: "https://basescan.org"
  }
};

export function chainExplorerBase(chainId: number): string | null {
  const ex = CHAIN_DEFINITIONS[chainId]?.explorer;
  return ex && ex.length > 0 ? ex.replace(/\/$/, "") : null;
}

export function explorerTxUrl(chainId: number, txHash: string): string | null {
  const base = chainExplorerBase(chainId);
  return base ? `${base}/tx/${txHash}` : null;
}

export function explorerAddressUrl(chainId: number, address: string): string | null {
  const base = chainExplorerBase(chainId);
  return base ? `${base}/address/${address}` : null;
}

export function toHexChainId(chainId: number): string {
  return "0x" + chainId.toString(16);
}

/** Merge env RPC for Hardhat / custom node */
export function chainDefinitionForEnv(chainId: number, envRpc?: string): ChainDefinition | undefined {
  const base = CHAIN_DEFINITIONS[chainId];
  if (!base) return undefined;
  if (chainId === 31337 && envRpc?.trim()) {
    return { ...base, rpcUrls: [envRpc.trim()] };
  }
  return base;
}
