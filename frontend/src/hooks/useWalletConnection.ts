import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from 'react-use';

import type { EIP6963ProviderDetail } from '../types/wallet';
import {
  findProviderByAccount,
  findProviderByName,
  findProviderByRdns,
  findProviderByUuid,
} from '../utils/eip6963';
import type { StoredWalletData } from '../utils/walletStorage';
import { getEmptyWalletData } from '../utils/walletStorage';

export const useWalletConnection = (providers: EIP6963ProviderDetail[]) => {
  const [selectedProviders, setSelectedProviders] = useState<
    Record<string, EIP6963ProviderDetail>
  >({});
  const [connecting, setConnecting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use localStorage to persist wallet connection data
  const [savedWalletData, setSavedWalletData] = useLocalStorage<
    Record<string, StoredWalletData>
  >(`wallet-connections`, getEmptyWalletData());

  // Check if wallet is connected
  const isConnected = useCallback(
    (providerRdns: string) => {
      return Boolean(selectedProviders[providerRdns]);
    },
    [selectedProviders]
  );

  // Connect wallet function
  const connectWallet = useCallback(
    async (provider: EIP6963ProviderDetail) => {
      if (connecting) return;
      try {
        setConnecting(true);
        setError(null);

        // Request accounts
        const accounts = (await provider.provider.request({
          method: 'eth_requestAccounts',
        })) as string[];

        if (accounts && accounts.length > 0) {
          console.log(selectedProviders);
          setSelectedProviders({
            ...selectedProviders,
            [provider.info.rdns]: provider,
          });

          // Save to localStorage with provider identifiers
          setSavedWalletData({
            ...savedWalletData,
            [provider.info.rdns]: {
              account: accounts[0],
              providerUuid: provider.info.uuid,
              providerName: provider.info.name,
              providerRdns: provider.info.rdns,
            },
          });

          return { success: true, account: accounts[0] };
        }

        return { success: false, account: null };
      } catch (err) {
        // Provide a more user-friendly error message for common errors
        const errorMsg = err instanceof Error ? err.message : String(err);
        let userErrorMsg = 'Failed to connect wallet';

        if (
          errorMsg.includes('429') ||
          errorMsg.includes('too many requests')
        ) {
          userErrorMsg =
            'Connection temporarily unavailable due to too many requests. Please try again in a moment.';
        } else if (errorMsg.includes('user rejected')) {
          userErrorMsg = 'Connection rejected by user.';
        } else if (errorMsg.includes('already pending')) {
          userErrorMsg =
            'Connection request already pending. Please check your wallet.';
        }

        setError(userErrorMsg);
        return { success: false, error: userErrorMsg };
      } finally {
        setConnecting(false);
      }
    },
    [connecting, savedWalletData, selectedProviders, setSavedWalletData]
  );

  // Disconnect wallet function
  const disconnectWallet = useCallback(
    (walletRdns: string) => {
      console.log('Disconnecting wallet:', walletRdns);
      if (selectedProviders[walletRdns]) {
        // Clear localStorage when disconnecting
        const saved: typeof savedWalletData = {};
        const selected: typeof selectedProviders = {};
        for (const item in savedWalletData) {
          if (savedWalletData[item].providerRdns === walletRdns) continue;
          saved[savedWalletData[item].providerRdns!] = savedWalletData[item];
        }
        for (const item in selectedProviders) {
          if (selectedProviders[item].info.rdns === walletRdns) continue;

          selected[selectedProviders[item].info.rdns!] =
            selectedProviders[item];
        }
        setSavedWalletData(saved);
        setSelectedProviders(selected);
      }
    },
    [selectedProviders, setSavedWalletData]
  );

  const reconnectWallet = async () => {
    console.log('a chnage is to happen');
    try {
      setReconnecting(true);
      // Try to find the saved provider using multiple methods
      const savedProviders: typeof selectedProviders = {};
      const _savedWalletData: typeof savedWalletData = {};

      for (const item in savedWalletData) {
        const saved_provider = savedWalletData[item];
        let _provider = null;

        // Method 1: Try to find by UUID (most specific)
        if (saved_provider.providerUuid) {
          _provider = findProviderByUuid(
            providers,
            saved_provider.providerUuid!
          );
        }

        // Method 2: If not found by UUID, try to find by rdns
        if (!_provider && saved_provider.providerRdns) {
          _provider = findProviderByRdns(
            providers,
            saved_provider.providerRdns
          );
        }

        // Method 3: If still not found, try to find by name
        if (!_provider && saved_provider.providerName) {
          _provider = findProviderByName(
            providers,
            saved_provider.providerName
          );
        }

        // Method 4: Last resort - try to find by account
        if (!_provider && saved_provider.account) {
          _provider = await findProviderByAccount(
            providers,
            saved_provider.account
          );
        }

        if (_provider) {
          if (savedProviders[_provider.info.rdns]) continue;

          const accounts = (await _provider.provider.request({
            method: 'eth_accounts',
          })) as string[];

          if (
            accounts &&
            accounts.length > 0 &&
            accounts.some(
              (a) => a.toLowerCase() === saved_provider.account?.toLowerCase()
            )
          ) {
            savedProviders[_provider.info.rdns] = _provider;
            _savedWalletData[_provider.info.rdns] = saved_provider;
          } else {
            // Clear saved data if we can't reconnect
            continue;
          }
        }
      }
      setSavedWalletData(_savedWalletData);
      setSelectedProviders(savedProviders);
    } catch (error) {
      // Don't clear saved data on transient errors
      console.error('Error reconnecting wallet:', error);
    } finally {
      setReconnecting(false);
    }
  };

  useEffect(() => {
    if (!savedWalletData) return;

    console.log('effecting a change');
    if (providers.length > 0) {
      // Add a small delay to allow providers to load
      const timeout = setTimeout(async () => {
        await reconnectWallet();
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [providers]);

  return {
    selectedProviders,
    connecting,
    reconnecting,
    isConnected,
    error,
    connectWallet,
    disconnectWallet,
  };
};
