import { ethers, JsonRpcSigner } from 'ethers';

import type { Wallet } from '../constants/chains';

export const getSigner = async (wallet: Wallet): Promise<JsonRpcSigner> => {
  const ethersProvider = new ethers.BrowserProvider(wallet.eip6963.provider);
  return await ethersProvider.getSigner();
};
