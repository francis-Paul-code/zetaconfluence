/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { NetworkIcon,TokenIcon } from '@web3icons/react/dynamic';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import { FaWallet } from 'react-icons/fa';
import { IoCopy } from 'react-icons/io5';

import type { Wallet } from '../constants/chains';
import type { Bid, LoanRequest, MetaBid } from '../constants/loans';
import { useWallet } from '../hooks/useWallet';
import { Modal } from './Modal';
import Select from './SelectField';

type _LoanRequest = Omit<LoanRequest, 'bids' | 'loanID'> & { bids: Bid[] };
const BidModal = ({
  loan,
  open,
  onClose,
}: {
  loan: _LoanRequest;
  open: boolean;
  onClose: () => void;
}) => {
  const [bid, setBid] = useState<MetaBid>({} as MetaBid);
  const { decimals, supportedAssets, wallets } = useWallet();
  const [signer, setSigner] = useState<Wallet | null>(wallets[0]);
  const { principal, collateral } = useMemo(() => {
    const p = Object.values(supportedAssets).find(
      (i) => i.address === loan?.principalAsset
    );
    const c = Object.values(supportedAssets).find(
      (i) => i.address === loan?.collateralAsset
    );

    return {
      principal: p,
      collateral: c,
    };
  }, [loan?.collateralAsset, loan?.principalAsset, supportedAssets]);

  const _decimals = useMemo(() => {
    if (!collateral || !principal) return { collateral: NaN, principal: NaN };
    return decimals({ collateral, principal });
  }, [collateral, decimals, principal]);

  const fundedAmount = useMemo(() => {
    return loan?.bids?.reduce((acc, item) => {
      return Math.min(
        acc + Number(item.amount) / _decimals.principal,
        Number(loan.principalAmount) / _decimals.principal
      );
    }, 0);
  }, [_decimals.principal, loan?.bids, loan.principalAmount]);

  const handlePlaceBid = () => {};

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={'Place Bid'}
      className=" border-0 min-w-[63dvw] h-[70dvh] flex flex-col"
    >
      <div className="w-full h-auto flex-1 overflow-hidden">
        <div className="w-full h-full overflow-y-scroll px-3">
          <div className="w-full h-full overflow-y-scroll py-2">
            <div className="w-full h-auto rounded-lg dark:bg-gray-800 bg-gray-200 p-3 mb-3 flex justify-between">
              <div className="w-auto h-auto ">
                <Select
                  options={[
                    { id: 'none', name: 'None' },
                    ...wallets.map((i) => ({
                      icon: i.eip6963?.info?.icon,
                      rdns: i.eip6963?.info?.rdns,
                      name: i.eip6963?.info?.name!,
                      id: i.account!,
                    })),
                  ]}
                  value={signer?.account! || 'none'}
                  onChange={(id) => {
                    const _signer = wallets.find((i) => i.account === id);
                    setSigner(_signer!);
                  }}
                  placeholder="Choose wallet"
                  renderOption={(opt: any) => (
                    <div className="flex items-center w-full h-auto">
                      {opt?.icon && (
                        <span className="size-[20px] flex items-center justify-center">
                          <img
                            className="size-100% object-cover"
                            src={opt?.icon}
                            alt={opt?.rdns}
                          />
                        </span>
                      )}
                      <p className="text-sm text-nowrap text-ellipsis ml-2">
                        {opt?.name}
                      </p>
                    </div>
                  )}
                />
              </div>
              <div className="flex flex-col items-end">
                <p className="font-semibold text-sm dark:text-white/90 text-gray-800 flex items-center">
                  {signer?.account?.slice(0, 6) +
                    '...' +
                    signer?.account?.slice(-4) || 'N/A'}
                </p>
                {signer?.balances?.map((token) => {
                  console.log(token);
                  const asset = Object.values(supportedAssets).find(
                    (i) =>
                      i.address === token.token_address &&
                      i.symbol.toLocaleLowerCase() ===
                        token.symbol.toLocaleLowerCase()
                  );
                  return (
                    <div className="w-full min-w-[300px] h-auto flex justify-between items-center">
                      <div className="flex items-center mt-1 gap-2">
                        <div className="size-fit relative">
                          <div className="size-[30px] rounded-full overflow-hidden">
                            <TokenIcon
                              symbol={token.symbol!.toLocaleLowerCase()!}
                              variant="background"
                              size="65"
                              className="size-full"
                            />
                          </div>
                          {!token.native_token && (
                            <div className="absolute size-[15px] z-[1] rounded-full overflow-hidden bottom-0 right-0">
                              <NetworkIcon
                                className="size-full"
                                id={principal?.network!}
                                variant="background"
                                size="64"
                              />
                            </div>
                          )}
                        </div>
                        <div className="h-auto w-auto flex flex-col items-start gap-1">
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                              {token?.name}
                            </span>
                            <span className="text-xs font-light text-gray-800 dark:text-gray-200 dark:bg-gray-400/30 px-2 py-1 rounded-sm">
                              {asset?.network}
                            </span>
                          </span>
                          <span className="text-xs font-light text-gray-800 dark:text-gray-200">
                            {token?.usd_price?.toLocaleString('en-US', {
                              minimumFractionDigits: 3,
                              currency: 'USD',
                              style: 'currency',
                            })}

                            <span
                              className={
                                'ml-2 font-normal ' +
                                classNames({
                                  'text-red-400':
                                    token?.usd_price_24hr_percent_change! < 0,
                                  'text-green-400':
                                    token?.usd_price_24hr_percent_change! > 0,
                                })
                              }
                            >
                              {token.usd_price_24hr_percent_change?.toLocaleString(
                                'en-US',
                                { maximumFractionDigits: 2 }
                              )}
                              %
                            </span>
                          </span>
                        </div>
                      </div>
                      <h3 className="m-0 p-0 font-semibold text-sm">
                        {(
                          Number(token.balance) /
                          10 ** token.decimals
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 4,
                        })}
                      </h3>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bid Amount
              </label>
              <div className="flex items-center w-full h-auto gap-3">
                <div className="flex items-center mt-1">
                  <div className="size-fit relative mr-2">
                    <div className="size-[30px] rounded-full overflow-hidden">
                      {principal && (
                        <TokenIcon
                          symbol={principal?.symbol!.toLocaleLowerCase()!}
                          variant="background"
                          size="65"
                          className="size-full"
                        />
                      )}
                    </div>
                    <div className="absolute size-[15px] z-[1] rounded-full overflow-hidden bottom-0 right-0">
                      <NetworkIcon
                        className="size-full"
                        id={principal?.network!}
                        variant="background"
                        size="64"
                      />
                    </div>
                  </div>
                  <div className="h-auto w-auto flex flex-col items-end">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {principal?.name}
                    </span>
                    <span className="text-xs font-light text-gray-800 dark:text-gray-200">
                      {principal?.network}
                    </span>
                  </div>
                </div>
                <input
                  type="number"
                  value={Number(bid.amount) || 0}
                  onChange={(e) =>
                    setBid((b) => {
                      return { ...b, amount: BigInt(e.target.value) };
                    })
                  }
                  placeholder="0.00"
                  step="0.01"
                  max={
                    Number(loan?.principalAmount) / _decimals.principal -
                    fundedAmount
                  }
                  className="w-auto flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Remaining:{' '}
                {Number(loan?.principalAmount) / _decimals.principal -
                  fundedAmount}{' '}
                {principal?.symbol}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interest Rate (%)
              </label>
              <input
                type="number"
                value={Number(bid.interestRate)}
                onChange={(e) =>
                  setBid((b) => {
                    return { ...b, interestRate: Number(e.target.value) };
                  })
                }
                placeholder="0.0"
                step="0.1"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Borrower's rate: {loan?.maxInterestRate}%
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => onClose()}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePlaceBid}
              disabled={!bid.amount || !bid.interestRate || !signer}
              className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FaWallet />
              Place Bid
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BidModal;
