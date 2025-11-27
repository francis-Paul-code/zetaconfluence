'use client';

import { type ReactNode, useCallback, useMemo } from 'react';

import type { ChainInfo, ISupportedAsset } from '../constants/chains';
import { useWalletConnection } from '../hooks/useWalletConnection';
import { useWalletProviders } from '../hooks/useWalletProviders';
import { useWalletState } from '../hooks/useWalletState';
import { WalletContext, type WalletContextType } from './WalletContext';

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { providers, supportedAssets } = useWalletProviders();
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
  const decimals = useCallback(
    ({
      collateral,
      principal,
    }: Record<'collateral' | 'principal', ISupportedAsset>): {
      collateral: number;
      principal: number;
    } => {
      let _collateral: number;
      let _principal: number;
      switch (collateral?.network) {
        case 'ETHEREUM':
          if (
            collateral.native ||
            collateral.symbol === 'DAI' ||
            collateral.symbol === 'LINK' ||
            collateral.symbol === 'WETH' ||
            collateral.symbol === 'BNB'
          ) {
            _collateral = 10 ** 18;
            break;
          }
          if (collateral.symbol === 'WBTC') {
            _collateral = 10 ** 8;
            break;
          }
          _collateral = 10 ** 6;

          break;
        case 'SOLANA':
          if (collateral.native) {
            _collateral = 10 ** 9;
            break;
          }
          _collateral = 10 ** 6;
          break;
        case 'BITCOIN':
          _collateral = 10 ** 8;
          break;
        default:
          _collateral = 10 ** 6;
      }
      switch (principal?.network) {
        case 'ETHEREUM':
          if (
            principal.native ||
            principal.symbol === 'DAI' ||
            principal.symbol === 'LINK' ||
            principal.symbol === 'WETH' ||
            principal.symbol === 'BNB'
          ) {
            _principal = 10 ** 18;
            break;
          }
          if (principal.symbol === 'WBTC') {
            _principal = 10 ** 8;
            break;
          }
          _principal = 10 ** 6;

          break;
        case 'SOLANA':
          if (principal.native) {
            _principal = 10 ** 9;
            break;
          }
          _principal = 10 ** 6;

          break;
        case 'BITCOIN':
          _principal = 10 ** 8;
          break;
        default:
          _principal = 10 ** 6;
      }
      return {
        collateral: _collateral,
        principal: _principal,
      };
    },
    []
  );
  const contextValue: WalletContextType = useMemo(
    () => ({
      providers,
      selectedProviders,
      connecting,
      reconnecting,
      configuringWalletState,
      wallets,
      error,
      decimals,
      supportedAssets,
      isConnected,
      connectWallet: connectWallet!,
      disconnectWallet,
      chains:[] as ChainInfo[]
    } as any),
    [
      providers,
      selectedProviders,
      connecting,
      reconnecting,
      wallets,
      error,
      decimals,
      supportedAssets,
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
