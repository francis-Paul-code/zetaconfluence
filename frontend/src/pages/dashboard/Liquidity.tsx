import React from 'react';
import { FaWallet } from 'react-icons/fa6';
import { IoFileTrayFull } from 'react-icons/io5';

import WalletCard from '../../components/WalletCard';
import { protocolConfig } from '../../constants/protocols';
import { useWallet } from '../../hooks/useWallet';

const Liquidity = () => {
  const { wallets } = useWallet();
  const total_balance = wallets.reduce((acc, wallet) => {
    const wallet_balance = wallet.balances?.reduce((acc, item) => {
      return acc + Number(item.balance_formatted) * item.usd_price!;
    }, 0);
    return acc + (wallet_balance || 0);
  }, 0);
  return (
    <div className="w-full h-full overflow-hidden bg-gray-50 rounded-2xl dark:bg-background_dark p-3 ">
      <div className="w-full h-full overflow-y-scroll">
        {/* information center  */}
        <div className="w-full h-auto">
          <div className=" w-fit min-w-[300px] h-auto px-4 flex flex-col items-start p-4 bg-white dark:bg-gray-800 rounded-lg">
            <h4 className="flex items-center text-sm font-normal text-gray-800 dark:text-white mb-4">
              <span className=" size-[20px] mr-2 inline-flex items-center justify-center text-gray-500/60 dark:text-gray-400/60">
                <FaWallet size="100%" />
              </span>
              Total Balance
            </h4>
            <p className="text-gray-600 dark:text-gray-300 text-xl font-semibold ps-[25px]">
              {total_balance.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}
            </p>
          </div>
        </div>
        {/* connected wallets balances with actions  */}
        <div className="mt-4 w-full h-auto flex flex-col items-start gap-2">
          {wallets.length > 0 &&
            wallets.map((wallet, index) => {
              return (
                <div
                  key={index}
                  className="grid grid-cols-10 grid-flow-row-dense gap-2 w-full py-2 overflow-x-hidden "
                >
                  <div className="size-auto col-span-3">
                    <WalletCard wallet={wallet} />
                  </div>

                  <div className="h-fit w-auto flex-1 flex flex-nowrap items-center gap-2 overflow-x-auto col-span-7">
                    {Object.entries(protocolConfig).map(([key, item]) => {
                      const total_balance = 0; // Replace with actual logic to calculate total balance for the protocol
                      return (
                        <div
                          className="h-auto min-w-[250px] rounded-xl dark:bg-[#01473733] flex-shrink-0 px-3 py-4"
                          key={key}
                        >
                          <div className="w-full flex h-auto items-center ">
                            <img
                              src={item.icon}
                              alt={key}
                              className="size-[30px] object-cover rounded-xl"
                            />
                            <h2 className="text-sm font-medium text-gray-800 dark:text-white ml-2">
                              {key.toLocaleString()}
                            </h2>
                          </div>
                          <div className="w-full flex flex-col items-start mt-3">
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
                          <div className="w-full h-auto my-[30px] flex flex-col items-center text-gray-800/80 dark:text-gray-500/40 text-center">
                            <span className="size-[40px]  overflow-hidden">
                              <IoFileTrayFull size="100%" />
                            </span>
                            <p className="text-sm">No Positions Found</p>
                            <p className="text-xs">
                              You do not have any positions in this protocol.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Liquidity;
