import { NetworkIcon, TokenIcon } from '@web3icons/react/dynamic';
import { useMemo } from 'react';
import {
  FaBan,
  FaCheckCircle,
  FaClock,
  FaCoins,
  FaEye,
  FaTimesCircle,
} from 'react-icons/fa';
import { IoCopy } from 'react-icons/io5';

import type { Bid } from '../constants/loans';
import { BidStatus } from '../constants/loans';
import { useWallet } from '../hooks/useWallet';
import { Button } from './Button';
import { Modal } from './Modal';

const FundingBidModal = ({
  bid,
  open,
  onClose,
}: {
  bid: Bid;
  open: boolean;
  onClose: () => void;
}) => {
  const { decimals, supportedAssets, wallets } = useWallet();

  const fundingAsset = useMemo(() => {
    return Object.values(supportedAssets).find(
      (i) => i.address === bid?.fundingAsset
    );
  }, [bid?.fundingAsset, supportedAssets]);

  const isLender = useMemo(() => {
    return wallets.some((i) => i.account === bid?.lender);
  }, [bid, wallets]);

  const _decimals = useMemo(() => {
    if (!fundingAsset) return { principal: NaN };
    const result = decimals({ principal: fundingAsset, collateral: fundingAsset });
    return typeof result === 'number' ? { principal: result } : result;
  }, [fundingAsset, decimals]);

  const bidDetails = useMemo(() => {
    const amountNum = Number(bid?.amount) / _decimals.principal;
    const filledNum = Number(bid?.amountFilled) / _decimals.principal;
    const remainingNum = amountNum - filledNum;
    const fillPercentage = (filledNum / amountNum) * 100;

    return {
      amount: amountNum,
      amountFilled: filledNum,
      remaining: remainingNum,
      fillPercentage,
    };
  }, [bid, _decimals.principal]);

  const getStatusColor = (status: BidStatus) => {
    switch (status) {
      case BidStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case BidStatus.ACCEPTED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case BidStatus.REJECTED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case BidStatus.EXPIRED:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case BidStatus.WITHDRAWN:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: BidStatus) => {
    switch (status) {
      case BidStatus.PENDING:
        return <FaClock className="text-yellow-600 dark:text-yellow-400" />;
      case BidStatus.ACCEPTED:
        return (
          <FaCheckCircle className="text-green-600 dark:text-green-400" />
        );
      case BidStatus.REJECTED:
        return <FaTimesCircle className="text-red-600 dark:text-red-400" />;
      case BidStatus.EXPIRED:
        return <FaBan className="text-gray-600 dark:text-gray-400" />;
      case BidStatus.WITHDRAWN:
        return <FaBan className="text-orange-600 dark:text-orange-400" />;
      default:
        return null;
    }
  };

  const handleWithdrawBid = () => {
    // Implement bid withdrawal logic
    console.log('Withdrawing bid:', bid.id);
  };

  const handleViewLoanRequest = () => {
    // Navigate to loan request details
    console.log('View loan request:', bid.loanRequestId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={'Funding Bid Details'}
      className="border-0 min-w-[65dvw] h-[75dvh] flex flex-col"
    >
      <div className="w-full h-auto flex-1 overflow-hidden">
        <div className="w-full h-full overflow-y-scroll px-2">
          {/* Status Banner */}
          {bid.status === BidStatus.ACCEPTED && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-center gap-3">
              <FaCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
              <div>
                <div className="font-semibold text-green-800 dark:text-green-300">
                  Bid Accepted
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  Your bid has been accepted and the loan has been executed.
                  You're now earning interest!
                </div>
              </div>
            </div>
          )}

          {bid.status === BidStatus.REJECTED && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3">
              <FaTimesCircle className="text-red-600 dark:text-red-400 text-xl" />
              <div>
                <div className="font-semibold text-red-800 dark:text-red-300">
                  Bid Rejected
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  This bid was not selected by the borrower. Your funds are
                  available for withdrawal.
                </div>
              </div>
            </div>
          )}

          {bid.status === BidStatus.EXPIRED && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 flex items-center gap-3">
              <FaBan className="text-gray-600 dark:text-gray-400 text-xl" />
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-300">
                  Bid Expired
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  This bid has expired. Your funds are available for
                  withdrawal.
                </div>
              </div>
            </div>
          )}

          {bid.status === BidStatus.WITHDRAWN && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6 flex items-center gap-3">
              <FaBan className="text-orange-600 dark:text-orange-400 text-xl" />
              <div>
                <div className="font-semibold text-orange-800 dark:text-orange-300">
                  Bid Withdrawn
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  You have withdrawn this bid. Your funds have been returned.
                </div>
              </div>
            </div>
          )}

          {/* Bid Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 relative">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                Bid Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Bid Amount
                  </span>
                  <div className="w-auto h-auto flex flex-col items-end">
                    <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
                      {bidDetails.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <div className="flex items-center mt-1">
                      <div className="h-auto w-auto flex flex-col items-end">
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {fundingAsset?.name}
                        </span>
                        <span className="text-xs font-light text-gray-800 dark:text-gray-200">
                          {fundingAsset?.network}
                        </span>
                      </div>
                      <div className="size-fit relative ml-2">
                        <div className="size-[30px] rounded-full overflow-hidden">
                          {fundingAsset && (
                            <TokenIcon
                              symbol={fundingAsset.symbol.toLowerCase()}
                              variant="background"
                              size="65"
                              className="size-full"
                            />
                          )}
                        </div>
                        <div className="absolute size-[15px] z-1 rounded-full overflow-hidden bottom-0 right-0">
                          <NetworkIcon
                            className="size-full"
                            id={fundingAsset?.network || 'ethereum'}
                            variant="background"
                            size="64"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Interest Rate
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {bid?.interestRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Expected Return
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {(
                      bidDetails.amount *
                      (1 + bid?.interestRate / 100)
                    ).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    {fundingAsset?.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Lender
                  </span>
                  <p className="font-normal text-sm dark:text-white/90 text-gray-800 flex items-center">
                    {bid.lender?.slice(0, 6) + '...' + bid.lender?.slice(-4) ||
                      'N/A'}
                    <span
                      className="size-[15px] dark:hover:text-gray-100/70 overflow-hidden text-gray-500 dark:text-gray-400 ml-2 cursor-pointer"
                      onClick={() => copyToClipboard(bid.lender)}
                      title="Copy to clipboard"
                    >
                      <IoCopy className="size-full" />
                    </span>
                  </p>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Bid Placed
                  </span>
                  <span className="font-medium">
                    {new Date(Number(bid?.createdAt) * 1000).toLocaleString()}
                  </span>
                </div>
                {bid.requiresSwap && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Requires Swap
                    </span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      Yes
                    </span>
                  </div>
                )}
              </div>
              <span
                className={`absolute right-4 top-4 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                  bid.status
                )}`}
              >
                {getStatusIcon(bid.status)}
                {bid.status}
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                Funding Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Amount Filled
                  </span>
                  <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
                    {bidDetails.amountFilled.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    {fundingAsset?.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Remaining
                  </span>
                  <span className="font-medium">
                    {bidDetails.remaining.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    {fundingAsset?.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Gas Deducted
                  </span>
                  <span className="font-medium">
                    {(Number(bid?.gasDeducted) / _decimals.principal).toFixed(
                      6
                    )}{' '}
                    {fundingAsset?.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Loan Request ID
                  </span>
                  <span className="font-medium">#{bid?.loanRequestId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fill Progress */}
          {bid.status === BidStatus.ACCEPTED &&
            bidDetails.fillPercentage < 100 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  Fill Progress
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>
                      Filled:{' '}
                      {bidDetails.amountFilled.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      {fundingAsset?.symbol}
                    </span>
                    <span>
                      Remaining:{' '}
                      {bidDetails.remaining.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      {fundingAsset?.symbol}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(bidDetails.fillPercentage, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {bidDetails.fillPercentage.toFixed(1)}% filled
                  </div>
                </div>
              </div>
            )}

          {/* Expected Returns */}
          {bid.status === BidStatus.ACCEPTED && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                Expected Returns
              </h4>
              <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <FaCoins className="text-green-600 dark:text-green-400 text-xl" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Expected Return
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {(
                        bidDetails.amountFilled *
                        (1 + bid?.interestRate / 100)
                      ).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      {fundingAsset?.symbol}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Principal
                    </div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                      {bidDetails.amountFilled.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      {fundingAsset?.symbol}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Interest Earned
                    </div>
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      +
                      {(
                        bidDetails.amountFilled *
                        (bid?.interestRate / 100)
                      ).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      {fundingAsset?.symbol}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            <Button
              icon={<FaEye />}
              onClick={handleViewLoanRequest}
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors rounded-lg"
            >
              View Loan Request
            </Button>

            {isLender &&
              bid.status === BidStatus.PENDING &&
              bidDetails.remaining > 0 && (
                <Button
                  icon={<FaBan />}
                  onClick={handleWithdrawBid}
                  className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-600 dark:text-red-400 transition-colors rounded-lg"
                >
                  Withdraw Bid
                </Button>
              )}

            {isLender &&
              (bid.status === BidStatus.REJECTED ||
                bid.status === BidStatus.EXPIRED) && (
                <Button
                  icon={<FaCoins />}
                  onClick={handleWithdrawBid}
                  className="w-full bg-green-600 hover:bg-green-700 rounded-lg"
                >
                  Withdraw Funds
                </Button>
              )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FundingBidModal;