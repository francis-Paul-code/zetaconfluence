/* eslint-disable @typescript-eslint/no-explicit-any */
import { moralisAxiosInstance } from '../utils/axios';

export const fetchWalletBalance = async (address: string) => {
  try {
    const res = await moralisAxiosInstance.get(`/v2.2/wallets/${address}/tokens`);
    return res.data;
  } catch (error: any) {
    console.error('[ERROR] Failed to fetch balances for: ', address);
    return { error: error?.message || error };
  }
};
