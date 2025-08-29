import { useMemo } from 'react';
import { useLoans } from './useLoans';
import { useWallet } from './useWallet';
import type { loanRequest } from '../constants/loans';

export const useLoansState = () => {
  const [loading, setLoading] = useMemo(() => [false, () => {}], []);
  const [error, setError] = useMemo(() => [null, () => {}], []);

  const { getLoanRequests, getActiveLoans, getActivePositions, getLoanBids } =
    useLoans();
  const { wallets } = useWallet();
  const loanRequests = useMemo(async () => {
    let requests: loanRequest[] = [];
    for (const wallet of Object.values(wallets)) {
      if (!wallet.account) continue;

      try {
        const requestsForWallet = await getLoanRequests(wallet.account);
        requests = [...requests, ...requestsForWallet];
      } catch (error) {
        console.error(
          `Error fetching loan requests for wallet ${wallet.account}:`,
          error
        );
        setError(error.message);
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
