import Coingecko from '@coingecko/coingecko-typescript';

import type { ISupportedAsset } from '../constants/chains';

const client = new Coingecko({
  demoAPIKey: import.meta.env['VITE_COINGECKO_API_KEY'], // Optional, for Demo API access
  environment: 'demo', // 'demo' to initialize the client with Demo API access
});

export const fetchTokenPrice = async (token: ISupportedAsset) => {
  try {
    const res = await client.simple.price.get({
      vs_currencies: 'usd',
      ids: token.coingeckoId,
      include_last_updated_at: true,
    });
    return { error: false, data: res };
  } catch (error: any) {
    console.error('[ERROR] Failed to fetch token price for: ', token);
    return { error: true, message: error?.message || error };
  }
};
