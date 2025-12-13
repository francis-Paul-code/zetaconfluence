/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ISupportedAsset } from '../constants/chains';
import { moralisAxiosInstance } from '../utils/axios';

export const fetchWalletBalance = async ({
  address,
  chain = '0x1',
}: Record<'address' | 'chain', string>) => {
  try {
    const params = {
      chain,
    };
    const res = await moralisAxiosInstance.get(
      `/v2.2/wallets/${address}/tokens`,
      { params }
    );
    return res.data;
  } catch (error: any) {
    console.error('[ERROR] Failed to fetch balances for: ', address);
    return { error: error?.message || error };
  }
};

export const fetchTokenMetadata = async (token: ISupportedAsset) => {
  try {
    const params = {
      addresses: token.address,
      chain: token.chainId,
    };
    const res = await moralisAxiosInstance.get(`/v2.2/discovery/token}`, {
      params,
    });
    return res.data;
  } catch (error: any) {
    console.error('[ERROR] Failed to fetch token metadata for: ', token);
    return { error: error?.message || error };
  }
};

export const fetchTokenPrice = async (tokens: ISupportedAsset[]) => {
  try {
    const params = {
      chain: tokens[0].chainId,
    };
    const body = tokens.map((i) => ({ token_address: i.address }));
    const res = await moralisAxiosInstance.post(
      `/v2.2/erc20/prices/`,
      { tokens: body },
      {
        params,
      }
    );
    return res.data;
  } catch (error: any) {
    console.error('[ERROR] Failed to fetch token price for: ', tokens);
    return { error: error?.message || error };
  }
};
