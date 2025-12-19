import { useMemo } from 'react';
import type { EIP1193Provider } from 'viem';

import type { HexAddr } from '../config/viem';
import type { Wallet } from '../constants/chains';
import type { LoanRequest } from '../constants/loans';
import type { EIP6963ProviderDetail } from '../types/wallet';
import protocol from '../utils/protocol';
import { useWallet } from './useWallet';

export const useLoansState = () => {
  const [loading, setLoading] = useMemo(() => [false, () => {}], []);
  const [error, setError] = useMemo(() => [null, () => {}], []);

  const { wallets, selectedProviders } = useWallet();

  const supportedAssets = useMemo(async () =>{ const res = await protocol.getSupportedAssetsSync()
    console.log('Supported Assets: ', res)
    return res
  }, []);

  const getUserData = async ({
    account,
    wallet,
    provider,
  }: {
    account: HexAddr;
    wallet: Wallet;
    provider: EIP6963ProviderDetail;
  }) => {
    try {
      const requestsForWallet = await protocol.getUserData(
        account,
        wallet,
        provider
      );

      console.log('some result', requestsForWallet);
    } catch (error) {
      console.error(
        `Error fetching loan requests for wallet ${wallet.account}:`,
        error
      );
      // setError(error.message);
    }
  };

  const loanRequests = useMemo(() => {
    const requests: LoanRequest[] = [];
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      if (!wallet.account) continue;

      getUserData({
        account: wallet.account! as HexAddr,
        wallet,
        provider: selectedProviders[i],
      });
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
