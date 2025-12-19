/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Coingecko from '@coingecko/coingecko-typescript';
import { NetworkIcon, TokenIcon } from '@web3icons/react/dynamic';
import classNames from 'classnames';
import { motion } from 'motion/react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FaClock,
  FaMoneyBillWave,
  FaShieldAlt,
  FaWallet,
} from 'react-icons/fa';

import { fetchTokenPrice } from '../../../actions/coingecko';
import AppLoader from '../../../components/AppLoader';
import CustomSelect from '../../../components/CustomSelect';
import DropField from '../../../components/DropField';
import type { MetaLoanRequest } from '../../../constants/loans';
import { useLoans } from '../../../hooks/useLoans';
import { useToast } from '../../../hooks/useToast';
import { useWallet } from '../../../hooks/useWallet';

type form = Omit<
  MetaLoanRequest,
  | 'collateralAmount'
  | 'loanDuration'
  | 'maxInterestRate'
  | 'principalAmount'
  | 'requestValidDays'
  | 'collateralAsset'
  | 'principalAsset'
> & {
  collateralAmount: number;
  loanDuration: string;
  maxInterestRate: number;
  principalAmount: number;
  requestValidDays: string;
  collateralAsset: string;
  principalAsset: string;
};

const RequestLoan = () => {
  const { protocol } = useLoans();
  const { decimals } = useWallet();
  const { selectedProviders, wallets, supportedAssets } = useWallet();
  const toast = useToast();
  const [collateralPrice, setCollateralPrice] =
    useState<Coingecko.Simple.Price.PriceGetResponse | null>(null);
  const [principalPrice, setPrincipalPrice] =
    useState<Coingecko.Simple.Price.PriceGetResponse | null>(null);
  const [formData, setFormData] = useState<form>({} as form);
  const [loading, setLoading] = useState<boolean>(false);
  const [collateral_ratio, setCollateral_ratio] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const calculateCollateralRatio = async () => {
      const [coll, prin] = [
        Object.values(supportedAssets).find(
          (i) => i.id === formData.collateralAsset
        )!,
        Object.values(supportedAssets).find(
          (i) => i.id === formData.principalAsset
        )!,
      ];

      if (!coll || !prin || !formData.principalAmount) return;

      let collateral_asset_data = collateralPrice?.[coll?.coingeckoId!],
        principal_asset_data = principalPrice?.[prin?.coingeckoId!];

      // const today = new Date().getTime();

      if (
        !collateral_asset_data ||
        !principal_asset_data
        // ||
        // (collateral_asset_data &&
        //   today - Number(collateral_asset_data['last_updated_at']! * 1000) >
        //     18000) ||
        // (principal_asset_data &&
        //   today - Number(principal_asset_data['last_updated_at']! * 1000) >
        //     18000)
      ) {
        setLoading(true);
        const res_coll = await fetchTokenPrice(coll);
        const res_prin = await fetchTokenPrice(prin);

        if (res_coll.error) {
          toast.error({
            message: res_coll.message,
            title: ' Error Fetching Collateral Asset Price',
            autoClose: true,
            duration: 5000,
            position: 'top-right',
          });

          return;
        }

        if (res_prin.error) {
          toast.error({
            message: res_prin.message,
            title: ' Error Fetching Principle Asset Price',
            autoClose: true,
            duration: 5000,
            position: 'top-right',
          });
          return;
        }

        collateral_asset_data = res_coll.data![coll!.coingeckoId!];
        principal_asset_data = res_prin.data![prin!.coingeckoId!];

        setCollateralPrice(res_coll.data!);
        setPrincipalPrice(res_prin.data!);
      }

      if (!formData.collateralAmount) return;

      const ratio =
        (Number(formData.collateralAmount) * collateral_asset_data['usd']!) /
        (Number(formData.principalAmount) * principal_asset_data['usd']!);
      setCollateral_ratio(ratio * 100);
    };

    calculateCollateralRatio();
  }, [
    formData.collateralAsset,
    formData.principalAmount,
    formData.principalAsset,
    formData.collateralAmount,
  ]);

  useEffect(() => {
    if (
      collateralPrice &&
      principalPrice &&
      formData.principalAmount &&
      !formData.collateralAmount
    ) {
      const [coll, prin] = [
        Object.values(supportedAssets).find(
          (i) => i.id === formData.collateralAsset
        )!,
        Object.values(supportedAssets).find(
          (i) => i.id === formData.principalAsset
        )!,
      ];
      const collateral = collateralPrice?.[coll.coingeckoId!];
      const principal = principalPrice?.[prin.coingeckoId!];

      const amount = Number(
        (Number(formData.principalAmount) * Number(principal.usd)) /
          Number(collateral.usd) +
          (0.1 * (Number(formData.principalAmount) * Number(principal.usd))) /
            Number(collateral.usd)
      );

      setFormData((prev: form) => ({
        ...prev,
        collateralAmount: amount,
      }));
    }

    setLoading(false);
  }, [
    collateralPrice,
    formData.collateralAmount,
    formData.collateralAsset,
    formData.principalAmount,
    formData.principalAsset,
    principalPrice,
    supportedAssets,
  ]);

  const inputs: Record<
    'principal' | 'collateral' | 'timeline',
    {
      name: string;
      colSpan?: 'full' | 'auto';
      type: string;
      inputType: 'field' | 'text-box' | 'select' | 'hybrid';
      minValue?: number;
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
          value: formData.principalAsset,
          key: 'principalAsset',
          options: Object.values(supportedAssets).map((i) => ({
            name: i.name,
            data: i,
            value: i.id,
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
          minValue: 0,
          value: formData.principalAmount,
          key: 'principalAmount',
          placeholder: '0.000',
        },
        {
          name: 'Recieving Address',
          colSpan: 'full',
          type: 'text',
          inputType: 'hybrid',
          value: formData.receivingWallet,
          key: 'receivingWallet',
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
          minValue: 3,
          inputType: 'field',
          value: formData.maxInterestRate,
          key: 'maxInterestRate',
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
            value: i.id,
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
          minValue: 0,
          value: formData.collateralAmount,
          key: 'collateralAmount',
        },
        {
          name: 'Collateral Payment Address',
          colSpan: 'full',
          type: 'text',
          inputType: 'hybrid',
          value: formData.borrower,
          key: 'borrower',
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
      ],
      timeline: [
        {
          name: 'Repayment Deadline',
          colSpan: 'auto',
          type: 'date',
          inputType: 'field',
          value: formData.loanDuration,
          key: 'loanDuration',
        },
        {
          name: 'Request Expiry',
          colSpan: 'auto',
          type: 'date',
          inputType: 'field',
          value: formData.requestValidDays,
          key: 'requestValidDays',
        },
      ],
    }),
    [
      formData.collateralAmount,
      formData.collateralAsset,
      formData.maxInterestRate,
      formData.principalAmount,
      formData.principalAsset,
      formData.receivingWallet,
      formData.loanDuration,
      formData.requestValidDays,
      supportedAssets,
      wallets,
    ]
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

  const validate_form = () => {
    if (collateral_ratio < 110) {
      toast.error({
        message: 'Collateral ratio is below the minimum required of 110%',
        title: ' Invalid Collateral Ratio',
        autoClose: true,
        duration: 5000,
        position: 'top-right',
      });
      return false;
    }
    if (!formData.loanDuration || !formData.requestValidDays) {
      toast.error({
        message:
          'Please provide valid dates for repayment deadline and request expiry',
        title: ' Invalid Dates',
        autoClose: true,
        duration: 5000,
        position: 'top-right',
      });
      return false;
    }
    if (new Date(formData.requestValidDays) <= new Date()) {
      toast.error({
        message: 'Request expiry must be a future date',
        title: ' Invalid Request Expiry Date',
        autoClose: true,
        duration: 5000,
        position: 'top-right',
      });
      return false;
    }
    if (new Date(formData.loanDuration) <= new Date()) {
      toast.error({
        message: 'Repayment deadline must be a future date',
        title: ' Invalid Repayment Deadline Date',
        autoClose: true,
        duration: 5000,
        position: 'top-right',
      });
      return false;
    }
    if (formData.principalAmount <= 0) {
      toast.error({
        message: 'Principle amount must be greater than zero',
        title: ' Invalid Principle Amount',
        autoClose: true,
        duration: 5000,
        position: 'top-right',
      });
      return false;
    }
    if (formData.maxInterestRate < 3) {
      toast.error({
        message: 'Interest rate must be at least 3%',
        title: ' Invalid Interest Rate',
        autoClose: true,
        duration: 5000,
        position: 'top-right',
      });
      return false;
    }
    if (!formData.receivingWallet) {
      toast.error({
        message: 'Please provide a valid receiving wallet address',
        title: ' Invalid Receiving Wallet',
        autoClose: true,
        duration: 5000,
        position: 'top-right',
      });
      return false;
    }
    if (!formData.borrower) {
      toast.error({
        message: 'Please provide a valid collateral payment address',
        title: ' Invalid Collateral Payment Address',
        autoClose: true,
        duration: 5000,
        position: 'top-right',
      });
      return false;
    }
    if (!formData.principalAsset) {
      toast.error({
        message: 'Please select a principal asset',
        title: ' Principal Asset Not Selected',
        autoClose: true,
        duration: 5000,
        position: 'top-right',
      });
      return false;
    }
    if (!formData.collateralAsset) {
      toast.error({
        message: 'Please select a collateral asset',
        title: ' Collateral Asset Not Selected',
        autoClose: true,
        duration: 5000,
        position: 'top-right',
      });
      return false;
    }
    if (formData.collateralAmount <= 0) {
      toast.error({
        message: 'Collateral amount must be greater than zero',
        title: ' Invalid Collateral Amount',
        autoClose: true,
        duration: 5000,
        position: 'top-right',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    console.log('Submitting form data: ', formData);

    const is_valid = validate_form();
    if (!is_valid) {
      setIsSubmitting(false);
      return;
    }

    setLoading(true);

    try {
      const data: MetaLoanRequest = {} as MetaLoanRequest;

      const { collateral, principal } = decimals({
        collateral: supportedAssets?.[formData.collateralAsset]!,
        principal: supportedAssets?.[formData.principalAsset]!,
      });
      data.borrower = formData.borrower;
      data.collateralAsset =
        supportedAssets?.[formData.collateralAsset]!.zrc20Address!;
      data.collateralAmount = BigInt(
        Math.trunc(Number(formData.collateralAmount * collateral))
      );
      data.loanDuration = BigInt(
        Math.trunc(
          Number(
              new Date(formData.loanDuration).getTime() - new Date().getTime()
          )
        )
      );
      data.maxInterestRate = BigInt(
        Math.trunc(Number(formData.maxInterestRate))
      ); // not sure if this will work
      data.principalAsset =
        supportedAssets?.[formData.principalAsset]!.zrc20Address!;
      data.principalAmount = BigInt(
        Math.trunc(Number(formData.principalAmount * principal))
      ); // consider decimals
      data.receivingWallet = formData.receivingWallet;
      data.requestValidDays = BigInt(
        Math.trunc(
          Number(
            (new Date(formData.requestValidDays).getTime() -
              new Date().getTime()) /
              (60 * 60 * 24 * 1000)
          )
        )
      );

      const wallet = wallets.find((i) => i.account === data.borrower)!;
      const provider = selectedProviders[wallet.eip6963.info.rdns!];

      const res = await protocol?.createLoanRequest(data, wallet, provider);
      console.log('Loan Request Created: ', res);
      toast.success({
        message: 'Loan request created successfully',
        title: ' Loan Request Created',
        autoClose: true,
        duration: 5000,
        position: 'top-right',
      });
      setIsSubmitting(false);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error({
        message: (error as Error).message,
        title: ' Loan Request Creation Failed',
        autoClose: true,
        duration: 5000,
        position: 'top-right',
      });
      setIsSubmitting(false);
      setLoading(false);
      return;
    }
  };

  return (
    <>
      {loading && <AppLoader />}
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
                            setFormData((prev) => ({
                              ...prev,
                              [input.key]: val,
                            }))
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
                        min={input.minValue}
                        placeholder={input.placeholder}
                        className="w-full p-3 rounded-lg bg-background_light dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/40 focus:border-transparent focus:outline-none"
                        required
                      />
                    ) : input.inputType === 'hybrid' ? (
                      <div className="flex items-center w-full">
                        <DropField
                          _key={input.key}
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
                            setFormData((prev) => ({
                              ...prev,
                              [input.key]: val,
                            }))
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
                        className="w-full p-3 rounded-lg bg-background_light dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/40 focus:border-transparent focus:outline-none"
                        required
                      />
                    ) : input.inputType === 'hybrid' ? (
                      <div className="flex items-center w-full">
                        <DropField
                          _key={input.key}
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
                  <span
                    className={
                      `font-medium ` +
                      classNames({
                        'text-primary': collateral_ratio > 109,
                        'text-red-400': collateral_ratio <= 109,
                      })
                    }
                  >
                    {collateral_ratio.toFixed(2)}%
                  </span>{' '}
                  <span>(Recommended = 125%)</span>
                </p>
                <div
                  className={
                    'w-full overflow-hidden flex mt-2 h-2 rounded-xl ' +
                    classNames({
                      'bg-primary/30': collateral_ratio > 100,
                      'bg-red-500/30': collateral_ratio <= 100,
                    })
                  }
                >
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{
                      width: `${Math.floor((collateral_ratio / 200) * 100)}%`,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: 'easeInOut',
                    }}
                    className={
                      'h-full rounded-xl ' +
                      classNames({
                        'bg-primary': collateral_ratio > 109,
                        'bg-red-500': collateral_ratio <= 109,
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
                            setFormData((prev) => ({
                              ...prev,
                              [input.key]: val,
                            }))
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
                        className="w-full p-3 rounded-lg bg-background_light dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/40 focus:border-transparent focus:outline-none"
                        required
                      />
                    ) : input.inputType === 'hybrid' ? (
                      <div className="flex items-center w-full">
                        <DropField
                          _key={input.key}
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
    </>
  );
};

export default RequestLoan;
