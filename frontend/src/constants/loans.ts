import type { HexAddr } from "../config/viem";

export interface LoanRequest {
  bids: number[];
  borrower: HexAddr;
  collateralAmount: bigint;
  collateralAsset: HexAddr;
  createdAt: bigint;
  id: number;
  listingFee: bigint;
  loanDuration: bigint;
  loanID: number;
  maxInterestRate: bigint;
  principalAmount: bigint;
  principalAsset: HexAddr;
  receivingWallet: string;
  requestValidDays: bigint;
  status: LoanRequestStatus;
}

export type MetaLoanRequest = Omit<
  LoanRequest,
  'id' | 'createdAt' | 'status' | 'bids' | 'loanID' | 'listingFee'
>;

export interface Loan {
  bids: number[];
  borrower: string;
  collateralAmount: bigint;
  collateralAsset: HexAddr;
  createdAt: bigint;
  id: number;
  interestRate: number;
  loanDuration: bigint;
  loanRequestID: number;
  principalAmount: bigint;
  principalAsset: HexAddr;
  receivingWallet: string;
  repaymentDeadline: bigint;
  status: LoanStatus;
  totalRepaid: bigint; // uint128 → bigint
}

export interface EscrowInfo {
  asset: string; // address
  balance: bigint;
  canWithdraw: boolean;
  // uint128
  escrowType: string; // address
  initiatorID: number; // loanRequest ID or bid ID
  isLocked: boolean;
  // bytes32 → hex string
  owner: string;
}

export interface MetaBid {
  amount: bigint;
  deadline: number;
  // uint64
  fundingAsset: string; // uint128
  interestRate: number;
  lender: string;
  loanRequestId: number;
  nonce: number; // uint64 → safe in number
}

export interface Bid {
  amount: bigint;
  // uint128
  amountFilled: bigint;
  createdAt: bigint;
  // uint64
  fundingAsset: string;
  gasDeducted: bigint;
  id: number;
  // uint128
  interestRate: number;
  lender: string;
  loanRequestId: number;
  requiresSwap: boolean;
  status: BidStatus; // uint128
}

export enum LoanRequestStatus {
  REQUESTED = 'REQUESTED',
  FUNDED = 'FUNDED',
  EXECUTED = 'EXECUTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum LoanStatus {
  ACTIVE = 'ACTIVE', // Loan active, borrower received funds
  COMPLETED = 'COMPLETED', // Loan fully repaid
  LIQUIDATED = 'LIQUIDATED', // Collateral liquidated
  CANCELLED = 'CANCELLED',
}
export enum BidStatus {
  PENDING = 'PENDING', // Bid placed, awaiting loan execution
  ACCEPTED = 'ACCEPTED', // Bid accepted and loan executed
  REJECTED = 'REJECTED', // Bid rejected by borrower
  EXPIRED = 'EXPIRED', // Bid expired
  WITHDRAWN = 'WITHDRAWN', // Bid withdrawn by lender
}
