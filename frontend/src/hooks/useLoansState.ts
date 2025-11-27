import { useMemo } from 'react';

import type { LoanRequest } from '../constants/loans';
import { useWallet } from './useWallet';

export const useLoansState = () => {
  const [loading, setLoading] = useMemo(() => [false, () => {}], []);
  const [error, setError] = useMemo(() => [null, () => {}], []);

  const { wallets } = useWallet();
  const loanRequests = useMemo( () => {
    const requests: LoanRequest[] = [];
    for (const wallet of Object.values(wallets)) {
      if (!wallet.account) continue;

      try {
        // const requestsForWallet = await getSupportedAssets();
        // console.log('some result',requestsForWallet)
         requests.push({} as LoanRequest)
      } catch (error) {
        console.error(
          `Error fetching loan requests for wallet ${wallet.account}:`,
          error
        );
        // setError(error.message);
      }
    }

    return requests;
  }, [wallets.length]);
  
  const loanBids = useMemo(() => [], []);

  return {
    loanRequests,
    loanBids,
    loading,
    error,
  };
};
