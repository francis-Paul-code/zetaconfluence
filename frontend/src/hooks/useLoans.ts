import { evmDepositAndCall } from '@zetachain/toolkit';
import { useCallback } from 'react';

import type { loanRequest } from '../constants/loans';

export const useLoans = () => {
  const createLoanRequest = async (
    data: Omit<loanRequest, 'id' | 'listingFee'>
  ) => {};

  const createLoanBid = async (data: any) => {};
  const cancelLoanBid = async (bidId: string) => {};
  const cancelLoanRequest = async (requestId: string) => {};
  const clearLoan = async (loanId: string) => {};
  const reclaimCollateral = async (loanId: string) => {};
  const getLoanRequests = useCallback(async (account: string) => {
    try {
      const res = await evmDepositAndCall({}, {});
    } catch (error) {
      console.error(
        `Error fetching loan requests for account ${account}:`,
        error
      );
      throw error;
    }
    return [];
  }, []);

  const getLoanBids = useCallback(async () => {}, []);

  const getActiveLoans = useCallback(async () => {}, []);

  const getActivePositions = useCallback(async () => {}, []);

  return {
    createLoanRequest,
    getLoanRequests,
    getLoanBids,
    getActiveLoans,
    getActivePositions,
    createLoanBid,
    cancelLoanBid,
    cancelLoanRequest,
    clearLoan,
    reclaimCollateral,
  };
};
