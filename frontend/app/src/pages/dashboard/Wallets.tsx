import React, { useMemo } from 'react';
import { FaWallet } from 'react-icons/fa6';
import { VscLoading } from 'react-icons/vsc';

import ProviderCard from '../../components/ProviderCard';
import WalletCard from '../../components/WalletCard';
import { useWallet } from '../../hooks/useWallet';

const Wallets = () => {
  const { selectedProviders, wallets, configuringWalletState, providers } =
    useWallet();
  const available_providers = useMemo(() => {
    return providers.filter((i) => !selectedProviders[i.info?.rdns]);
  }, [selectedProviders, providers]);

  return (
    <div className="w-full h-full overflow-hidden bg-gray-50 rounded-2xl dark:bg-background_dark p-3 ">
      {configuringWalletState ? (
        <div className="size-full flex items-center justify-center">
          <span className="size-[25px] flex items-center dark:text-gray-400/80 text-gray-700/80 animate-spin">
            <VscLoading size="100%" />
          </span>
        </div>
      ) : (
        <div className="w-full h-full overflow-y-scroll">
          {Object.values(selectedProviders).length > 0 && (
            <>
              <div className="w-full h-auto flex items-center mb-5 gap-2 px-3 mt-5">
                <span className="size-[25px] cursor-pointer overflow-hidden dark:text-gray-500/50 text-gray-700/70">
                  <FaWallet size="100%" />
                </span>
                <h4 className="font-medium text-lg dark:text-gray-300/90 text-gray-800">
                  Connected Wallets
                </h4>
              </div>
              <div className="w-full h-auto grid grid-cols-2 md:grid-cols-4 grid-flow-row-dense gap-2 px-2">
                {wallets.map((item) => {
                  return (
                    <div className="w-auto h-auto flex items-center">
                      <WalletCard wallet={item} />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* available  */}
          <div className="w-full h-auto flex items-center mb-5 gap-2 px-3 mt-5">
            <span className="size-[25px] cursor-pointer overflow-hidden dark:text-gray-500/50 text-gray-700/70">
              <FaWallet size="100%" />
            </span>
            <h4 className="font-medium text-lg dark:text-gray-300/90 text-gray-800">
              Available Wallets
            </h4>
          </div>
          <div className="w-full h-fit flex flex-row items-center flex-nowrap overflow-x-scroll gap-2 px-3 scroll-ps">
            {available_providers.map((item) => {
              return (
                <div className="w-auto h-auto flex items-center">
                  <ProviderCard provider={item} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallets;
