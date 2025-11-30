/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext } from 'react';

import type { Wallet } from '../constants/chains';
import type { LoanRequest, MetaBid, MetaLoanRequest } from '../constants/loans';
import type { EIP6963ProviderDetail } from '../types/wallet';

export interface LoansContextType {
  loanRequests: LoanRequest[];
  loanBids: any[];
  loading: boolean;
  error: string | null;
  createLoanRequest: (
    req: MetaLoanRequest,
    wallet: Wallet,
    evmProvider?: EIP6963ProviderDetail,
    bitcoinProvider?: any,
    solanaProvider?: any
  ) => Promise<void>;
  createLoanBid: (
    req: MetaBid,
    wallet: Wallet,
    evmProvider?: EIP6963ProviderDetail,
    bitcoinProvider?: any,
    solanaProvider?: any
  ) => Promise<void>;
  getSupportedAssets: (
    wallet: Wallet,
    evmProvider?: EIP6963ProviderDetail,
    bitcoinProvider?: any,
    solanaProvider?: any
  ) => Promise<void>;
  // acceptLoanBid: (bidId: string) => Promise<void>;
  // cancelLoanRequest: (requestId: string) => Promise<void>;
  // cancelLoanBid: (bidId: string) => Promise<void>;
}

export const LoansContext = createContext<LoansContextType>({
  loanRequests: [],
  loanBids: [],
  loading: false,
  error: null,
  createLoanRequest: async () => {},
  createLoanBid: async () => {},
  getSupportedAssets: async () => {},
  // acceptLoanBid: async () => {},
  // cancelLoanRequest: async () => {},
  // cancelLoanBid: async () => {},
});
