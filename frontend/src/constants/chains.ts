import type { EIP6963ProviderDetail } from '../types/wallet';

export interface SupportedChain {
  explorerUrl: string;
  name: string;
  chainId: number;
  icon: string;
  colorHex: string;
}
export interface Explorer {
  name: string;
  url: string;
  icon?: string;
  standard?: string;
}

export interface Feature {
  name: string;
}

export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}
export interface WalletToken {
  token_address: string;
  symbol: string;
  name: string;
  logo: string | null;
  thumbnail: string | null;
  decimals: number;
  balance: string;
  possible_spam: boolean;
  verified_contract: boolean;
  total_supply: string | null;
  total_supply_formatted: string | null;
  percentage_relative_to_total_supply: number | null;
  security_score: number | null;
  balance_formatted: string;
  usd_price: number | null;
  usd_price_24hr_percent_change: number | null;
  usd_price_24hr_usd_change: number | null;
  usd_value: number | null;
  usd_value_24hr_usd_change: number | null;
  native_token: boolean;
  portfolio_percentage: number | null;
}

export interface ChainInfo {
  name: string;
  chain: string;
  rpc: string[];
  faucets: string[];
  nativeCurrency: NativeCurrency;
  features?: Feature[];
  infoURL?: string;
  shortName?: string;
  chainId: number;
  networkId?: number;
  icon?: string;
  explorers?: Explorer[];
}

export const SUPPORTED_CHAINS: SupportedChain[] = [
  {
    explorerUrl: 'https://sepolia.arbiscan.io/tx/',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    icon: '/logos/arbitrum-logo.svg',
    colorHex: '#28446A',
  },
  {
    explorerUrl: 'https://testnet.snowtrace.io/tx/',
    name: 'Avalanche Fuji',
    chainId: 43113,
    icon: '/logos/avalanche-logo.svg',
    colorHex: '#FF394A',
  },
  {
    explorerUrl: 'https://sepolia.basescan.org/tx/',
    name: 'Base Sepolia',
    chainId: 84532,
    icon: '/logos/base-logo.svg',
    colorHex: '#0052FF',
  },
  {
    explorerUrl: 'https://testnet.bscscan.com/tx/',
    name: 'BSC Testnet',
    chainId: 97,
    icon: '/logos/bsc-logo.svg',
    colorHex: '#E1A411',
  },
  {
    explorerUrl: 'https://sepolia.etherscan.io/tx/',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    icon: '/logos/ethereum-logo.svg',
    colorHex: '#3457D5',
  },
  {
    explorerUrl: 'https://amoy.polygonscan.com/tx/',
    name: 'Polygon Amoy',
    chainId: 80002,
    icon: '/logos/polygon-logo.svg',
    colorHex: '#692BD7',
  },
];

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(
  (chain) => chain.chainId
);

export const ZETACHAIN_ATHENS_BLOCKSCOUT_EXPLORER_URL =
  'https://zetachain-testnet.blockscout.com/tx/';

export interface Wallet {
  account: string | null;
  isSupportedChain: boolean;
  decimalChainId: number | null;
  eip6963: EIP6963ProviderDetail;
  balances?: WalletToken[];
}


export interface ISupportedAsset {
  id: string;
  name: string;
  symbol: string;
  chainId: string;
  network: string;
  native?: boolean;
  decimals: number;
  address?: string;
  icon: string;
}

export const BITCOIN_GATEWAY_ADDRESS_SIGNET =""