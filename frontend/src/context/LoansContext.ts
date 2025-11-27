import { createContext } from 'react';

import type { LoanRequest } from '../constants/loans';

interface LoansContextType {
  loanRequests: LoanRequest[];
  loanBids: any[];
  loading: boolean;
  error: string | null;
  createLoanRequest: (data: any) => Promise<void>;
  createLoanBid: (data: any) => Promise<void>; 
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
  // acceptLoanBid: async () => {},
  // cancelLoanRequest: async () => {},
  // cancelLoanBid: async () => {},
});
