/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import { NetworkIcon, TokenIcon } from '@web3icons/react/dynamic';
import { useMemo, useState } from 'react';
import { FaBullseye, FaEye } from 'react-icons/fa';
import { IoCopy } from 'react-icons/io5';
import { MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';

import {
  type Bid,
  type LoanRequest,
  LoanRequestStatus,
} from '../constants/loans';
import { useWallet } from '../hooks/useWallet';
import BidModal from './BidModal';
import { Button } from './Button';
import { Modal } from './Modal';

type _LoanRequest = Omit<LoanRequest, 'bids' | 'loanID'> & { bids: Bid[] };

const LoanRequestModal = ({
  loan,
  open,
  onClose,
}: {
  loan: _LoanRequest;
  open: boolean;
  onClose: () => void;
}) => {
  const [showBidModal, setShowBidModal] = useState<boolean>(false);
  const { decimals, supportedAssets, wallets } = useWallet();
  const [selectedBids, setSelectedBids] = useState<Bid[]>([]);

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

  const isBorrower = useMemo(() => {
    return wallets.some((i) => i.account === loan?.borrower);
  }, [loan]);

  const _decimals = useMemo(() => {
    if (!collateral || !principal) return { collateral: NaN, principal: NaN };
    return decimals({ collateral, principal });
  }, [collateral, decimals, principal]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const selectedFunding = useMemo(() => {
    let totalFund = 0;
    const bids = [];
    for (let i = 0; i < selectedBids.length; i++) {
      const amount_filled = Math.min(
        Number(selectedBids[i].amount) / _decimals.principal,
        Number(loan.principalAmount) / _decimals.principal - totalFund
      );
      bids.push({
        id: selectedBids[i].id,
        ammountFilled: BigInt(amount_filled),
      });
      totalFund += amount_filled;
    }

    return {
      total: totalFund,
      filledBids: bids,
    };
  }, [_decimals.principal, loan.principalAmount, selectedBids]);

  const fundedAmount = useMemo(() => {
    return loan?.bids?.reduce((acc, item) => {
      return Math.min(
        acc + Number(item.amount) / _decimals.principal,
        Number(loan.principalAmount) / _decimals.principal
      );
    }, 0);
  }, [_decimals.principal, loan?.bids, loan.principalAmount]);

  const sortedBids = useMemo(() => {
    return loan?.bids?.sort((a, b) => {
      if (Number(a.interestRate) > Number(b.interestRate)) return 1;
      if (Number(a.interestRate) < Number(b.interestRate)) return -1;
      return 0;
    });
  }, [loan?.bids]);

  const calculateFundingProgress = useMemo(() => {
    return (
      (fundedAmount / (Number(loan?.principalAmount) / _decimals.principal)) *
      100
    );
  }, [fundedAmount, loan]);

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

  const handleLoanExecution = () => {};
  const handleCancelLoan = () => {};
  const handleViewLoanDetails = () => {};
  return (
    <>
      <Modal
        isOpen={open}
        onClose={onClose}
        title={'Loan Request Details'}
        className=" border-0 min-w-[65dvw] h-[75dvh] flex flex-col"
      >
        <div className="w-full h-auto flex-1 overflow-hidden">
          <div className="w-full h-full overflow-y-scroll px-2">
            {/* Loan Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 relative">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  Loan Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Principal Amount
                    </span>
                    <div className="w-auto h-auto flex flex-col items-end">
                      <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
                        {(
                          Number(loan?.principalAmount) / _decimals.principal
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <div className="flex items-center mt-1">
                        {' '}
                        <div className="h-auto w-auto flex flex-col items-end">
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {principal?.name}
                          </span>
                          <span className="text-xs font-light text-gray-800 dark:text-gray-200">
                            {principal?.network}
                          </span>
                        </div>
                        <div className="size-fit relative ml-2">
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
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Interest Rate
                    </span>
                    <span className="font-medium">
                      {loan?.maxInterestRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Borrower
                    </span>
                    <p className="font-normal text-sm dark:text-white/90 text-gray-800 flex items-center">
                      {loan.borrower?.slice(0, 6) +
                        '...' +
                        loan.borrower?.slice(-4) || 'N/A'}
                      <span
                        className={
                          'size-[15px] dark:hover:text-gray-100/70 overflow-hidden text-gray-500 dark:text-gray-400 ml-2 cursor-pointer '
                        }
                        onClick={() => {}}
                        title="Copy to clipboard"
                      >
                        <IoCopy className="size-full" />
                      </span>
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Loan Duration
                    </span>
                    <span className="font-medium">
                      {(Number(loan?.loanDuration) / 86400).toLocaleString() +
                        ' Days'}
                    </span>
                  </div>
                  {loan.status === LoanRequestStatus.EXECUTED && (
                    <div className="flex justify-between">
                      <Button
                        icon={<FaEye />}
                        onClick={handleViewLoanDetails}
                        className="w-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                      >
                        View Loan
                      </Button>
                    </div>
                  )}
                </div>
                <span
                  className={`absolute right-4 top-4 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    loan.status
                  )}`}
                >
                  {loan.status}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  Collateral Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Collateral Asset
                    </span>
                    <div className="flex items-center mt-1">
                      {' '}
                      <div className="h-auto w-auto flex flex-col items-end">
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {collateral?.name}
                        </span>
                        <span className="text-xs font-light text-gray-800 dark:text-gray-200">
                          {collateral?.network}
                        </span>
                      </div>
                      <div className="size-fit relative ml-2">
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
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Collateral Amount
                    </span>
                    <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
                      {(
                        Number(loan?.collateralAmount) / _decimals.collateral
                      ).toLocaleString('en-US', {
                        minimumFractionDigits: 4,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Collateral Ratio
                    </span>
                    <span className="font-medium text-green-600">125%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Request Expires
                    </span>
                    <span className="font-medium">
                      {new Date(
                        Number(loan?.createdAt + loan?.requestValidDays)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Funding Progress */}
            {(loan?.status === LoanRequestStatus.REQUESTED ||
              loan?.status === LoanRequestStatus.FUNDED) && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                  Funding Progress
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>
                      Funded:{' '}
                      {fundedAmount.toLocaleString('en-US', {
                        minimumFractionDigits: 3,
                      })}{' '}
                      {principal?.symbol}
                    </span>
                    <span>
                      Remaining:{' '}
                      {Math.max(
                        Number(loan?.principalAmount) / _decimals.principal -
                          fundedAmount,
                        0
                      ).toLocaleString('en-US', {
                        minimumFractionDigits: 3,
                      })}{' '}
                      {principal?.symbol}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(calculateFundingProgress, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {calculateFundingProgress.toFixed(1)}% funded
                  </div>
                </div>
              </div>
            )}

            {/* Existing Bids */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                {(loan?.status === LoanRequestStatus.REQUESTED ||
                  loan?.status === LoanRequestStatus.FUNDED) &&
                  'Current '}{' '}
                Bids ({loan?.bids?.length})
              </h4>
              {sortedBids.length > 0 ? (
                <div className="space-y-2">
                  {sortedBids?.map((bid) => {
                    const isSelected = selectedBids.some(
                      (i) => i.id === bid.id
                    );
                    return (
                      <div
                        key={bid.id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex items-center"
                      >
                        {isBorrower && (
                          <label className="flex items-center my-auto mr-2 cursor-pointer">
                            <span className="size-[20px]">
                              {isSelected ? (
                                <MdCheckBox size="100%" />
                              ) : (
                                <MdCheckBoxOutlineBlank size="100%" />
                              )}
                            </span>

                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedBids((prev) => {
                                  if (isSelected)
                                    return prev.filter((i) => i.id !== bid.id);
                                  return [...prev, bid];
                                });
                              }}
                            />
                          </label>
                        )}
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {Number(bid.amount) / _decimals.principal}{' '}
                            {principal?.symbol} at {Number(bid.interestRate)}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            <p className="font-normal text-sm dark:text-white/90 text-gray-800 flex items-center">
                              {bid.lender?.slice(0, 6) +
                                '...' +
                                bid.lender?.slice(-4) || 'N/A'}
                              <span
                                className={
                                  'size-[15px] dark:hover:text-gray-100/70 overflow-hidden text-gray-500 dark:text-gray-400 ml-2 cursor-pointer '
                                }
                                onClick={() => {}}
                                title="Copy to clipboard"
                              >
                                <IoCopy className="size-full" />
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                          {new Date(Number(bid.createdAt)).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {loan?.status === LoanRequestStatus.REQUESTED ||
                  loan?.status === LoanRequestStatus.FUNDED
                    ? ' No bids yet. Be the first to fund this loan!'
                    : 'No bids under this Request'}
                </div>
              )}
            </div>

            {/* Place Bid Section */}
            {(loan?.status === LoanRequestStatus.REQUESTED ||
              loan?.status === LoanRequestStatus.FUNDED) && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center gap-2">
                {!isBorrower && (
                  <Button
                    disabled={calculateFundingProgress === 100}
                    onClick={() => setShowBidModal(true)}
                    icon={<FaBullseye />}
                    className="w-full bg-primary hover:bg-primary/90 rounded-lg dark:disabled:bg-primary/40 disabled:bg-primary/40"
                  >
                    Place Funding Bid
                  </Button>
                )}
                {isBorrower && (
                  <>
                    <Button
                      className={
                        'bg-red-600/20 hover:bg-red-600/30 text-red-500  w-1/2 rounded-xl'
                      }
                      onClick={handleCancelLoan}
                    >
                      Cancel Request
                    </Button>
                    <Button
                      className={
                        'w-auto flex-1 bg-green-600/90 hover:bg-green-600 rounded-xl'
                      }
                      onClick={handleLoanExecution}
                      disabled={Boolean(selectedBids.length)}
                    >
                      Execute Request
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Bid Placement Modal */}
      {showBidModal && (
        <BidModal
          open={showBidModal}
          onClose={() => setShowBidModal(false)}
          loan={loan}
        />
      )}
    </>
  );
};

export default LoanRequestModal;
