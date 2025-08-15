
import { useWallet } from '../hooks/useWallet';
import type { EIP6963ProviderDetail } from '../types/wallet';
import { Modal } from './Modal';

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: EIP6963ProviderDetail[];
  onConnect: (provider: EIP6963ProviderDetail) => void;
}

export const WalletSelectionModal = ({
  isOpen,
  onClose,
  providers,
  onConnect,
}: WalletSelectionModalProps) => {
  const { isConnected } = useWallet();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect a Wallet">
      <div className="flex flex-col gap-2">
        {providers.map((provider) => {
          const _connected = isConnected(provider?.info?.rdns);

          return (
            <button
              key={provider.info.uuid}
              className="w-full h-auto flex items-center px-2 py-3 gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg cursor-pointer disabled:bg-[#e5e8ec] disabled:text-[#696e75] dark:disabled:bg-[#283442] dark:disabled:text-[#a9acb0] "
              onClick={() => onConnect(provider)}
              aria-label={`Connect ${provider.info.name} wallet`}
              disabled={_connected}
            >
              <img
                src={provider.info.icon}
                alt={`${provider.info.name} wallet icon`}
                className="size-[2rem]"
                loading="lazy"
              />
              <span>{provider.info.name}</span>
              {_connected && (
                <span className="text-primary ml-auto text-sm">Connected</span>
              )}
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
