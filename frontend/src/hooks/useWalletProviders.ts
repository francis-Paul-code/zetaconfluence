import { useCallback, useEffect, useState } from 'react';

import type { EIP6963ProviderDetail } from '../types/wallet';
import {
  createProviderAnnounceHandler,
  requestEIP6963Providers,
} from '../utils/eip6963';

/**
 * Hook to discover and manage EIP-6963 wallet providers
 */
export const useWalletProviders = () => {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);
  const supportedMultiChainWallets = [
    'xverse',
    'cosmostation',
    'trust',
    'phantom',
  ];
  const supportedAssets = {
    // ==== ETHEREUM ASSETS ====
    'eth-1': {
      id: 'eth-1',
      name: 'Ethereum',
      symbol: 'ETH',
      chainId: '0x1',
      network: 'ETHEREUM',
      native: true,
      decimals: 18,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // convention for native ETH
      icon: '/assets/icons/eth.png',
    },
    'wbtc-1': {
      id: 'wbtc-1',
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      chainId: '0x1',
      network: 'ETHEREUM',
      decimals: 8,
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      icon: '/assets/icons/wbtc.png',
    },
    'usdc-1': {
      id: 'usdc-1',
      name: 'USD Coin',
      symbol: 'USDC',
      chainId: '0x1',
      network: 'ETHEREUM',
      decimals: 6,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      icon: '/assets/icons/usdc.png',
    },
    'usdt-1': {
      id: 'usdt-1',
      name: 'Tether USD',
      symbol: 'USDT',
      chainId: '0x1',
      network: 'ETHEREUM',
      decimals: 6,
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      icon: '/assets/icons/usdt.png',
    },
    'dai-1': {
      id: 'dai-1',
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      chainId: '0x1',
      network: 'ETHEREUM',
      decimals: 18,
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      icon: '/assets/icons/dai.png',
    },
    'bnb-56': {
      id: 'bnb-56',
      name: 'BNB',
      symbol: 'BNB',
      chainId: '0x38',
      network: 'ETHEREUM',
      native: true,
      decimals: 18,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      icon: '/assets/icons/bnb.png',
    },
    'matic-137': {
      id: 'matic-137',
      name: 'Polygon',
      symbol: 'MATIC',
      chainId: '0x89',
      network: 'ETHEREUM',
      native: true,
      decimals: 18,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      icon: '/assets/icons/matic.png',
    },
    'avax-43114': {
      id: 'avax-43114',
      name: 'Avalanche',
      symbol: 'AVAX',
      chainId: '0xa86a',
      network: 'ETHEREUM',
      native: true,
      decimals: 18,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      icon: '/assets/icons/avax.png',
    },
    'chainlink-link': {
      id: 'chainlink-link',
      name: 'Chainlink',
      symbol: 'LINK',
      decimals: 18,
      chainId: '0x1', // Ethereum mainnet
      network: 'ETHEREUM',
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', // official ERC20 LINK contract
      native: false,
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
      coingeckoId: 'chainlink',
    },
    'weth-eth-mainnet': {
      id: 'weth-eth-mainnet',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      chainId: '0x1', // Ethereum Mainnet
      network: 'ETHEREUM',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Canonical WETH contract
      decimals: 18,
      icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      native: false, // because WETH is ERC-20, not the native gas token
    },
    'bnb-eth-mainnet':{
  id: 'bnb-eth-mainnet',
  name: 'Binance Token',
  symbol: 'BNB',
  chainId: '0x1', // Ethereum Mainnet
  network: 'ETHEREUM',
  address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', // BNB ERC-20 contract on Ethereum
  decimals: 18,
  icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xB8c77482e45F1F44dE1745F52C74426C631bDD52/logo.png',
  native: false, // not the native token on Ethereum
},

    // ==== SOLANA ASSETS ====
    'sol-101': {
      id: 'sol-101',
      name: 'Solana',
      symbol: 'SOL',
      network: 'SOLANA',
      chainId: '101', // mainnet-beta cluster id
      native: true,
      decimals: 9,
      address: 'So11111111111111111111111111111111111111112',
      icon: '/assets/icons/sol.png',
    },
    'usdc-sol': {
      id: 'usdc-sol',
      name: 'USD Coin',
      symbol: 'USDC',
      network: 'SOLANA',
      chainId: '101',
      decimals: 6,
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      icon: '/assets/icons/usdc.png',
    },
    'usdt-sol': {
      id: 'usdt-sol',
      name: 'Tether USD',
      symbol: 'USDT',
      network: 'SOLANA',
      chainId: '101',
      decimals: 6,
      address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      icon: '/assets/icons/usdt.png',
    },

    // ==== BITCOIN ====
    'btc-0': {
      id: 'btc-0',
      name: 'Bitcoin',
      symbol: 'BTC',
      network: 'BITCOIN',
      chainId: '0', // placeholder
      native: true,
      decimals: 8,
      address: '', // no contract for BTC
      icon: '/assets/icons/btc.png',
    },
  };
  // Handler for provider announcements
  const handleAnnounceProvider = useCallback(
    (provider: EIP6963ProviderDetail) => {
      setProviders((prev) => {
        // Check if provider already exists
        if (!prev.some((p) => p.info.uuid === provider.info.uuid)) {
          return [...prev, provider];
        }
        return prev;
      });
    },
    []
  );

  useEffect(() => {
    const nonETHEREUMProviders = {
      solana: [
        window.solana, // Phantom
        window.trustwallet?.solana, // Trust
        window.cosmostation?.solana, // Cosmostation
      ].filter(Boolean),

      bitcoin: [
        window.trustwallet?.bitcoin, // Trust
        window.BitcoinProvider, // Xverse
      ].filter(Boolean),
    };
    console.log('Non-ETHEREUM Providers:', nonETHEREUMProviders, window);
  }, []);

  // Initialize EIP-6963 provider discovery
  useEffect(() => {
    // Create handler for provider announcements
    const announceHandler = createProviderAnnounceHandler(
      handleAnnounceProvider
    );

    // Add event listener for provider announcements
    window.addEventListener(
      'eip6963:announceProvider',
      announceHandler as EventListener
    );

    // Request providers
    requestEIP6963Providers();

    // Cleanup
    return () => {
      window.removeEventListener(
        'eip6963:announceProvider',
        announceHandler as EventListener
      );
    };
  }, [handleAnnounceProvider]);

  return { providers, supportedAssets };
};
