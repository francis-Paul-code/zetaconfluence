export interface LoanRequest {
  bids: number[];
  borrower: string;
  collateralAmount: bigint;
  collateralAsset: string;
  createdAt: bigint;
  id: number;
  listingFee: bigint;
  loanDuration: bigint;
  loanID: number;
  maxInterestRate: bigint;
  principalAmount: bigint;
  principalAsset: string;
  receivingWallet: string;
  requestValidDays: bigint;
  status: LoanRequestStatus;
}

export interface Loan {
  bids: number[];
  borrower: string;
  collateralAmount: bigint;
  collateralAsset: string;
  createdAt: bigint;
  id: number;
  interestRate: number;
  loanDuration: bigint;
  loanRequestID: number;
  principalAmount: bigint;
  principalAsset: string;
  receivingWallet: string;
  // uint64 fits in JS number safely
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
  REQUESTED, // Loan request created, awaiting bids
  FUNDED, // 100% funded, ready for execution
  EXECUTED, // Request has been executed and loan exists
  EXPIRED, // Request expired without funding
  CANCELLED, // Cancelled by borrower or by
}

export enum LoanStatus {
  ACTIVE, // Loan active, borrower received funds
  COMPLETED, // Loan fully repaid
  LIQUIDATED, // Collateral liquidated
  CANCELLED,
}
export enum BidStatus {
  PENDING, // Bid placed, awaiting loan execution
  ACCEPTED, // Bid accepted and loan executed
  REJECTED, // Bid rejected by borrower
  EXPIRED, // Bid expired
  WITHDRAWN, // Bid withdrawn by lender
}
