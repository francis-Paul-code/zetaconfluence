import React, { useCallback, useMemo, useState } from 'react';
import { VscDebugDisconnect } from 'react-icons/vsc';

import type { Wallet } from '../constants/chains';
import { useWallet } from '../hooks/useWallet';
import AppLoader from './AppLoader';
import { Button } from './Button';
import { Modal } from './Modal';
import classNames from 'classnames';
import { IoCopy } from 'react-icons/io5';

export interface connectedWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
}

const ConnectedWalletModal = ({
  isOpen,
  onClose,
  wallet,
}: connectedWalletModalProps) => {
  const { isConnected, disconnectWallet, connectWallet } = useWallet();
  const [provider, setProvider] = useState(wallet.eip6963);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const connected = useMemo(() => {
    return isConnected(wallet.eip6963.info.rdns);
  }, [isConnected, wallet.eip6963.info.rdns]);

  const handleDisconnect = async () => {
    if (connected) {
      setIsDisconnecting(true);
      await disconnectWallet(wallet.eip6963.info.rdns);
      setIsDisconnecting(false);
    }
  };

  const handleConnect = async () => {
    if (!connected) {
      setIsConnecting(true);
      await connectWallet(provider);
      setIsConnecting(false);
    }
  };

  const handleCopyToClipboard = useCallback(() => {
    if (wallet.account) {
      navigator.clipboard.writeText(wallet.account);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [wallet.account]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={'Wallet Details'}
      className=" border-0 min-w-[60dvw] h-[70dvh]"
    >
      {(isDisconnecting || isConnecting) && <AppLoader />}
      <div className="w-full h-full overflow-y-scroll py-2">
        <div className="w-full h-auto flex items-start flex-col dark:bg-[#23387640] bg-gray-200 rounded-xl p-4 min-h-[150px]">
          <div className="flex flex-row items-center gap-2 w-full">
            <img
              className="size-[25px] mr-2"
              src={wallet.eip6963.info.icon}
              alt={wallet.eip6963.info.name}
            ></img>
            <h2 className="text-base font-medium ">
              {wallet.eip6963.info.name}
            </h2>
            <Button
              className={
                'ml-auto px-3 py-3 text-white rounded-xl ' +
                classNames({
                  'bg-red-400': connected,
                  'bg-green-400': !connected,
                })
              }
              icon={<VscDebugDisconnect />}
              onClick={connected ? handleDisconnect : handleConnect}
            >
              {connected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
          <div className="w-full h-auto grid grid-cols-2 gap-1 mt-5">
            <div className="flex flex-col items-start">
              <h4 className="font-light text-sm dark:text-white/80 text-gray-900 mt-2">
                Total Balance
              </h4>
              <p className="font-normal text-sm dark:text-white/90 text-gray-800">
                {wallet.balances
                  ?.reduce((acc, item) => {
                    return (
                      acc + Number(item.balance_formatted) * item.usd_price!
                    );
                  }, 0)
                  ?.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
              </p>
            </div>
            <div className="flex flex-col items-end w-auto">
              <h4 className="w-full font-medium text-sm dark:text-white/80 text-gray-900 mt-2 text-end mb-1">
                Address
              </h4>
              <p className="font-normal text-sm dark:text-white/90 text-gray-800 flex items-center">
                {wallet.account?.slice(0, 6) +
                  '...' +
                  wallet.account?.slice(-4) || 'N/A'}
                <span
                  className={
                    'size-[15px] dark:hover:text-gray-100/70 overflow-hidden text-gray-500 dark:text-gray-400 ml-2 cursor-pointer ' +
                    classNames({ '!text-green-300': copySuccess })
                  }
                  onClick={handleCopyToClipboard}
                  title="Copy to clipboard"
                >
                  <IoCopy className="size-full" />
                </span>
              </p>
            </div>
            <div className="flex flex-col items-end w-auto col-start-2">
              <h4 className="w-full font-medium text-sm dark:text-white/80 text-gray-900 mt-2 text-end mb-1">
                Chain
              </h4>
              <p className="font-normal text-sm dark:text-white/90 text-gray-800 flex items-center">
                {'x0'+wallet.decimalChainId?.toString(16) || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConnectedWalletModal;
