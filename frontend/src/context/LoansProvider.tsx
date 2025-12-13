import { type ReactNode, useEffect, useMemo } from 'react';

import { useLoans } from '../hooks/useLoans';
import { useLoansState } from '../hooks/useLoansState';
import { LoansContext, type LoansContextType } from './LoansContext';

export const LoansProvider = ({ children }: { children: ReactNode }) => {
  const { error, loading, loanBids, loanRequests } = useLoansState();
  const {
    createLoanRequest,
    getSupportedAssets,
    executeLoan,
    getLoan,
    getUserData,
    placeLoanBid,
    recoverBidFunding,
  } = useLoans().protocol;

  useEffect(() => {
    const res = (async () => {
      // return await getSupportedAssets();
    })();
    console.log(res);
  }, []);

  const contextValue: LoansContextType = useMemo(
    () =>
      ({
        error,
        loading,
        loanBids,
        loanRequests,
        createLoanBid: placeLoanBid,
        createLoanRequest,
        getSupportedAssets,
      } as unknown as LoansContextType),
    [
      error,
      loading,
      loanBids,
      loanRequests,
      placeLoanBid,
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
