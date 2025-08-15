import { IoFileTrayFull } from 'react-icons/io5';

import type { Wallet } from '../constants/chains';
import ConnectedWalletModal from './ConnectedWalletModal';
import { useState } from 'react';

const WalletCard = ({ wallet }: { wallet: Wallet }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const total_balance = wallet.balances?.reduce((acc, item) => {
    return acc + Number(item.balance) * item.usd_price!;
  }, 0);
  return (
    <>
      <div
        className="size-full rounded-xl bg-gray-200 dark:bg-[#23387633] flex items-center flex-col py-3 overflow-hidden"
        onClick={() => setIsModalOpen(!isModalOpen)}
      >
        <div className="w-full h-auto flex items-center p-3">
          <div className="size-[20px] flex mr-3 items-center">
            <img
              src={wallet?.eip6963.info?.icon}
              alt={wallet?.eip6963.info.name}
            />
          </div>
          <div className="text-base dark:text-white text-black font-semibold ">
            {wallet?.eip6963.info?.name}
          </div>
          <div className="bg-gray-600/70 dark:bg-gray-50/70 rounded-lg size-[25px] ml-2 text-sm flex items-center justify-center font-semibold text-[rgba(35,56,118)]">
            {wallet?.balances?.length || 0}
          </div>
        </div>
        {/* <div className="w-full h-auto flex flex-row items-center ml-2 gap-1">
        <h4 className="font-normal text-sm dark:text-white/90 text-gray-800">
          {wallet.account?.slice(0, 6) +
            '...' +
            wallet.account?.slice(
              wallet.account?.length - 4,
              wallet.account?.length
            )}
        </h4>{' '}
        <span className="size-[20px] cursor-pointer overflow-hidden">
          <FaRegCopy size="100%" />
        </span>
      </div> */}
        <div className="w-full flex flex-col items-start px-3">
          <h4 className="font-light text-base dark:text-white/80 text-gray-900 ">
            Total Value
          </h4>
          <h4 className="font-normal text-base dark:text-white/90 text-gray-800 ">
            $ {total_balance?.toLocaleString() || 'N/A'}
          </h4>
        </div>
        <div className="w-full min-h-[12rem] flex flex-col p-3">
          {total_balance ? (
            <div> </div>
          ) : (
            <div className="my-auto w-full h-auto flex flex-col items-center text-gray-800/80 dark:text-gray-500/40 text-center">
              <span className="size-[40px]  overflow-hidden">
                <IoFileTrayFull size="100%" />
              </span>
              <p className="text-sm">No Tokens Found</p>
              <p className="text-xs">
                Make sure your wallet has tokens with value
              </p>
            </div>
          )}
        </div>
      </div>
      <ConnectedWalletModal
        wallet={wallet}
        onClose={() => {
          setIsModalOpen(false);
        }}
        isOpen={isModalOpen}
      />
    </>
  );
};

export default WalletCard;
