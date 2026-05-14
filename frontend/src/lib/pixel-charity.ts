/** PixelCharity.sol — fragments for ethers v6 */
export const PIXEL_CHARITY_ABI = [
  "function MAX_PIXELS() view returns (uint256)",
  "function pixelToDonor(uint256) view returns (address)",
  "function donate(uint256 pixelIndex, string message) payable",
  "function getDonations() view returns (tuple(address donor,uint256 amount,string message,uint256 pixelIndex)[])",
  "function withdraw() payable",
  "event NewDonation(address indexed donor, uint256 indexed pixelIndex, uint256 amount, string message)"
] as const;

export type OnchainDonationRow = {
  donor: string;
  amount: bigint;
  message: string;
  pixelIndex: number;
};
