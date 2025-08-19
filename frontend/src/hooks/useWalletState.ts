/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';

import { fetchWalletBalance } from '../actions/erc20';
import { SUPPORTED_CHAIN_IDS, type Wallet } from '../constants/chains';
import type { EIP6963ProviderDetail } from '../types/wallet';

export const useWalletState = (providers: EIP6963ProviderDetail[]) => {
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [configuringWalletState, setConfiguringWAlletState] =
    useState<boolean>(false);

  const initWallets = async () => {
    setConfiguringWAlletState(true);
    const _wallets: typeof wallets = {};

    for (const item of providers) {
      item.provider.on('accountsChanged', (data: any) =>
        handleAccountsChanged(item.info.rdns, data)
      );
      item.provider.on('chainChanged', (data: any) =>
        handleChainChanged(item.info.rdns, data)
      );
      const state = await initializeWalletState(item);
      const balances =
        state?.account &&
        (
          await fetchWalletBalance({
            address: state?.account!,
            chain: '0x' + state?.decimalChainId!.toString(16),
          })
        )?.result;

      if (state)
        _wallets[item?.info?.rdns] = {
          ...state,
          eip6963: item,
          isSupportedChain: isSupportedChain(state.decimalChainId),
          balances,
        };
    }
    setWallets(_wallets);
    setConfiguringWAlletState(false);
    return;
  };

  const isSupportedChain = (id: number) => {
    if (id === null) return false;
    return SUPPORTED_CHAIN_IDS.includes(id);
  };

  const handleAccountsChanged = useCallback(
    (providerRdns: string, accounts: string[]) => {
      const wallet = wallets[providerRdns];
      if (accounts.length === 0) {
        setWallets({
          ...wallets,
          [providerRdns]: {
            ...wallet,
            account: null,
          },
        });
      } else {
        setWallets({
          ...wallets,
          [providerRdns]: {
            ...wallet,
            account: accounts[0],
          },
        });
      }
    },
    [wallets]
  );

  const handleChainChanged = useCallback(
    (providerRdns: string, newChainId: string) => {
      const wallet = wallets[providerRdns];

      setWallets({
        ...wallets,
        [providerRdns]: {
          ...wallet,
          decimalChainId: parseInt(newChainId, 16),
        },
      });
    },
    [wallets]
  );

  const initializeWalletState = async (provider: EIP6963ProviderDetail) => {
    try {
      const accounts = (await provider.provider.request({
        method: 'eth_accounts',
      })) as string[];

      const currentChainId = (await provider.provider.request({
        method: 'eth_chainId',
      })) as string;

      console.log(
        'checking chains',
        currentChainId,
        accounts,
        provider.info.rdns
      );
      return {
        decimalChainId: parseInt(currentChainId, 16),
        account: accounts && accounts.length ? accounts[0] : null,
      };
    } catch (error) {
      console.error('Error initializing wallet state:', error);
    }
  };

  useEffect(() => {
    console.log('init wallets', providers);
    initWallets();
  }, [providers.length]);

  useEffect(() => {
    return () => {
      for (const item in wallets) {
        wallets[item].eip6963.provider.removeListener(
          'accountsChanged',
          (data: any) => handleAccountsChanged(item, data)
        );
        wallets[item].eip6963.provider.removeListener(
          'chainChanged',
          (data: any) => handleChainChanged(item, data)
        );
      }
    };
  }, [handleAccountsChanged, handleChainChanged, wallets]);

  return { configuringWalletState, wallets: Object.values(wallets) };
};
