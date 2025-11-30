/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbiCoder } from 'ethers';
import {
  type AbiStateMutability,
  createPublicClient,
  createWalletClient,
  http,
  type MulticallReturnType,
  type Narrow,
  type WalletClient,
} from 'viem';
import { zetachain } from 'viem/chains';

import { type HexAddr } from '../config/viem';
import {
  abi as P2PLendingProtocolABI,
  type ContractFunctionNames,
} from '../constants/abis';
import type { Wallet } from '../constants/chains';
import type { MetaBid, MetaLoanRequest } from '../constants/loans';
import type { EIP6963ProviderDetail } from '../types/wallet';
import { getSignerAndProvider } from './ethersHelpers';
import gateway from './gateway';

interface RequestQueueItem {
  data: string;
  evmProvider?: EIP6963ProviderDetail;
  solanaProvider?: any;
  wallet?: Wallet;
  bitcoinProvider?: any;
  functionName: ContractFunctionNames;
  stateMutability?: Narrow<AbiStateMutability>;
}

const userCallsQueue = new Map<string, RequestQueueItem>();

// Queue monitoring state
let isProcessing = false;
const TARGET_QUEUE_LENGTH = 1;

// Check queue length and trigger callback if needed
const checkQueueLength = async (
  queue: Map<string, RequestQueueItem>,
  targetLength: number
) => {
  if (queue.size >= targetLength && !isProcessing) {
    isProcessing = true;
    const client = createWalletClient({
      chain: zetachain,
      transport: http(import.meta.env.VITE_ZETA_RPC_URL),
    });
    const res: MulticallReturnType = await contractViewMultiCall({ client });
    for (let i = 0; i < res.length; i++) {
      console.log('call result', res[i])
      if (!res[i].error) {
        removeFromQueue(queue, Array.from(queue.keys())[i]);
      } else {
        // hande dead request queue later
      }
    }
  }
};

const addToQueue = (
  queue: Map<string, RequestQueueItem>,
  key: string,
  item: RequestQueueItem
) => {
  queue.set(key, item);
  checkQueueLength(queue, TARGET_QUEUE_LENGTH);
};

// Remove item from queue
const removeFromQueue = (queue: Map<string, RequestQueueItem>, key: string) => {
  return queue.delete(key);
};

const abiCoder = new AbiCoder();

export default {
  createLoanRequest: async (
    req: MetaLoanRequest,
    wallet: Wallet,
    evmProvider?: EIP6963ProviderDetail,
    bitcoinProvider?: any,
    solanaProvider?: any
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
      const payload = [
        ['string', 'address', 'bytes'],
        ['CREATE_LOAN_REQUEST', req.borrower, loanrequest],
      ];
      if (evmProvider) {
        const signer = await getSignerAndProvider({
          selectedProvider: evmProvider,
          primaryWallet: wallet,
        })!;
        gateway.evm.depositAndCall(
          {
            receiver: process.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            revertOptions: {
              revertAddress: await signer?.signer.getAddress(),
              callOnRevert: true,
              revertMessage: 'CREATE_LOAN_REQUEST',
              abortAddress: process.env
                .VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            },
            types: payload[0],
            values: payload[1],
            token: req.collateralAsset as HexAddr,
            amount: req.collateralAmount.toString(),
          },
          signer?.signer!
        );
      }
      // else if (bitcoinProvider) {
      // } else if (solanaProvider) {
      // }
      else throw new Error('No provider provided');
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

  getSupportedAssets: async (
    wallet: Wallet,
    evmProvider?: EIP6963ProviderDetail,
    _bitcoinProvider?: any,
    _solanaProvider?: any
  ) => {
    try {
      const req: RequestQueueItem = {
        bitcoinProvider: _bitcoinProvider,
        evmProvider,
        solanaProvider: _solanaProvider,
        wallet,
        data: '',
        functionName: 'getSupportedAssets' as ContractFunctionNames,
      };

      // Add to queue and check length
      addToQueue(userCallsQueue, 'supported_assets', req);

      return null;
    } catch (error) {
      console.error('Supported Assets call failed', error);
      return null;
    }
  },

};

const contractViewMultiCall = async ({ client }: { client: WalletClient }) => {
  // batch multiple view and pure function calls
  try {
    const publicClient = createPublicClient({
      chain: client.chain,
      transport: http(),
    });
    const wagmiContract = {
      address: import.meta.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS,
      abi: P2PLendingProtocolABI,
    } as const;

    const queue: Array<
      typeof wagmiContract & {
        functionName: ContractFunctionNames;
        args: Array<any>;
      }
    > = [];
    for (const [_key, value] of userCallsQueue) {
      queue.push({
        ...wagmiContract,
        functionName: value.functionName,
        args: [value.data],
      });
    }

    return await publicClient.multicall({
      contracts: queue,
    });
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error(err as string);
  }
};
