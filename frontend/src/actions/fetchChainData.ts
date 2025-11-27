import axios from 'axios';
import { coinGeckoAxiosInstance } from '../utils/axios';
import type { ChainInfo } from '../constants/chains';

export const fetchCoinDataByCoinId = async (coinId: string) => {
  try {
    const res = await coinGeckoAxiosInstance.get(`coins/${coinId}`);
    return res.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : error;
    return { error: errorMessage };
  }
};
export async function fetchChains(): Promise<ChainInfo[] | null> {
  try {
    const res = await axios.get('https://chainlist.org/rpcs.json');
    const chains = res.data;
    return chains;
  } catch (error) {
    console.error('[ERROR] Failed to Fetch ChainId.org Data', error);
    return null;
  }
}
