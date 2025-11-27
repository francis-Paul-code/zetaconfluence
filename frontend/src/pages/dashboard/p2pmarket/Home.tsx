/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

import { NetworkIcon, TokenIcon } from '@web3icons/react/dynamic';
import { useState } from 'react';
import { FaFilter, FaMoneyBillWave, FaSearch } from 'react-icons/fa';

import LoanRequestCard from '../../../components/LoanRequestCard';
import Select from '../../../components/SelectField';
import { type Bid, type LoanRequest } from '../../../constants/loans';
import { useWallet } from '../../../hooks/useWallet';
import { dummyLoanRequests } from './dummy';

type _LoanRequest = Omit<LoanRequest, 'bids'> & {
  bids: Bid[];
};

const LoansMarket = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsset, setFilterAsset] = useState('all');
  const { supportedAssets } = useWallet();

  const filteredLoanRequests: _LoanRequest[] = dummyLoanRequests.filter(
    (loan: _LoanRequest) => {
      const matchesSearch =
        loan?.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan?.principalAsset.toLowerCase().includes(searchTerm.toLowerCase());
      const asset = supportedAssets[filterAsset];
      const matchesFilter =
        filterAsset === 'all' || loan?.principalAsset === asset.address;
      return matchesSearch && matchesFilter;
    }
  );

  return (
    <div className="w-full h-full overflow-hidden bg-gray-50 rounded-2xl dark:bg-background_dark p-6">
      <div className="w-full h-full flex flex-col overflow-y-hidden">
        {/* Header */}
        <div className="w-full h-auto flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="size-[30px] cursor-pointer overflow-hidden text-primary">
              <FaMoneyBillWave size="100%" />
            </span>
            <h2 className="font-semibold text-2xl dark:text-gray-200 text-gray-800">
              Loans Market
            </h2>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search loans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 px-3">
              <FaFilter className="text-gray-400" />
              <Select
                options={[
                  { name: 'All', id: 'all' },
                  ...Object.values(supportedAssets),
                ]}
                value={filterAsset}
                onChange={setFilterAsset}
                placeholder="Choose asset"
                renderOption={(opt: any) => (
                  <div className="flex items-center w-full h-auto">
                    {opt?.symbol && (
                      <span className="size-[20px] flex items-center justify-center">
                        <TokenIcon
                          symbol={opt?.symbol!.toLocaleLowerCase()!}
                          variant="branded"
                          size="65"
                          className="size-full"
                        />
                      </span>
                    )}
                    <p className="text-sm text-nowrap text-ellipsis ml-2">
                      {opt.name}
                    </p>
                    {opt?.symbol && (
                      <span className="size-[20px] flex items-center justify-center ml-auto">
                        <NetworkIcon
                          className="size-full"
                          id={opt?.network}
                          variant="branded"
                          size="64"
                        />
                      </span>
                    )}
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* Loans Grid */}
        <div className=" w-full h-auto flex-1 overflow-y-scroll grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 grid-flow-row gap-4 px-3">
          {filteredLoanRequests?.map((loan) => (
            <div className="w-auto h-fit">
              <LoanRequestCard loan={loan} />
            </div>
          ))}
        </div>

        {/* No results */}
        {filteredLoanRequests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-300 dark:text-gray-600 mb-4">
              🔍
            </div>
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              No loans found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoansMarket;
