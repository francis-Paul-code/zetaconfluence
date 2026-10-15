/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { NetworkIcon, TokenIcon } from '@web3icons/react/dynamic';
import React, { useMemo, useState } from 'react';
import { FaClock, FaExclamationTriangle, FaEye } from 'react-icons/fa';

import { type Loan, LoanStatus } from '../constants/loans';
import { useWallet } from '../hooks/useWallet';
import { Button } from './Button';
import LoanModal from './LoanModal';

const AccountLoanCard = ({ loan }: { loan: Loan }) => {
  const [openLoanDetails, setOpenLoanDetails] = useState<boolean>(false);
  const { supportedAssets, decimals } = useWallet();
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

  const getStatusColor = (status: LoanStatus) => {
    switch (status) {
      case LoanStatus.CANCELLED:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case LoanStatus.COMPLETED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case LoanStatus.ACTIVE:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case LoanStatus.LIQUIDATED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  const health = useMemo(() => {
    const timeActive = Number(loan?.createdAt) - new Date().getTime();
    // if time active is still under liquidation threshold (35% of loan Duration), then effectiveTime is capped
    const effectiveTime = Math.max(
      timeActive,
      Number(loan?.loanDuration) * 0.35
    );
    const outstandingprincipal =
      Number(loan?.principalAmount - loan?.totalRepaid) / _decimals.principal;
    const interest =
      effectiveTime > timeActive
        ? (Number(loan?.principalAmount) * effectiveTime * loan?.interestRate) /
          (100 * 365 * 86400 * _decimals.principal)
        : (outstandingprincipal * effectiveTime * loan?.interestRate) /
          (100 * 365 * 86400);
    return {
      interest,
      outStanding: outstandingprincipal + interest,
      debtRatio:
        Number(loan?.totalRepaid) /
        ((outstandingprincipal + interest) * _decimals.principal),
    };
  }, [loan]);

  const getHealthRatioColor = (ratio: number) => {
    if (ratio >= 0.6) return 'text-green-600';
    if (ratio >= 0.24) return 'text-yellow-600';
    return 'text-red-600';
  };
  const calculateProgress = (paid: number, total: number) => {
    return (paid / total) * 100;
  };

  return (
    <div
      key={loan.id}
      className="bg-white dark:bg-background_dark-tint rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
    >
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
                {(
                  Number(loan?.principalAmount) / _decimals.principal
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
            Created {new Date(Number(loan?.createdAt)).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loan?.status === LoanStatus.ACTIVE && (
            <span
              className={`text-sm font-medium ${getHealthRatioColor(
                health.debtRatio
              )}`}
            >
              {health.debtRatio.toLocaleString('en-US', { style: 'percent' })}
              Health
            </span>
          )}
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              loan.status
            )}`}
          >
            {loan.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Interest Rate
          </div>
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {loan?.interestRate}%
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total Repayment
          </div>
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {Number(loan.totalRepaid) / _decimals.principal} {principal?.symbol}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Collateral
          </div>
          <div className="w-auto h-auto flex flex-col items-start">
            <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
              {(
                Number(loan?.collateralAmount) / _decimals.collateral
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
            Creditors
          </div>
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {loan.bids.length}
          </div>
        </div>
      </div>

      {loan.status === LoanStatus.ACTIVE && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">
              Repayment Progress
            </span>
            <span className="text-gray-800 dark:text-gray-200">
              {(Number(loan.totalRepaid) / _decimals.principal).toLocaleString(
                'en-US',
                { minimumFractionDigits: 2 }
              )}
              /
              {health.outStanding.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}{' '}
              {principal?.symbol}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  calculateProgress(
                    Number(loan.totalRepaid) / _decimals.principal,
                    Number(loan.principalAmount) / _decimals.principal +
                      health.interest
                  ),
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
              Due:{' '}
              {new Date(Number(loan.repaymentDeadline)).toLocaleDateString()}
            </span>
          </div>
          {loan.status === LoanStatus.ACTIVE && health.debtRatio < 1.08 && (
            <div className="flex items-center gap-1 text-yellow-600">
              <FaExclamationTriangle />
              <span>Low Health Ratio</span>
            </div>
          )}
        </div>

        <Button
          icon={<FaEye />}
          onClick={() => setOpenLoanDetails(!openLoanDetails)}
          className="text-primary hover:text-primary/80"
        >
          View Details
        </Button>
      </div>

      {/* Loan Details Modal */}
      {openLoanDetails && (
        <LoanModal
          loan={loan}
          open={openLoanDetails}
          onClose={() => setOpenLoanDetails(false)}
        />
      )}
    </div>
  );
};

export default AccountLoanCard;
