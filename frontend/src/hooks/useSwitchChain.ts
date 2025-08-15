import { useCallback } from 'react';

import { useWallet } from './useWallet';

export const useSwitchChain = () => {
  const { selectedProviders } = useWallet();

  const switchChain = useCallback(
    async (providerRdns: string, chainId: number) => {
      if (!selectedProviders.length) {
        console.error('No provider selected');
        return;
      }

      try {
        await selectedProviders[providerRdns]
          ?.provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chainId.toString(16)}` }],
          });
      } catch (error) {
        console.error('Failed to switch chain:', error);
      }
    },
    [selectedProviders]
  );

  return { switchChain };
};
