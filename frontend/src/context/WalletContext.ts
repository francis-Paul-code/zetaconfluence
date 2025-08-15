/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext } from 'react';

import type { ChainInfo, Wallet } from '../constants/chains';
import type { EIP6963ProviderDetail } from '../types/wallet';

interface WalletContextType {
  providers: EIP6963ProviderDetail[];
  selectedProviders: Record<string, EIP6963ProviderDetail>;
  connecting: boolean;
  reconnecting: boolean;
  isConnected: (providerRdns: string) => boolean;
  configuringWalletState: boolean;
  error: string | null;
  connectWallet: (provider: EIP6963ProviderDetail) => Promise<{
    success: boolean;
    account?: string | null;
    error?: string;
  }>;
  disconnectWallet: (_: any) => void;
  chains: ChainInfo[];
  wallets: Wallet[];
}

export const WalletContext = createContext<WalletContextType>({
  providers: [],
  selectedProviders: {},
  wallets: [],
  chains: [],
  connecting: false,
  reconnecting: false,
  configuringWalletState: false,
  error: null,
  isConnected: () => true,
  connectWallet: async () => ({ success: false }),
  disconnectWallet: () => {},
});
