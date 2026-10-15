import { ethers } from 'ethers';

import type { Wallet } from '../constants/chains';
import type { EIP6963ProviderDetail } from '../types/wallet';
import { getSigner } from './walletHelpers';

interface GetSignerAndProviderArgs {
  selectedProvider: EIP6963ProviderDetail | null;
  primaryWallet: Wallet;
}

interface GetSignerAndProviderResult {
  signer: ethers.AbstractSigner<ethers.Provider | null>;
  provider: ethers.BrowserProvider;
}

export const getSignerAndProvider = async ({
  selectedProvider,
  primaryWallet,
}: GetSignerAndProviderArgs): Promise<GetSignerAndProviderResult | null> => {
  // If we have a Dynamic wallet, use Dynamic's ethers integration
  if (primaryWallet) {
    try {
      const signer = await getSigner(primaryWallet);

      return {
        signer: signer,
        provider: new ethers.BrowserProvider(primaryWallet.eip6963.provider),
      };
    } catch (error) {
      console.error('Failed to get Dynamic signer/provider:', error);
    }
  }

  // Fallback to EIP-6963 provider if available
  if (selectedProvider) {
    const provider = new ethers.BrowserProvider(selectedProvider.provider);
    const signer = (await provider.getSigner()) as ethers.AbstractSigner;

    return {
      signer,
      provider,
    };
  }

  return null;
};
