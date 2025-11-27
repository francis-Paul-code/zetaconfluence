import React, { useMemo } from 'react';
import {
  FaBullseye,
  FaHandshake,
  FaMoneyBillWave,
  FaUser,
} from 'react-icons/fa';

import AccountBidCard from '../../../components/AccountBidCard';
import AccountLoanCard from '../../../components/AccountLoanCard';
import AccountLoanRequestCard from '../../../components/AccountLoanRequestCard';
import GenericTabs from '../../../components/GenericTabs';
import {
  BidStatus,
  LoanRequestStatus,
  LoanStatus,
} from '../../../constants/loans';
import { dummyAccountData } from './dummy';

const Account = () => {
  const data = useMemo(() => {
    return dummyAccountData;
  }, []);
  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gray-50 rounded-2xl dark:bg-background_dark p-6">
      {/* Header */}
      <div className="w-full h-auto flex items-center mb-6 gap-3">
        <span className="size-[30px] cursor-pointer overflow-hidden text-primary">
          <FaUser size="100%" />
        </span>
        <h2 className="font-semibold text-2xl dark:text-gray-200 text-gray-800">
          My P2P Account
        </h2>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-background_dark-tint rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FaMoneyBillWave className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Requests
              </div>
              <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {
                  data.loanRequests.filter(
                    (r) =>
                      r.status === LoanRequestStatus.REQUESTED ||
                      r.status === LoanRequestStatus.FUNDED
                  ).length
                }
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-background_dark-tint rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <FaHandshake className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Loans
              </div>
              <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {
                  data.activeLoans.filter((l) => l.status === LoanStatus.ACTIVE)
                    .length
                }
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-background_dark-tint rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FaBullseye className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Bids
              </div>
              <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {
                  data.fundingBids.filter((b) => b.status === BidStatus.ACCEPTED)
                    .length
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-auto flex flex-col items-center flex-1 overflow-hidden">
        <GenericTabs
          classNames={{
            tabSection: 'flex-1 h-auto overflow-y-scroll px-2',
            tabButtons: 'h-auto w-full',
            container: 'h-full',
          }}
          tabButtons={[
            {
              name: ` Loan Requests (${data.loanRequests.length})`,
              value: 'requests',
            },
            {
              name: `Active Loans (${data.activeLoans.length})`,
              value: 'loans',
            },
            {
              name: `Funding Bids (${data.fundingBids.length})`,
              value: 'bids',
            },
          ]}
          tabs={{
            requests: (
              <div>
                {data.loanRequests.map((request) => (
                  <div className="w-full h-auto mb-2" key={request.id}>
                    <AccountLoanRequestCard loan={request} />
                  </div>
                ))}
              </div>
            ),
            loans: (
              <div className="space-y-4">
                {data.activeLoans.map((loan) => (
                  <div className="w-full h-auto mb-2" key={loan.id}>
                    <AccountLoanCard loan={loan} />
                  </div>
                ))}
              </div>
            ),
            bids: (
              <div className="space-y-4">
                {data.fundingBids.map((bid) => (
                  <div className="w-full h-auto mb-2" key={bid.id}>
                    <AccountBidCard bid={bid} />
                  </div>
                ))}
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default Account;
