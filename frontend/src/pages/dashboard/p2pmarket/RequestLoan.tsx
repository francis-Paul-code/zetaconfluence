/* eslint-disable @typescript-eslint/no-explicit-any */
import { NetworkIcon, TokenIcon } from '@web3icons/react/dynamic';
import classNames from 'classnames';
import { motion } from 'motion/react';
import React, { useMemo, useState } from 'react';
import {
  FaClock,
  FaMoneyBillWave,
  FaShieldAlt,
  FaWallet,
} from 'react-icons/fa';

import CustomSelect from '../../../components/CustomSelect';
import DropField from '../../../components/DropField';
import type { HexAddr } from '../../../config/viem';
import { useLoans } from '../../../hooks/useLoans';
import { useWallet } from '../../../hooks/useWallet';

const RequestLoan = () => {
  const { protocol } = useLoans();
  const { selectedProviders, wallets, supportedAssets } = useWallet();

  const [formData, setFormData] = useState<{
    principleAsset: HexAddr;
    principleAmount: number;
    receivingWallet: HexAddr;
    repaymentDeadline: Date;
    interestRate: number;
    collateralAsset: HexAddr;
    collateralAmount: number;
    requestExpiry: any;
  }>(
    {} as {
      principleAsset: HexAddr;
      principleAmount: number;
      receivingWallet: HexAddr;
      repaymentDeadline: Date;
      interestRate: number;
      collateralAsset: HexAddr;
      collateralAmount: number;
      requestExpiry: any;
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputs: Record<
    'principal' | 'collateral' | 'timeline',
    {
      name: string;
      colSpan?: 'full' | 'auto';
      type: string;
      inputType: 'field' | 'text-box' | 'select' | 'hybrid';
      value?: unknown;
      key: string;
      options?: {
        name: string;
        data: unknown;
        value: string;
        renderLabel?: (data: any) => React.ReactNode;
      }[];
      placeholder?: string;
      maxLength?: number;
    }[]
  > = useMemo(
    () => ({
      principal: [
        {
          name: 'Principle Asset',
          colSpan: 'auto',
          type: 'select',
          inputType: 'select',
          value: formData.principleAsset,
          key: 'principleAsset',
          options: Object.values(supportedAssets).map((i) => ({
            name: i.name,
            data: i,
            value: i.address! + ':' + i.chainId,
            renderLabel: (data: typeof i) => (
              <div className="w-full h-auto flex items-center gap-2 py-2">
                <div className="h-auto w-auto mr-2 relative">
                  <div className="size-[20px] rounded-full overflow-hidden">
                    <TokenIcon
                      symbol={data.symbol!.toLocaleLowerCase()}
                      variant="background"
                      size="65"
                      className="size-full"
                    />
                  </div>
                  <div className="absolute size-[10px] z-[1] rounded-full overflow-hidden bottom-0 right-0">
                    <NetworkIcon
                      className="size-full"
                      id={data.network}
                      variant="background"
                      size="64"
                    />
                  </div>
                </div>
                <div className="text-base w-auto dark:text-white text-gray-800">
                  {data.name}
                </div>
              </div>
            ),
          })),
        },
        {
          name: 'Principle Amount',
          colSpan: 'auto',
          type: 'number',
          inputType: 'field',
          value: formData.principleAmount,
          key: 'principleAmount',
          placeholder: '0.000',
        },
        {
          name: 'Recieving Address',
          colSpan: 'full',
          type: 'text',
          inputType: 'hybrid',
          value: formData.receivingWallet,
          key: 'recievingWallet',
          placeholder: '0x...',
          options: wallets.map((i) => ({
            name: i.account!,
            value: i.account!,
            data: i,
            renderLabel: (data: typeof i) => (
              <div className="w-full h-auto flex items-center gap-2 py-2">
                <div className="size-[20px] flex mr-3 items-center">
                  <img
                    src={data.eip6963.info?.icon}
                    alt={data.eip6963.info.name}
                    className="size-full object-cover"
                  />
                </div>
                <div className="text-base w-auto dark:text-white text-gray-800">
                  {data.account}
                </div>
              </div>
            ),
          })),
        },
        {
          name: 'Interest Rate',
          colSpan: 'full',
          type: 'number',
          inputType: 'field',
          value: formData.interestRate,
          key: 'interestRate',
        },
      ],
      collateral: [
        {
          name: 'Collateral Asset',
          colSpan: 'auto',
          type: 'select',
          inputType: 'select',
          value: formData.collateralAsset,
          key: 'collateralAsset',
          options: Object.values(supportedAssets).map((i) => ({
            name: i.name,
            data: i,
            value: i.address! + ':' + i.chainId,
            renderLabel: (data: typeof i) => (
              <div className="w-full h-auto flex items-center gap-2 py-2">
                <div className="h-auto w-auto mr-2 relative">
                  <div className="size-[20px] rounded-full overflow-hidden">
                    <TokenIcon
                      symbol={data.symbol!.toLocaleLowerCase()}
                      variant="background"
                      size="65"
                      className="size-full"
                    />
                  </div>
                  <div className="absolute size-[10px] z-[1] rounded-full overflow-hidden bottom-0 right-0">
                    <NetworkIcon
                      className="size-full"
                      id={data.network}
                      variant="background"
                      size="64"
                    />
                  </div>
                </div>
                <div className="text-base w-auto dark:text-white text-gray-800">
                  {data.name}
                </div>
              </div>
            ),
          })),
        },
        {
          name: 'Collateral Amount',
          colSpan: 'auto',
          type: 'number',
          inputType: 'field',
          value: formData.collateralAmount,
          key: 'collateralAmount',
        },
      ],
      timeline: [
        {
          name: 'Repayment Deadline',
          colSpan: 'auto',
          type: 'date',
          inputType: 'field',
          value: formData.repaymentDeadline,
          key: 'repaymentDeadline',
        },
        {
          name: 'Request Expiry',
          colSpan: 'auto',
          type: 'number',
          inputType: 'field',
          value: formData.requestExpiry,
          key: 'requestExpiry',
        },
      ],
    }),
    [formData]
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    if (protocol) {
      console.log('calling');
      protocol.getSupportedAssets(wallets[0], selectedProviders[0]);
    }
  };

  const collateral_ratio = useMemo(() => {
    return 126;
  }, [formData]);
  return (
    <div className="w-full h-full overflow-hidden bg-gray-50 rounded-2xl dark:bg-background_dark p-2 ">
      <div className="w-full h-full overflow-y-scroll p-6">
        {/* Header */}
        <div className="w-full h-auto flex items-center mb-8 gap-3">
          <span className="size-[30px] cursor-pointer overflow-hidden text-primary">
            <FaMoneyBillWave size="100%" />
          </span>
          <h2 className="font-semibold text-2xl dark:text-gray-200 text-gray-800">
            Request Loan
          </h2>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Loan Details Section */}
          <div className="bg-white dark:bg-background_dark-tint rounded-xl p-6 ">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputs.principal.map((input) => (
                <div
                  key={input.key}
                  className={classNames({
                    'col-span-full': input.colSpan === 'full',
                  })}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {input.name}
                  </label>
                  {input.inputType === 'select' ? (
                    <div className="w-auto min-h-[48px] flex ">
                      <CustomSelect
                        name={input.name}
                        value={formData[input.key as keyof typeof formData]}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, [input.key]: val }))
                        }
                        className={'w-full h-auto flex-1'}
                        options={input.options || []}
                        placeholder={input.placeholder}
                      />
                    </div>
                  ) : input.inputType === 'field' ? (
                    <input
                      type={input.type}
                      name={input.key}
                      value={formData[input.key as keyof typeof formData]}
                      onChange={handleInputChange}
                      placeholder={input.placeholder}
                      className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/40 focus:border-transparent focus:outline-none"
                      required
                    />
                  ) : input.inputType === 'hybrid' ? (
                    <div className="flex items-center w-full">
                      <DropField
                        key={input.key}
                        type={input.type}
                        value={setFormData}
                        formValues={formData}
                        maxLength={input.maxLength}
                        options={input.options}
                        placeholder={input.placeholder}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Collateral Section */}
          <div className="bg-white dark:bg-background_dark-tint rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <FaShieldAlt className="text-primary" />
              Collateral (Min 110% of loan value)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputs.collateral.map((input) => (
                <div
                  key={input.key}
                  className={classNames({
                    'col-span-full': input.colSpan === 'full',
                  })}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {input.name}
                  </label>
                  {input.inputType === 'select' ? (
                    <div className="w-auto min-h-[48px] flex ">
                      <CustomSelect
                        name={input.name}
                        value={formData[input.key as keyof typeof formData]}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, [input.key]: val }))
                        }
                        className={'w-full h-auto flex-1'}
                        options={input.options || []}
                        placeholder={input.placeholder}
                      />
                    </div>
                  ) : input.inputType === 'field' ? (
                    <input
                      type={input.type}
                      name={input.key}
                      value={formData[input.key as keyof typeof formData]}
                      onChange={handleInputChange}
                      placeholder={input.placeholder}
                      className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/40 focus:border-transparent focus:outline-none"
                      required
                    />
                  ) : input.inputType === 'hybrid' ? (
                    <div className="flex items-center w-full">
                      <DropField
                        key={input.key}
                        type={input.type}
                        value={setFormData}
                        formValues={formData}
                        maxLength={input.maxLength}
                        options={input.options}
                        placeholder={input.placeholder}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Collateral Ratio Display */}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg w w-full ">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Collateral Ratio:{' '}
                <span className="font-medium text-primary">125%</span>{' '}
                (Recommended)
              </p>
              <div
                className={
                  'w-full overflow-hidden flex mt-2 h-2 rounded-xl ' +
                  classNames({
                    'bg-primary/30': collateral_ratio > 125,
                    'bg-red-500/30': collateral_ratio <= 100,
                  })
                }
              >
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{
                    width: `${Math.floor((collateral_ratio / 200) * 100)}%`,
                  }}
                  className={
                    'h-full rounded-xl ' +
                    classNames({
                      'bg-primary': collateral_ratio > 125,
                      'bg-red-500': collateral_ratio <= 100,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-white dark:bg-background_dark-tint rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <FaClock className="text-primary" />
              Timeline
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputs.timeline.map((input) => (
                <div
                  key={input.key}
                  className={classNames({
                    'col-span-full': input.colSpan === 'full',
                  })}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {input.name}
                  </label>
                  {input.inputType === 'select' ? (
                    <div className="w-auto min-h-[48px] flex ">
                      <CustomSelect
                        name={input.name}
                        value={formData[input.key as keyof typeof formData]}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, [input.key]: val }))
                        }
                        className={'w-full h-auto flex-1'}
                        options={input.options || []}
                        placeholder={input.placeholder}
                      />
                    </div>
                  ) : input.inputType === 'field' ? (
                    <input
                      type={input.type}
                      name={input.key}
                      value={formData[input.key as keyof typeof formData]}
                      onChange={handleInputChange}
                      placeholder={input.placeholder}
                      className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/40 focus:border-transparent focus:outline-none"
                      required
                    />
                  ) : input.inputType === 'hybrid' ? (
                    <div className="flex items-center w-full">
                      <DropField
                        key={input.key}
                        type={input.type}
                        value={setFormData}
                        formValues={formData}
                        maxLength={input.maxLength}
                        options={input.options}
                        placeholder={input.placeholder}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Creating Request...
                </>
              ) : (
                <>
                  <FaWallet />
                  Create Loan Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestLoan;
