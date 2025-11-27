import classnames from 'classnames';
import { useState } from 'react';
import { IoEllipsisVertical, IoFileTrayFull } from 'react-icons/io5';

import type { Wallet } from '../constants/chains';
import ConnectedWalletModal from './ConnectedWalletModal';

const WalletCard = ({ wallet }: { wallet: Wallet }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const total_balance = wallet.balances?.reduce((acc, item) => {
    return acc + Number(item.balance_formatted) * item.usd_price!;
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
            {total_balance?.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            }) || 'N/A'}
          </h4>
        </div>
        <div className="w-full min-h-[12rem] flex flex-col p-3">
          {total_balance ? (
            <div className="flex flex-col w-full ">
              {wallet.balances?.map((item) => (
                <div
                  key={item.token_address}
                  className="flex items-center py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-[#1A2537] transition-colors"
                >
                  <img
                    src={item.logo!}
                    alt={item.name}
                    className="size-[30px] mr-2"
                  />
                  <div className="flex flex-col items-start ml-2">
                    <span className="text-base font-medium">{item.name}</span>
                    <span className="text-sm font-light">
                      {Number(item.balance_formatted).toLocaleString('en-US', {
                        maximumFractionDigits: 3,
                        minimumFractionDigits: 3,
                      })}{' '}
                      {item.symbol}
                      <span
                        className={
                          'ml-2 text-xs font-medium ' +
                          classnames({
                            'text-green-500':
                              item.usd_price_24hr_percent_change! > 0,
                            'text-red-400':
                              item.usd_price_24hr_percent_change! < 0,
                          })
                        }
                      >
                        {Number(
                          item.usd_price_24hr_percent_change
                        ).toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}
                        %
                      </span>
                    </span>
                    <span className="text-sm font-medium">
                      {(
                        Number(item.balance_formatted) * item.usd_price!
                      ).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                      <span
                        className={
                          'ml-2 text-xs font-medium ' +
                          classnames({
                            'text-green-500':
                              item.usd_price_24hr_percent_change! > 0,
                            'text-red-400':
                              item.usd_price_24hr_percent_change! < 0,
                          })
                        }
                      >
                        {Number(item.usd_value_24hr_usd_change).toLocaleString(
                          'en-US',
                          {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                            style: 'currency',
                            currency: 'USD',
                          }
                        )}{' '}
                        {`(${Number(
                          item.usd_price_24hr_percent_change!
                        ).toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}%)`}
                      </span>
                    </span>
                  </div>
                  <div className=" size-[20px] flex overflow-hidden cursor-pointer ml-auto">
                    <IoEllipsisVertical size="100%" />
                  </div>
                </div>
              ))}
            </div>
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
