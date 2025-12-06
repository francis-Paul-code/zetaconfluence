import { NetworkIcon, TokenIcon } from '@web3icons/react/dynamic';
import { useMemo, useState } from 'react';
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaMoneyBillWave,
} from 'react-icons/fa';
import { IoCopy } from 'react-icons/io5';

import type { Loan } from '../constants/loans';
import { LoanStatus } from '../constants/loans';
import { useWallet } from '../hooks/useWallet';
import { Button } from './Button';
import { Modal } from './Modal';

const LoanModal = ({
  loan,
  open,
  onClose,
}: {
  loan: Loan;
  open: boolean;
  onClose: () => void;
}) => {
  const { decimals, supportedAssets, wallets } = useWallet();
  const [repaymentAmount, setRepaymentAmount] = useState<string>('');

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
  }, [loan, wallets]);

  const _decimals = useMemo(() => {
    if (!collateral || !principal) return { collateral: NaN, principal: NaN };
    return decimals({ collateral, principal });
  }, [collateral, decimals, principal]);

  const loanDetails = useMemo(() => {
    const principalNum = Number(loan?.principalAmount) / _decimals.principal;
    const interestAmount = (principalNum * loan?.interestRate) / 100;
    const totalOwed = principalNum + interestAmount;
    const totalRepaidNum = Number(loan?.totalRepaid) / _decimals.principal;
    const remainingAmount = Math.max(totalOwed - totalRepaidNum, 0);
    const repaymentProgress = (totalRepaidNum / totalOwed) * 100;

    return {
      principalAmount: principalNum,
      interestAmount,
      totalOwed,
      totalRepaid: totalRepaidNum,
      remainingAmount,
      repaymentProgress,
    };
  }, [loan, _decimals.principal]);

  const timeRemaining = useMemo(() => {
    const deadline = Number(loan?.repaymentDeadline) * 1000;
    const now = Date.now();
    const diff = deadline - now;

    if (diff <= 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return `${days}d ${hours}h`;
  }, [loan?.repaymentDeadline]);

  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.ACTIVE:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case LoanStatus.COMPLETED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case LoanStatus.LIQUIDATED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case LoanStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleRepayment = () => {
    // Implement repayment logic
    console.log('Repaying:', repaymentAmount);
  };

  const handleFullRepayment = () => {
    setRepaymentAmount(loanDetails.remainingAmount.toString());
  };

  const handleViewLoanRequest = () => {
    // Navigate to loan request details
    console.log('View loan request:', loan.loanRequestID);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={'Loan Details'}
      className="border-0 min-w-[65dvw] h-[75dvh] flex flex-col"
    >
      <div className="w-full h-auto flex-1 overflow-hidden">
        <div className="w-full h-full overflow-y-scroll px-2">
          {/* Status Banner */}
          {loan.status === LoanStatus.ACTIVE &&
            Number(loan.repaymentDeadline) * 1000 < Date.now() && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3">
                <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-xl" />
                <div>
                  <div className="font-semibold text-red-800 dark:text-red-300">
                    Loan Overdue
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">
                    This loan has passed its repayment deadline. Collateral may
                    be at risk of liquidation.
                  </div>
                </div>
              </div>
            )}

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
                      {loanDetails.principalAmount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <div className="flex items-center mt-1">
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
                              symbol={principal.symbol.toLowerCase()}
                              variant="background"
                              size="65"
                              className="size-full"
                            />
                          )}
                        </div>
                        <div className="absolute size-[15px] z-1 rounded-full overflow-hidden bottom-0 right-0">
                          <NetworkIcon
                            className="size-full"
                            id={principal?.network || 'ethereum'}
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
                  <span className="font-medium">{loan?.interestRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Interest Amount
                  </span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    {loanDetails.interestAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    {principal?.symbol}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-600 dark:text-gray-400 font-semibold">
                    Total Owed
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {loanDetails.totalOwed.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    {principal?.symbol}
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
                      className="size-[15px] dark:hover:text-gray-100/70 overflow-hidden text-gray-500 dark:text-gray-400 ml-2 cursor-pointer"
                      onClick={() => copyToClipboard(loan.borrower)}
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
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Time Remaining
                  </span>
                  <span
                    className={`font-medium ${
                      timeRemaining === 'Overdue'
                        ? 'text-red-600 dark:text-red-400'
                        : ''
                    }`}
                  >
                    {timeRemaining}
                  </span>
                </div>
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
                            symbol={collateral.symbol.toLowerCase()}
                            variant="background"
                            size="65"
                            className="size-full"
                          />
                        )}
                      </div>
                      <div className="absolute size-[15px] z-1 rounded-full overflow-hidden bottom-0 right-0">
                        <NetworkIcon
                          className="size-full"
                          id={collateral?.network || 'ethereum'}
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
                    Receiving Wallet
                  </span>
                  <p className="font-normal text-sm dark:text-white/90 text-gray-800 flex items-center">
                    {loan.receivingWallet?.slice(0, 6) +
                      '...' +
                      loan.receivingWallet?.slice(-4) || 'N/A'}
                    <span
                      className="size-[15px] dark:hover:text-gray-100/70 overflow-hidden text-gray-500 dark:text-gray-400 ml-2 cursor-pointer"
                      onClick={() => copyToClipboard(loan.receivingWallet)}
                      title="Copy to clipboard"
                    >
                      <IoCopy className="size-full" />
                    </span>
                  </p>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Repayment Deadline
                  </span>
                  <span className="font-medium">
                    {new Date(
                      Number(loan?.repaymentDeadline) * 1000
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Loan Started
                  </span>
                  <span className="font-medium">
                    {new Date(Number(loan?.createdAt) * 1000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Repayment Progress */}
          {loan.status === LoanStatus.ACTIVE && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                Repayment Progress
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>
                    Repaid:{' '}
                    {loanDetails.totalRepaid.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    {principal?.symbol}
                  </span>
                  <span>
                    Remaining:{' '}
                    {loanDetails.remainingAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    {principal?.symbol}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(loanDetails.repaymentProgress, 100)}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {loanDetails.repaymentProgress.toFixed(1)}% repaid
                </div>
              </div>
            </div>
          )}

          {/* Repayment Section */}
          {loan.status === LoanStatus.ACTIVE && isBorrower && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                Make Repayment
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Repayment Amount ({principal?.symbol})
                    </label>
                    <input
                      type="number"
                      value={repaymentAmount}
                      onChange={(e) => setRepaymentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      step="0.01"
                      min="0"
                      max={loanDetails.remainingAmount}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleFullRepayment}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg"
                    >
                      Pay Full Amount
                    </Button>
                    <Button
                      onClick={handleRepayment}
                      disabled={
                        !repaymentAmount || Number(repaymentAmount) <= 0
                      }
                      icon={<FaMoneyBillWave />}
                      className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600"
                    >
                      Make Repayment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completion Message */}
          {loan.status === LoanStatus.COMPLETED && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-center gap-3">
              <FaCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
              <div>
                <div className="font-semibold text-green-800 dark:text-green-300">
                  Loan Completed
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  This loan has been fully repaid. Collateral has been returned
                  to the borrower.
                </div>
              </div>
            </div>
          )}

          {/* Liquidation Message */}
          {loan.status === LoanStatus.LIQUIDATED && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3">
              <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-xl" />
              <div>
                <div className="font-semibold text-red-800 dark:text-red-300">
                  Loan Liquidated
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  This loan was not repaid on time. Collateral has been
                  liquidated to repay lenders.
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <Button
              icon={<FaEye />}
              onClick={handleViewLoanRequest}
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors rounded-lg"
            >
              View Original Loan Request
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LoanModal;