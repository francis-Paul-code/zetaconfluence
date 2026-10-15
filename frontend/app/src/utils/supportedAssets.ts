import type { ISupportedAsset } from '../constants/chains';

const prod: Record<string, ISupportedAsset> = {};

const test: Record<string, ISupportedAsset> = {
  // ==== ETHEREUM ASSETS ====
  'eth-1': {
    id: 'eth-1',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: '0x1',
    network: 'ETHEREUM',
    native: true,
    decimals: 18,
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    coingeckoId:'ethereum',
    icon: '/assets/icons/eth.png',
    zrc20Address: '0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0',
  },
  // available on mainnet
  //   'wbtc-1': {
  //     id: 'wbtc-1',
  //     name: 'Wrapped Bitcoin',
  //     symbol: 'WBTC',
  //     chainId: '0x1',
  //     network: 'ETHEREUM',
  //     decimals: 8,
  //     address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  //     icon: '/assets/icons/wbtc.png',
  //   },
  'usdc-1': {
    id: 'usdc-1',
    name: 'USD Coin',
    symbol: 'USDC',
    coingeckoId:'usd-coin',
    chainId: '0x1',
    network: 'ETHEREUM',
    decimals: 6,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    zrc20Address: '0xe134d947644F90486C8106Ee528b1CD3e54A385e',
    icon: '/assets/icons/usdc.png',
  },
  'usdt-1': {
    id: 'usdt-1',
    name: 'Tether USD',
    symbol: 'USDT',
    coingeckoId:'tether',
    chainId: '0x1',
    network: 'ETHEREUM',
    decimals: 6,
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    zrc20Address: '0xD45F47412073b75B7c70728aD9A45Dee0ee01bac',
    icon: '/assets/icons/usdt.png',
  },
  //   'dai-1': {
  //     id: 'dai-1',
  //     name: 'Dai Stablecoin',
  //     symbol: 'DAI',
  //     chainId: '0x1',
  //     network: 'ETHEREUM',
  //     decimals: 18,
  //     address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  //     icon: '/assets/icons/dai.png',
  //   },
  //   'bnb-56': {
  //     id: 'bnb-56',
  //     name: 'BNB',
  //     symbol: 'BNB',
  //     chainId: '0x38',
  //     network: 'ETHEREUM',
  //     native: true,
  //     decimals: 18,
  //     address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  //     icon: '/assets/icons/bnb.png',
  //   },
  //   'matic-137': {
  //     id: 'matic-137',
  //     name: 'Polygon',
  //     symbol: 'MATIC',
  //     chainId: '0x89',
  //     network: 'ETHEREUM',
  //     native: true,
  //     decimals: 18,
  //     address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  //     icon: '/assets/icons/matic.png',
  //   },
  //   'avax-43114': {
  //     id: 'avax-43114',
  //     name: 'Avalanche',
  //     symbol: 'AVAX',
  //     chainId: '0xa86a',
  //     network: 'ETHEREUM',
  //     native: true,
  //     decimals: 18,
  //     address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  //     icon: '/assets/icons/avax.png',
  //   },
  //   'chainlink-link': {
  //     id: 'chainlink-link',
  //     name: 'Chainlink',
  //     symbol: 'LINK',
  //     decimals: 18,
  //     chainId: '0x1', // Ethereum mainnet
  //     network: 'ETHEREUM',
  //     address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', // official ERC20 LINK contract
  //     native: false,
  //     icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
  //     coingeckoId: 'chainlink',
  //   },
  //   'weth-eth-mainnet': {
  //     id: 'weth-eth-mainnet',
  //     name: 'Wrapped Ether',
  //     symbol: 'WETH',
  //     chainId: '0x1', // Ethereum Mainnet
  //     network: 'ETHEREUM',
  //     address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Canonical WETH contract
  //     decimals: 18,
  //     icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  //     native: false, // because WETH is ERC-20, not the native gas token
  //   },
  //   'bnb-eth-mainnet': {
  //     id: 'bnb-eth-mainnet',
  //     name: 'Binance Token',
  //     symbol: 'BNB',
  //     chainId: '0x1', // Ethereum Mainnet
  //     network: 'ETHEREUM',
  //     address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', // BNB ERC-20 contract on Ethereum
  //     decimals: 18,
  //     icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xB8c77482e45F1F44dE1745F52C74426C631bDD52/logo.png',
  //     native: false, // not the native token on Ethereum
  //   },

  // ==== SOLANA ASSETS ====
  'sol-101': {
    id: 'sol-101',
    name: 'Solana',
    symbol: 'SOL',
    network: 'SOLANA',
    chainId: '101', // mainnet-beta cluster id
    native: true,
    decimals: 9,
    coingeckoId:'solana',
    address: 'So11111111111111111111111111111111111111112',
    zrc20Address: '0xADF73ebA3Ebaa7254E859549A44c74eF7cff7501',
    icon: '/assets/icons/sol.png',
  },
  'usdc-sol': {
    id: 'usdc-sol',
    name: 'USD Coin',
    symbol: 'USDC',
    coingeckoId:'usd-coin',
    network: 'SOLANA',
    chainId: '101',
    decimals: 6,
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    zrc20Address: '0xD10932EB3616a937bd4a2652c87E9FeBbAce53e5',
    icon: '/assets/icons/usdc.png',
  },
  //   'usdt-sol': {
  //     id: 'usdt-sol',
  //     name: 'Tether USD',
  //     symbol: 'USDT',
  //     network: 'SOLANA',
  //     chainId: '101',
  //     decimals: 6,
  //     address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  //     icon: '/assets/icons/usdt.png',
  //   },

  // ==== BITCOIN ====
  'btc-0': {
    id: 'btc-0',
    name: 'Bitcoin',
    coingeckoId:'bitcoin',
    symbol: 'BTC',
    network: 'BITCOIN',
    chainId: '0', // placeholder
    native: true,
    decimals: 8,
    zrc20Address: '0xdbfF6471a79E5374d771922F2194eccc42210B9F',
    icon: '/assets/icons/btc.png',
  },

  // ===== TON ======

  'ton-0': {
    id: 'ton-0',
    name: 'Toncoin',
    symbol: 'TON',
    network: 'TON',
    chainId: '0',
    coingeckoId:'the-open-network',
    native: true,
    decimals: 9,
    zrc20Address: '0x54Bf2B1E91FCb56853097BD2545750d218E245e1',
    icon: '/assets/icons/ton.png',
  },
};

export default import.meta.env.NODE_ENV === 'production' ? prod : test;
