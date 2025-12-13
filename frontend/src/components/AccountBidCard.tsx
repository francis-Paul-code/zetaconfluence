/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { NetworkIcon, TokenIcon } from '@web3icons/react/dynamic';
import React, { useMemo, useState } from 'react';
import { FaCheckCircle, FaClock, FaEye } from 'react-icons/fa';

import { type Bid, BidStatus, type LoanRequest } from '../constants/loans';
import { useWallet } from '../hooks/useWallet';
import FundingBidModal from './FundingBidModal';

const AccountBidCard = ({
  bid,
}: {
  bid: Bid & { loanRequest: Omit<LoanRequest, 'bids'> };
}) => {
  const { supportedAssets, decimals } = useWallet();

  const { principal, collateral } = useMemo(() => {
    const p = Object.values(supportedAssets).find(
      (i) => i.address === bid?.loanRequest.principalAsset
    );
    const c = Object.values(supportedAssets).find(
      (i) => i.address === bid.loanRequest?.collateralAsset
    );

    return {
      principal: p,
      collateral: c,
    };
  }, [bid.loanRequest, supportedAssets]);

  const _decimals = useMemo(() => {
    if (!collateral || !principal) return { principal: NaN, collateral: NaN };
    return decimals({ collateral, principal });
  }, [collateral, principal, decimals]);

  const [showBidModal, setShowBidModal] = useState(false);

  const getStatusColor = (status: BidStatus) => {
    switch (status) {
      case BidStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case BidStatus.ACCEPTED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case BidStatus.WITHDRAWN:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case BidStatus.REJECTED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case BidStatus.EXPIRED:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleViewDetails = () => {
    setShowBidModal(true);
  };

  return (
    <div className="bg-white dark:bg-background_dark-tint rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-auto w-auto mr-2 relative">
              <div className="size-[45px] rounded-full overflow-hidden">
                {principal && (
                  <TokenIcon
                    symbol={(principal?.symbol === 'WETH'
                      ? 'ETH'
                      : principal?.symbol!
                    ).toLocaleLowerCase()}
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
                {collateral &&
                  principal &&
                  (
                    Number(bid.loanRequest?.principalAmount) /
                    _decimals.principal
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
              </span>
              <span className="text-sm font-light text-gray-800 dark:text-gray-200">
                {principal?.name}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {bid.loanRequest.borrower.slice(0, 6) +
              '....' +
              bid.loanRequest.borrower.slice(-4)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Placed {new Date(Number(bid?.createdAt)).toLocaleDateString()}
            {/* {bid.acceptedAt &&
              ` • Accepted ${new Date(bid.acceptedAt).toLocaleDateString()}`}
            {bid.rejectedAt &&
              ` • Rejected ${new Date(bid.rejectedAt).toLocaleDateString()}`} */}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
            bid.status
          )}`}
        >
          {bid.status}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Interest Rate
          </div>
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {bid.interestRate}%
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Loan Total
          </div>
          <div className="w-auto h-auto flex flex-col items-start">
            <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
              {(
                Number(bid.loanRequest?.principalAmount) / _decimals.principal
              ).toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </span>
            <div className="flex items-center mt-1">
              <div className="size-fit relative mr-2">
                <div className="size-[30px] rounded-full overflow-hidden">
                  {principal && (
                    <TokenIcon
                      symbol={
                        (principal?.symbol === 'WETH'
                          ? 'ETH'
                          : principal?.symbol)!.toLocaleLowerCase()!
                      }
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
              <div className="h-auto w-auto flex flex-col items-start">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  {principal?.name}
                </span>
                <span className="text-xs font-light text-gray-800 dark:text-gray-200">
                  {principal?.network}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Collateral Asset
          </div>
          <div className="w-auto h-auto flex flex-col items-start">
            <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
              {(
                Number(bid.loanRequest?.collateralAmount) / _decimals.collateral
              ).toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </span>
            <div className="flex items-center mt-1">
              <div className="size-fit relative mr-2">
                <div className="size-[30px] rounded-full overflow-hidden">
                  {collateral && (
                    <TokenIcon
                      symbol={
                        (collateral?.symbol === 'WETH'
                          ? 'ETH'
                          : collateral?.symbol)!.toLocaleLowerCase()!
                      }
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
            Your Share
          </div>
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {(
              Number(bid.amount / bid.loanRequest?.principalAmount) * 100
            ).toFixed(1)}
            %
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-4">
          {bid.loanRequest.loanDuration && (
            <div className="flex items-center gap-1">
              <FaClock />
              <span>
                Duration:{' '}
                {new Date(
                  Number(bid.loanRequest.loanDuration)
                ).toLocaleDateString()}
              </span>
            </div>
          )}
          {bid.status === BidStatus.ACCEPTED && (
            <div className="flex items-center gap-1 text-green-600">
              <FaCheckCircle />
              <span>Filled</span>
              <span>
                {(
                  Number(bid.amountFilled) / _decimals.principal
                ).toLocaleString('en-US', { minimumFractionDigits: 3 })}{' '}
                {principal?.symbol}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleViewDetails}
          className="text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <FaEye />
          View Details
        </button>
      </div>

      {/* Funding Bid Details Modal */}
      {showBidModal && (
        <FundingBidModal
          bid={bid}
          open={showBidModal}
          onClose={() => setShowBidModal(false)}
        />
      )}
    </div>
  );
};

export default AccountBidCard;
