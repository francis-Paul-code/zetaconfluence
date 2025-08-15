'use client';

import { type ReactNode, useMemo } from 'react';

import { useWalletConnection } from '../hooks/useWalletConnection';
import { useWalletProviders } from '../hooks/useWalletProviders';
import { useWalletState } from '../hooks/useWalletState';
import { WalletContext } from './WalletContext';

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { providers } = useWalletProviders();
  const {
    selectedProviders,
    connecting,
    reconnecting,
    isConnected,
    error,
    connectWallet,
    disconnectWallet,
  } = useWalletConnection(providers);

  // Call useWalletState for each selectedProvider in a way that follows the Rules of Hooks
  const { wallets, configuringWalletState } = useWalletState(
    Object.values(selectedProviders)
  );

  const contextValue = useMemo(
    () => ({
      providers,
      selectedProviders,
      connecting,
      reconnecting,
      configuringWalletState,
      wallets,
      error,
      isConnected,
      connectWallet,
      disconnectWallet,
    }),
    [
      providers,
      selectedProviders,
      connecting,
      reconnecting,
      wallets,
      error,
      connectWallet,
      configuringWalletState,
      isConnected,
      disconnectWallet,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};
