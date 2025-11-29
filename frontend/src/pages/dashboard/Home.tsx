import React, { useMemo } from 'react';
import {
  FaArrowRight,
  FaBullseye,
  FaChartLine,
  FaHandshake,
  FaHome,
  FaMoneyBillWave,
  FaWallet,
} from 'react-icons/fa';
import { VscLoading } from 'react-icons/vsc';
import { useNavigate } from 'react-router';

import ProviderCard from '../../components/ProviderCard';
import WalletCard from '../../components/WalletCard';
import {
  BidStatus,
  LoanRequestStatus,
  LoanStatus,
} from '../../constants/loans';
import { useWallet } from '../../hooks/useWallet';
import { dummyAccountData } from '../dashboard/p2pmarket/dummy';

const Home = () => {
  const navigate = useNavigate();
  const { selectedProviders, wallets, configuringWalletState, providers } =
    useWallet();

  const available_providers = useMemo(() => {
    return providers.filter((i) => !selectedProviders[i.info?.rdns]);
  }, [selectedProviders, providers]);

  const total_balance = useMemo(() => {
    return wallets.reduce((acc, wallet) => {
      const wallet_balance = wallet.balances?.reduce((acc, item) => {
        return acc + Number(item.balance_formatted) * item.usd_price!;
      }, 0);
      return acc + (wallet_balance || 0);
    }, 0);
  }, [wallets]);

  const p2pStats = useMemo(() => {
    const data = dummyAccountData;
    return {
      activeRequests: data.loanRequests.filter(
        (r) =>
          r.status === LoanRequestStatus.REQUESTED ||
          r.status === LoanRequestStatus.FUNDED
      ).length,
      activeLoans: data.activeLoans.filter((l) => l.status === LoanStatus.ACTIVE)
        .length,
      activeBids: data.fundingBids.filter((b) => b.status === BidStatus.ACCEPTED)
        .length,
      totalRequests: data.loanRequests.length,
      totalLoans: data.activeLoans.length,
      totalBids: data.fundingBids.length,
    };
  }, []);

  return (
    <div className="w-full h-full overflow-hidden bg-gray-50 rounded-2xl dark:bg-background_dark p-2 ">
      <div className="w-full h-full overflow-y-scroll p-6">
        {/* Header */}
        <div className="w-full h-auto flex items-center mb-6 gap-3">
          <span className="size-[35px] cursor-pointer overflow-hidden text-primary">
            <FaHome size="100%" />
          </span>
          <div>
            <h2 className="font-semibold text-2xl dark:text-gray-200 text-gray-800">
              Dashboard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Welcome back! Here's your overview
            </p>
          </div>
        </div>

        {/* Wallet Overview Section */}
        <div className="w-full h-auto mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Balance Card */}
            <div className="bg-linear-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl p-6 border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="flex items-center text-sm font-medium text-gray-800 dark:text-white">
                  <span className="size-[24px] mr-2 inline-flex items-center justify-center text-primary">
                    <FaWallet size="100%" />
                  </span>
                  Total Wallet Balance
                </h4>
                <button
                  onClick={() => navigate('/dashboard/liquidity')}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  View Details <FaArrowRight size={10} />
                </button>
              </div>
              <p className="text-gray-800 dark:text-gray-200 text-3xl font-bold ps-[30px]">
                {total_balance.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                })}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 ps-[30px]">
                Across {wallets.length} connected wallet{wallets.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* P2P Market Overview Card */}
            <div className="bg-linear-to-br from-green-500/10 to-green-500/5 dark:from-green-500/20 dark:to-green-500/10 rounded-xl p-6 border border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="flex items-center text-sm font-medium text-gray-800 dark:text-white">
                  <span className="size-[24px] mr-2 inline-flex items-center justify-center text-green-600 dark:text-green-400">
                    <FaChartLine size="100%" />
                  </span>
                  P2P Market Activity
                </h4>
                <button
                  onClick={() => navigate('/dashboard/p2p/account')}
                  className="text-xs text-green-600 dark:text-green-400 hover:opacity-80 flex items-center gap-1"
                >
                  View Account <FaArrowRight size={10} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 ps-[30px]">
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {p2pStats.activeRequests}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Active Requests
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {p2pStats.activeLoans}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Active Loans
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {p2pStats.activeBids}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Active Bids
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* P2P Market Stats Cards */}
        <div className="w-full h-auto mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg dark:text-gray-200 text-gray-800">
              P2P Market Overview
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/dashboard/p2p/account')}
              className="bg-white dark:bg-background_dark-tint rounded-xl p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FaMoneyBillWave className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Loan Requests
                  </div>
                  <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    {p2pStats.totalRequests}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {p2pStats.activeRequests} active
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate('/dashboard/p2p/account')}
              className="bg-white dark:bg-background_dark-tint rounded-xl p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FaHandshake className="text-green-600 dark:text-green-400 text-xl" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Your Loans
                  </div>
                  <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    {p2pStats.totalLoans}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {p2pStats.activeLoans} active
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate('/dashboard/p2p/account')}
              className="bg-white dark:bg-background_dark-tint rounded-xl p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FaBullseye className="text-purple-600 dark:text-purple-400 text-xl" />
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Funding Bids
                  </div>
                  <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                    {p2pStats.totalBids}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {p2pStats.activeBids} accepted
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallets Section */}
        {configuringWalletState ? (
          <div className="w-full h-[200px] flex items-center justify-center">
            <span className="size-[30px] flex items-center dark:text-gray-400/80 text-gray-700/80 animate-spin">
              <VscLoading size="100%" />
            </span>
          </div>
        ) : (
          <>
            {/* Connected Wallets */}
            {wallets.length > 0 && (
              <div className="w-full h-auto mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="size-[20px] cursor-pointer overflow-hidden dark:text-gray-500/50 text-gray-700/70">
                      <FaWallet size="100%" />
                    </span>
                    <h3 className="font-semibold text-lg dark:text-gray-200 text-gray-800">
                      Connected Wallets
                    </h3>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard/wallets')}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    Manage Wallets <FaArrowRight size={12} />
                  </button>
                </div>
                <div className="w-full h-auto grid grid-cols-2 md:grid-cols-4 gap-3">
                  {wallets.slice(0, 4).map((item, index) => (
                    <div key={index} className="w-auto h-auto flex items-center">
                      <WalletCard wallet={item} />
                    </div>
                  ))}
                </div>
                {wallets.length > 4 && (
                  <div className="mt-3 text-center">
                    <button
                      onClick={() => navigate('/dashboard/wallets')}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                    >
                      +{wallets.length - 4} more wallet{wallets.length - 4 !== 1 ? 's' : ''}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Available Wallets */}
            {available_providers.length > 0 && (
              <div className="w-full h-auto mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="size-[20px] cursor-pointer overflow-hidden dark:text-gray-500/50 text-gray-700/70">
                      <FaWallet size="100%" />
                    </span>
                    <h3 className="font-semibold text-lg dark:text-gray-200 text-gray-800">
                      Available Wallets
                    </h3>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard/wallets')}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    View All <FaArrowRight size={12} />
                  </button>
                </div>
                <div className="w-full h-fit flex flex-row items-center flex-nowrap overflow-x-auto gap-3 pb-2">
                  {available_providers.slice(0, 6).map((item, index) => (
                    <div key={index} className="w-auto h-auto flex items-center shrink-0">
                      <ProviderCard provider={item} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Quick Actions */}
        <div className="w-full h-auto">
          <h3 className="font-semibold text-lg dark:text-gray-200 text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/dashboard/p2p')}
              className="bg-white dark:bg-background_dark-tint rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors text-left"
            >
              <div className="text-primary text-2xl mb-2">
                <FaChartLine />
              </div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Browse Market
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Explore loan requests
              </div>
            </button>

            <button
              onClick={() => navigate('/dashboard/p2p/account')}
              className="bg-white dark:bg-background_dark-tint rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors text-left"
            >
              <div className="text-green-600 dark:text-green-400 text-2xl mb-2">
                <FaHandshake />
              </div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                My Account
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                View your activity
              </div>
            </button>

            <button
              onClick={() => navigate('/dashboard/liquidity')}
              className="bg-white dark:bg-background_dark-tint rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors text-left"
            >
              <div className="text-blue-600 dark:text-blue-400 text-2xl mb-2">
                <FaWallet />
              </div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Liquidity
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Manage positions
              </div>
            </button>

            <button
              onClick={() => navigate('/dashboard/wallets')}
              className="bg-white dark:bg-background_dark-tint rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors text-left"
            >
              <div className="text-purple-600 dark:text-purple-400 text-2xl mb-2">
                <FaWallet />
              </div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Wallets
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Connect & manage
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;