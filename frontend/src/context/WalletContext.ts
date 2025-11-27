import { createContext } from 'react';

import type { ChainInfo, ISupportedAsset, Wallet } from '../constants/chains';
import type { EIP6963ProviderDetail } from '../types/wallet';

interface WalletContextType {
  providers: EIP6963ProviderDetail[];
  selectedProviders: Record<string, EIP6963ProviderDetail>;
  connecting: boolean;
  reconnecting: boolean;
  isConnected: (providerRdns: string) => boolean;
  configuringWalletState: boolean;
  error: string | null;
  bitcoin?: any | null;
  decimals: ({
    collateral,
    principal,
  }: Record<'collateral' | 'principal', ISupportedAsset>) => Record<
    'collateral' | 'principal',
    number
  >;
  connectWallet: (provider: EIP6963ProviderDetail) => Promise<{
    success: boolean;
    account?: string | null;
    error?: string;
  }>;
  disconnectWallet: (providerRdns: string) => Promise<void>;
  chains: ChainInfo[];
  wallets: Wallet[];
  supportedAssets: Record<string, ISupportedAsset>;
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
  bitcoin: null,
  decimals: () => ({ collateral: NaN, principal: NaN }),
  isConnected: () => true,
  connectWallet: async () => ({ success: false }),
  disconnectWallet: async () => {},
  supportedAssets: {},
});
