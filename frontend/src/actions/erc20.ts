/* eslint-disable @typescript-eslint/no-explicit-any */
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
