import { useEffect, useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import type { EIP6963ProviderDetail } from '../types/wallet';
import { Button } from './Button';
import { VscLoading } from 'react-icons/vsc';
import AppLoader from './AppLoader';

const ProviderCard = ({ provider }: { provider: EIP6963ProviderDetail }) => {
  const { connectWallet, connecting } = useWallet();
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  useEffect(() => {
    if (!connecting && isConnecting) {
      setIsConnecting(false);
    }
  }, [connecting]);

  const connect = () => {
    setIsConnecting(true);
    connectWallet(provider);
  };
  return (
    <>
      <div className="min-w-[250px] rounded-xl bg-gray-200 dark:bg-[#23387633] flex items-center flex-col py-3 overflow-hidden">
        <div className="w-full h-auto flex flex-col items-center p-3 gap-3">
          <div className="size-[80px] flex mr-3 items-center">
            <img
              src={provider.info?.icon}
              alt={provider.info.name}
              className="size-full object-cover"
            />
          </div>
          <div className="text-lg w-full dark:text-white text-gray-800 font-semibold text-center">
            {provider.info?.name}
          </div>
        </div>
        <div className="w-full h-auto flex flex-col p-3 items-center">
          <Button
            className="bg-primary w-[200px] text-white "
            onClick={connect}
            disabled={connecting}
          >
            Connect
          </Button>
        </div>
      </div>

      {isConnecting && <AppLoader />}
    </>
  );
};

export default ProviderCard;
