import { createContext } from 'react';
import type { loanRequest } from '../constants/loans';

interface LoansContextType {
  loanRequests: loanRequest[];
  loanBids: any[]; // Replace with actual type
  loading: boolean;
  error: string | null;
  createLoanRequest: (data: any) => Promise<void>; // Replace with actual type
  createLoanBid: (data: any) => Promise<void>; // Replace with actual type
  acceptLoanBid: (bidId: string) => Promise<void>;
  cancelLoanRequest: (requestId: string) => Promise<void>;
  cancelLoanBid: (bidId: string) => Promise<void>;
}

export const LoansContext = createContext<LoansContextType>({
  loanRequests: [],
  loanBids: [],
  loading: false,
  error: null,
  createLoanRequest: async () => {},
  createLoanBid: async () => {},
  acceptLoanBid: async () => {},
  cancelLoanRequest: async () => {},
  cancelLoanBid: async () => {},
});
