/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { NetworkIcon, TokenIcon } from '@web3icons/react/dynamic';
import React, { useMemo, useState } from 'react';
import { FaClock, FaEye, FaWallet } from 'react-icons/fa';

import {
  type Bid,
  type LoanRequest,
  LoanRequestStatus,
} from '../constants/loans';
import { useWallet } from '../hooks/useWallet';
import { Button } from './Button';
import LoanRequestModal from './LoanRequestModal';

const AccountLoanRequestCard = ({
  loan,
}: {
  loan: Omit<LoanRequest, 'bids'> & { bids: Bid[] };
}) => {
  const { decimals } = useWallet();
  const [openLoanRequestDetails, setOpenLoanRequestDetails] =
    useState<boolean>(false);
  const { supportedAssets } = useWallet();

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
  }, [supportedAssets]);

  const _decimals = useMemo(() => {
    if (!collateral || !principal) return { principal: NaN, collateral: NaN };
    return decimals({ collateral, principal });
  }, [collateral, principal, decimals]);

  const fundedAmount = useMemo(() => {
    return loan?.bids?.reduce((acc, item) => {
      return acc + Number(item.amount) / _decimals.principal;
    }, 0);
  }, [loan]);

  const getStatusColor = (status: LoanRequestStatus) => {
    switch (status) {
      case LoanRequestStatus.REQUESTED:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case LoanRequestStatus.EXECUTED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case LoanRequestStatus.FUNDED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case LoanRequestStatus.EXPIRED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-background_dark-tint rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-auto w-auto mr-2 relative">
                <div className="size-[45px] rounded-full overflow-hidden">
                  {principal && (
                    <TokenIcon
                      symbol={principal?.symbol!.toLocaleLowerCase()}
                      variant="background"
                      size="65"
                      className="size-full"
                    />
                  )}
                </div>
                <div className="absolute size-[20px] z-[1] rounded-full overflow-hidden bottom-0 right-0">
                  <NetworkIcon
                    className="size-full"
                    id={principal?.network!}
                    variant="background"
                    size="64"
                  />
                </div>
              </div>
              <div className="h-auto w-auto flex flex-col items-start">
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {(Number(loan?.principalAmount) / _decimals.principal).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm font-light text-gray-800 dark:text-gray-200">
                  {principal?.name}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Created {new Date(Number(loan?.createdAt)).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              loan?.status
            )}`}
          >
            {loan?.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Interest Rate
            </div>
            <div className="font-medium text-gray-800 dark:text-gray-200">
              {loan?.maxInterestRate}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Collateral
            </div>
            <div className="w-auto h-auto flex flex-col items-start">
              <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
                {(Number(loan?.collateralAmount) / _decimals.collateral).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </span>
              <div className="flex items-center mt-1">
                <div className="size-fit relative mr-2">
                  <div className="size-[30px] rounded-full overflow-hidden">
                    {collateral && (
                      <TokenIcon
                        symbol={collateral?.symbol!.toLocaleLowerCase()!}
                        variant="background"
                        size="65"
                        className="size-full"
                      />
                    )}
                  </div>
                  <div className="absolute size-[15px] z-[1] rounded-full overflow-hidden bottom-0 right-0">
                    <NetworkIcon
                      className="size-full"
                      id={collateral?.network!}
                      variant="background"
                      size="64"
                    />
                  </div>
                </div>
                <div className="h-auto w-auto flex flex-col items-start">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {collateral?.name}
                  </span>
                  <span className="text-xs font-light text-gray-800 dark:text-gray-200">
                    {collateral?.network}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Funded
            </div>
            <div className="font-medium text-gray-800 dark:text-gray-200">
              {fundedAmount}/{Number(loan?.principalAmount) / _decimals.principal} {principal?.symbol}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Bids</div>
            <div className="font-medium text-gray-800 dark:text-gray-200">
              {loan?.bids?.length}
            </div>
          </div>
        </div>

        {loan?.status === LoanRequestStatus.REQUESTED && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">
                Funding Progress
              </span>
              <span className="text-gray-800 dark:text-gray-200">
                {((fundedAmount / (Number(loan?.principalAmount)/_decimals.principal)) * 100).toFixed(
                  2
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (fundedAmount / (Number(loan?.principalAmount) / _decimals.principal)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <FaClock />
              <span>
                Expires:{' '}
                {new Date(
                  Number(loan?.createdAt + loan?.requestValidDays)
                ).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FaWallet />
              <span>
                Loan Duration : {Number(loan?.loanDuration) / 86400} Days
              </span>
            </div>
          </div>
          <Button
            icon={<FaEye />}
            onClick={() => setOpenLoanRequestDetails(!openLoanRequestDetails)}
            className="text-primary hover:text-primary/80"
          >
            View Details
          </Button>
        </div>
      </div>

      <LoanRequestModal
        loan={loan}
        open={openLoanRequestDetails}
        onClose={() => setOpenLoanRequestDetails(!openLoanRequestDetails)}
      />
    </>
  );
};

export default AccountLoanRequestCard;
