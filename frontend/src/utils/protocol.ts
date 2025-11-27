import { AbiCoder, parseEther } from 'ethers';

import { readContract } from '../config/viem';
import {
  abi as P2PLendingProtocolABI,
  type ContractFunctionNames,
  type PayableContractFunctionNames,
} from '../constants/abis';
import type { MetaBid, MetaLoanRequest } from '../constants/loans';
import type { EIP6963ProviderDetail } from '../types/wallet';

interface RequestQueueItem {
  data: string;
  provider?: EIP6963ProviderDetail;
  initiatorAddress?: string;
  bitcoinProvider?: any;
}

const userCallsQueue = new Map<
  'bid' | 'loan_request' | 'loan_execute' | 'bid_withdraw',
  RequestQueueItem
>();

const abiCoder = new AbiCoder();

export default {
  createLoanRequest: async (
    req: MetaLoanRequest,
    provider?: EIP6963ProviderDetail,
    bitcoinProvider?: any
  ) => {
    try {
      const loanrequest = abiCoder.encode(
        ['address', 'uint256', 'bytes', 'uint256', 'uint256', 'uint256'],
        [
          req.principalAsset,
          req.principalAmount,
          req.receivingWallet,
          req.maxInterestRate,
          req.loanDuration,
          req.requestValidDays,
        ]
      );
      const payload = abiCoder.encode(
        ['string', 'address', 'bytes'],
        ['CREATE_LOAN_REQUEST', req.borrower, loanrequest]
      );

      userCallsQueue.set('loan_request', {
        data: payload,
        bitcoinProvider,
        initiatorAddress: req.borrower,
        provider,
      });
    } catch (err) {
      console.log(
        `[ERROR] - [PROTOCOL] - [CREATE LOAN REQUEST] - [ BORROWER = ${req.borrower}] MESSAGE = ${err} `
      );
      if (err instanceof Error) throw err;

      throw new Error(err as string);
    }
  },

  createLoanBid: async (
    req: MetaBid,
    provider?: EIP6963ProviderDetail['provider'],
    bitcoinProvider?: any
  ) => {},

  getSupportedAssets: async () => {
    try {
      const res = await readContract({
        functionName: 'supportedAssets' as ContractFunctionNames,
      });
      console.log('supported assets call', res, typeof res);
      return res;
    } catch (error) {
      console.error('Supported Assets call failed', error)
      return null
    }
  },
};

const contractMutateMultiCall = async () => {
  try {
    const wagmiContract = {
      address: import.meta.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS,
      abi: P2PLendingProtocolABI,
    } as const;

    const queue: Array<
      typeof wagmiContract & {
        functionName: PayableContractFunctionNames;
        args: Array<any>;
      }
    > = [];
    for (const [key, value] of userCallsQueue) {
      queue.push({
        ...wagmiContract,
        functionName: 'call',
        args: [value.data],
      });
    }

    await publicClient.multicall({
      contracts: queue,
    });
  } catch (err) {
    if (error instanceof Error) throw err;
    throw new Error(err as string);
  }
};
