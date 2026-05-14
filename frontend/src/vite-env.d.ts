/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PIXEL_CHARITY_ADDRESS?: string;
  /** JSON-RPC URL for read-only contract calls (e.g. http://127.0.0.1:8545) */
  readonly VITE_RPC_URL?: string;
  /** If set, donate button checks wallet chainId (e.g. 31337 for Hardhat) */
  readonly VITE_EXPECTED_CHAIN_ID?: string;
  /** Optional: WalletConnect Cloud project id for mobile / QR pairing */
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
