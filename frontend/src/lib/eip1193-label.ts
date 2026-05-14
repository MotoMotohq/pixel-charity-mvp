import type { Eip1193Provider } from "ethers";

/** Best-effort label for EIP-1193 browser wallets */
export function eip1193Label(p: Eip1193Provider, index: number): string {
  const x = p as {
    isMetaMask?: boolean;
    isCoinbaseWallet?: boolean;
    isBraveWallet?: boolean;
    isRabby?: boolean;
  };
  if (x.isMetaMask) return "MetaMask";
  if (x.isCoinbaseWallet) return "Coinbase Wallet";
  if (x.isBraveWallet) return "Brave Wallet";
  if (x.isRabby) return "Rabby";
  return `Browser wallet ${index + 1}`;
}
