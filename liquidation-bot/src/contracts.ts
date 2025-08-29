import { ethers } from "ethers";

import { CONTRACT_ADDRESS, PRIVATE_KEY, RPC_URL } from "./configs";

const ABI = [
  "event LoanActivated(uint256 indexed loanId, address borrower)",
  "function liquidateLoan(uint256 loanId) external",
  "function getLoan(uint256 loanId) external view returns (uint256 collateral, uint256 debt)",
];

export function getContract() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
}
