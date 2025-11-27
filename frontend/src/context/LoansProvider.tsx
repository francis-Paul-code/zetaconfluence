import { type ReactNode, useEffect, useMemo } from 'react';

import { useLoans } from '../hooks/useLoans';
import { useLoansState } from '../hooks/useLoansState';
import { LoansContext } from './LoansContext';

export const LoansProvider = ({ children }: { children: ReactNode }) => {
  const { error, loading, loanBids, loanRequests } = useLoansState();
  const { createLoanBid, createLoanRequest, getSupportedAssets } =
    useLoans().protocol;

  useEffect(() => {
    const res = (async () => {
      return await getSupportedAssets();
    })();
    console.log(res);
  }, []);

  const contextValue = useMemo(
    () => ({
      error,
      loading,
      loanBids,
      loanRequests,
      createLoanBid,
      createLoanRequest,
      getSupportedAssets,
    }),
    [
      error,
      loading,
      loanBids,
      loanRequests,
      createLoanBid,
      createLoanRequest,
      getSupportedAssets,
    ]
  );

  return (
    <LoansContext.Provider value={contextValue}>
      {children}
    </LoansContext.Provider>
  );
};
