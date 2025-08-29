import { type ReactNode, useMemo } from 'react';
import { LoansContext } from './LoansContext';
import { useLoans } from '../hooks/useLoans';

export const LoansProvider = ({ children }: { children: ReactNode }) => {
  const { createLoanRequest } = useLoans();
  const contextValue = useMemo(
    () => ({
      createLoanRequest,
    }),
    [createLoanRequest]
  );

  return (
    <LoansContext.Provider value={contextValue}>
      {children}
    </LoansContext.Provider>
  );
};
