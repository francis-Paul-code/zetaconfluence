import { useState } from 'react';
import { FaWallet } from 'react-icons/fa6';
import { IoAdd } from 'react-icons/io5';

import { useWallet } from '../hooks/useWallet';
import type { EIP6963ProviderDetail } from '../types/wallet';
import { Button } from './Button';
import { WalletSelectionModal } from './WalletSelectionModal';

export const ConnectWallet = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { providers, connectWallet, connecting, selectedProviders } =
    useWallet();

  const handleConnectClick = () => {
    if (providers.length > 0) {
      setIsModalOpen(true);
    } else {
      alert('No wallet providers found. Please install a wallet extension.');
    }
  };

  const handleSelectProvider = (provider: EIP6963ProviderDetail) => {
    connectWallet(provider);
  };
  return (
    <>
      {Object.values(selectedProviders).length ? (
        <div className="h-auto w-fit px-2 py-1 flex items-center gap-2">
          {Object.values(selectedProviders).map((i) => (
            <div className="size-[25px] overflow-hidden rounded-full p-1 dark:bg-gray-200/50 bg-gray-600/50  cursor-pointer hover:border-1 border-primary">
              <img
                src={i.info.icon}
                alt={i.info.name}
                className="size-full object-cover"
              ></img>
            </div>
          ))}
          <div
            onClick={handleConnectClick}
            className=" size-fit flex items-center overflow-hidden rounded-full p-1 bg-primary cursor-pointer hover:after:pr-2 after:text-base after:text-white after:font-medium hover:after:content-['Connect']"
          >
            <span className="text-white size-[23px] overflow-hidden ">
              <IoAdd size="23" />
            </span>
          </div>
        </div>
      ) : (
        <Button
          icon={<FaWallet />}
          className="min-w-[200px] bg-primary text-white py-3 px-3 text-sm font-bold"
          onClick={handleConnectClick}
          // disabled={connecting}
        >
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      )}
      <WalletSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        providers={providers}
        onConnect={handleSelectProvider}
      />
    </>
  );
};
