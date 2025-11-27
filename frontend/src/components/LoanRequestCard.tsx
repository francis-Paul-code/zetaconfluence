/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { NetworkIcon, TokenIcon } from '@web3icons/react/dynamic';
import classNames from 'classnames';
import { useCallback, useMemo, useState } from 'react';
import { FaClock, FaEye } from 'react-icons/fa';
import { IoCopy } from 'react-icons/io5';

import {
  type Bid,
  type LoanRequest,
  LoanRequestStatus,
} from '../constants/loans';
import { useWallet } from '../hooks/useWallet';
import { Button } from './Button';
import LoanRequestModal from './LoanRequestModal';

const LoanRequestCard = ({
  loan,
}: {
  loan: Omit<LoanRequest, 'bids'> & { bids: Bid[] };
}) => {
  const [openLoanRequestDetails, setOpenLoanRequestDetails] =
    useState<boolean>(false);
  const { supportedAssets } = useWallet();
  const [copySuccess, setCopySuccess] = useState(false);
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
  const fundedAmount = useMemo(() => {
    return loan?.bids?.reduce((acc, item) => {
      return acc + Number(item.amount);
    }, 0);
  }, [loan]);

  const calculateFundingProgress = useMemo(() => {
    return (fundedAmount / Number(loan?.principalAmount)) * 100;
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

  const handleCopyToClipboard = useCallback(() => {
    if (loan.id) {
      navigator.clipboard.writeText(loan.borrower);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [loan]);
  return (
    <>
      <LoanRequestModal
        loan={loan}
        open={openLoanRequestDetails}
        onClose={() => setOpenLoanRequestDetails(!openLoanRequestDetails)}
      />
      <div
        key={loan?.id}
        className="w-auto h-auto bg-white dark:bg-background_dark-tint rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
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
                {Number(loan?.principalAmount).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-sm font-light text-gray-800 dark:text-gray-200">
                {principal?.name}
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              loan.status
            )}`}
          >
            {loan?.status}
          </span>
        </div>

        {/* Loan Details */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Interest Rate
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {loan?.maxInterestRate}%
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Collateral
            </span>
            <div className="w-auto h-auto flex flex-col items-end">
              <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
                {Number(loan?.collateralAmount).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
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
                    {principal && (
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
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Borrower
            </span>
            <span className="text-sm flex items-center font-light text-gray-800 dark:text-gray-200">
              {loan.borrower?.slice(0, 6) + '...' + loan.borrower?.slice(-4) ||
                'N/A'}
              <div
                className={
                  'size-[15px] dark:hover:text-gray-100/70 overflow-hidden text-gray-500 dark:text-gray-400 ml-2 cursor-pointer ' +
                  classNames({ '!text-green-300': copySuccess })
                }
                onClick={handleCopyToClipboard}
                title="Copy to clipboard"
              >
                <IoCopy className="size-full" />
              </div>
            </span>
          </div>
        </div>

        {/* Funding Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">
              Funding Progress
            </span>
            <span className="text-gray-800 dark:text-gray-200">
              {fundedAmount}/{Number(loan?.principalAmount)} {principal?.symbol}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(calculateFundingProgress, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex items-center gap-1">
            <FaClock />
            <span>
              Expires:{' '}
              {new Date(
                Number(loan?.createdAt + loan?.requestValidDays)
              ).toLocaleDateString()}
            </span>
          </div>
          {/* <div className="flex items-center gap-1">
                  <FaShieldAlt />
                  <span>
                    Due: {new Date(loan.repaymentDeadline).toLocaleDateString()}
                  </span>
                </div> */}
        </div>

        {/* View Details Button */}
        <Button
          icon={<FaEye />}
          onClick={() => setOpenLoanRequestDetails(!openLoanRequestDetails)}
          className="w-full mt-4 bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
        >
          View Details
        </Button>
      </div>
    </>
  );
};

export default LoanRequestCard;
