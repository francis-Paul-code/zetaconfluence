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
import { zetachain as zeta_prod, zetachainAthensTestnet } from 'viem/chains';

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

const zetachain =
  import.meta.env.NODE_ENV === 'production'
    ? zeta_prod
    : zetachainAthensTestnet;
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
      console.log('call result', res[i]);
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
        const res = await gateway.evm.depositAndCall(
          {
            receiver: import.meta.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            revertOptions: {
              revertAddress: await signer?.signer.getAddress(),
              callOnRevert: true,
              revertMessage: 'CREATE_LOAN_REQUEST',
              abortAddress: import.meta.env
                .VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            },
            types: payload[0],
            values: payload[1],
            token: req.collateralAsset as HexAddr,
            amount: req.collateralAmount.toString(),
          },
          signer?.signer!
        );

        return res;
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

  placeLoanBid: async (
    bids: MetaBid[], // change contract to allow 1 bid at a time
    wallet: Wallet,
    evmProvider?: EIP6963ProviderDetail,
    bitcoinProvider?: any,
    solanaProvider?: any
  ) => {
    try {
      const encodedBids = abiCoder.encode(
        [
          'tuple(uint256 loanRequestId, address lender, uint256 amount, uint256 interestRate, address fundingAsset)[]',
        ],
        [
          bids.map((bid) => [
            bid.loanRequestId,
            bid.lender,
            bid.amount,
            bid.interestRate,
            bid.fundingAsset,
          ]),
        ]
      );

      const payload = [
        ['string', 'address', 'bytes'],
        ['PLACE_LOAN_REQUEST_BID', wallet.account!, encodedBids],
      ];

      if (evmProvider) {
        const signer = await getSignerAndProvider({
          selectedProvider: evmProvider,
          primaryWallet: wallet,
        })!;

        // Assuming first bid's funding asset and amount for the deposit
        const firstBid = bids[0];
        gateway.evm.depositAndCall(
          {
            receiver: import.meta.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            revertOptions: {
              revertAddress: await signer?.signer.getAddress(),
              callOnRevert: true,
              revertMessage: 'PLACE_LOAN_REQUEST_BID',
              abortAddress: import.meta.env
                .VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            },
            types: payload[0],
            values: payload[1],
            token: firstBid.fundingAsset as HexAddr,
            amount: firstBid.amount.toString(),
          },
          signer?.signer!
        );
      } else throw new Error('No provider provided');
    } catch (err) {
      console.log(`[ERROR] - [PROTOCOL] - [PLACE LOAN BID] - MESSAGE = ${err}`);
      if (err instanceof Error) throw err;
      throw new Error(err as string);
    }
  },

  recoverBidFunding: async (
    bidId: number,
    wallet: Wallet,
    evmProvider?: EIP6963ProviderDetail,
    bitcoinProvider?: any,
    solanaProvider?: any
  ) => {
    try {
      const encodedData = abiCoder.encode(['uint256'], [bidId]);

      const payload = [
        ['string', 'address', 'bytes'],
        ['RECOVER_BID_FUNDING', wallet.account!, encodedData],
      ];

      if (evmProvider) {
        const signer = await getSignerAndProvider({
          selectedProvider: evmProvider,
          primaryWallet: wallet,
        })!;

        gateway.evm.gatewayCall(
          {
            receiver: import.meta.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            revertOptions: {
              revertAddress: await signer?.signer.getAddress(),
              callOnRevert: true,
              revertMessage: 'RECOVER_BID_FUNDING',
              abortAddress: import.meta.env
                .VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            },
            types: payload[0],
            values: payload[1],
          },
          signer?.signer!
        );
      } else throw new Error('No provider provided');
    } catch (err) {
      console.log(
        `[ERROR] - [PROTOCOL] - [RECOVER BID FUNDING] - [BID ID = ${bidId}] MESSAGE = ${err}`
      );
      if (err instanceof Error) throw err;
      throw new Error(err as string);
    }
  },

  executeLoan: async (
    loanRequestId: number,
    acceptedBids: number[],
    wallet: Wallet,
    evmProvider?: EIP6963ProviderDetail,
    bitcoinProvider?: any,
    solanaProvider?: any
  ) => {
    try {
      const encodedData = abiCoder.encode(
        ['uint256', 'uint256[]'],
        [loanRequestId, acceptedBids]
      );

      const payload = [
        ['string', 'address', 'bytes'],
        ['EXECUTE_LOAN', wallet.account!, encodedData],
      ];

      if (evmProvider) {
        const signer = await getSignerAndProvider({
          selectedProvider: evmProvider,
          primaryWallet: wallet,
        })!;

        gateway.evm.gatewayCall(
          {
            receiver: import.meta.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            revertOptions: {
              revertAddress: await signer?.signer.getAddress(),
              callOnRevert: true,
              revertMessage: 'EXECUTE_LOAN',
              abortAddress: import.meta.env
                .VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            },
            types: payload[0],
            values: payload[1],
          },
          signer?.signer!
        );
      } else throw new Error('No provider provided');
    } catch (err) {
      console.log(
        `[ERROR] - [PROTOCOL] - [EXECUTE LOAN] - [LOAN REQUEST ID = ${loanRequestId}] MESSAGE = ${err}`
      );
      if (err instanceof Error) throw err;
      throw new Error(err as string);
    }
  },

  repayLoan: async (
    loanId: number,
    repaymentAmount: bigint,
    repaymentAsset: string,
    wallet: Wallet,
    evmProvider?: EIP6963ProviderDetail,
    bitcoinProvider?: any,
    solanaProvider?: any
  ) => {
    try {
      const encodedData = abiCoder.encode(['uint256'], [loanId]);

      const payload = [
        ['string', 'address', 'bytes'],
        ['REPAY_LOAN', wallet.account!, encodedData],
      ];

      if (evmProvider) {
        const signer = await getSignerAndProvider({
          selectedProvider: evmProvider,
          primaryWallet: wallet,
        })!;

        gateway.evm.depositAndCall(
          {
            receiver: import.meta.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            revertOptions: {
              revertAddress: await signer?.signer.getAddress(),
              callOnRevert: true,
              revertMessage: 'REPAY_LOAN',
              abortAddress: import.meta.env
                .VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            },
            types: payload[0],
            values: payload[1],
            token: repaymentAsset as HexAddr,
            amount: repaymentAmount.toString(),
          },
          signer?.signer!
        );
      } else throw new Error('No provider provided');
    } catch (err) {
      console.log(
        `[ERROR] - [PROTOCOL] - [REPAY LOAN] - [LOAN ID = ${loanId}] MESSAGE = ${err}`
      );
      if (err instanceof Error) throw err;
      throw new Error(err as string);
    }
  },

  recoverLoanCollateral: async (
    loanRequestId: number,
    toAddress: string,
    wallet: Wallet,
    evmProvider?: EIP6963ProviderDetail,
    bitcoinProvider?: any,
    solanaProvider?: any
  ) => {
    try {
      const encodedData = abiCoder.encode(
        ['uint256', 'bytes'],
        [loanRequestId, toAddress]
      );

      const payload = [
        ['string', 'address', 'bytes'],
        ['RECOVER_LOAN_COLLATERAL', wallet.account!, encodedData],
      ];

      if (evmProvider) {
        const signer = await getSignerAndProvider({
          selectedProvider: evmProvider,
          primaryWallet: wallet,
        })!;

        gateway.evm.gatewayCall(
          {
            receiver: import.meta.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            revertOptions: {
              revertAddress: await signer?.signer.getAddress(),
              callOnRevert: true,
              revertMessage: 'RECOVER_LOAN_COLLATERAL',
              abortAddress: import.meta.env
                .VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
            },
            types: payload[0],
            values: payload[1],
          },
          signer?.signer!
        );
      } else throw new Error('No provider provided');
    } catch (err) {
      console.log(
        `[ERROR] - [PROTOCOL] - [RECOVER LOAN COLLATERAL] - [LOAN REQUEST ID = ${loanRequestId}] MESSAGE = ${err}`
      );
      if (err instanceof Error) throw err;
      throw new Error(err as string);
    }
  },

  getSupportedAssets: async (
    wallet: Wallet,
    evmProvider?: EIP6963ProviderDetail,
    bitcoinProvider?: any,
    solanaProvider?: any
  ) => {
    try {
      const req: RequestQueueItem = {
        bitcoinProvider,
        evmProvider,
        solanaProvider,
        wallet,
        data: '',
        functionName: 'getSupportedAssets' as ContractFunctionNames,
      };

      // Add to queue and check length
      addToQueue(userCallsQueue, 'supported_assets', req);

      return;
    } catch (error) {
      console.error('Supported Assets call failed', error);
      return null;
    }
  },

  getUserData: async (
    userAddress: string,
    wallet: Wallet,
    evmProvider?: EIP6963ProviderDetail,
    bitcoinProvider?: any,
    solanaProvider?: any
  ) => {
    try {
      const req: RequestQueueItem = {
        bitcoinProvider,
        evmProvider,
        solanaProvider,
        wallet,
        data: userAddress,
        functionName: 'getUserData' as ContractFunctionNames,
      };

      addToQueue(userCallsQueue, `user_data_${userAddress}`, req);

      return;
    } catch (error) {
      console.error('Get User Data call failed', error);
      return null;
    }
  },

  getLoan: async (
    loanId: number,
    wallet: Wallet,
    evmProvider?: EIP6963ProviderDetail,
    bitcoinProvider?: any,
    solanaProvider?: any
  ) => {
    try {
      const req: RequestQueueItem = {
        bitcoinProvider,
        evmProvider,
        solanaProvider,
        wallet,
        data: loanId.toString(),
        functionName: 'getLoan' as ContractFunctionNames,
      };

      addToQueue(userCallsQueue, `loan_${loanId}`, req);

      return;
    } catch (error) {
      console.error('Get Loan call failed', error);
      return null;
    }
  },

  // Direct contract read calls (not queued)
  getSupportedAssetsSync: async () => {
    try {
      const publicClient = createPublicClient({
        chain: zetachain,
        transport: http(import.meta.env.VITE_ZETA_RPC_URL),
      });
      const result = await publicClient.readContract({
        address: import.meta.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
        abi: P2PLendingProtocolABI,
        functionName: 'getSupportedAssets',
      });

      return result;
    } catch (error) {
      console.error('Get Supported Assets Sync call failed', error);
      return null;
    }
  },

  getUserDataSync: async (userAddress: string) => {
    try {
      const publicClient = createPublicClient({
        chain: zetachain,
        transport: http(import.meta.env.VITE_ZETA_RPC_URL),
      });

      const result = await publicClient.readContract({
        address: import.meta.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
        abi: P2PLendingProtocolABI,
        functionName: 'getUserData',
        args: [userAddress],
      });

      return result;
    } catch (error) {
      console.error('Get User Data Sync call failed', error);
      return null;
    }
  },

  getLoanSync: async (loanId: number) => {
    try {
      const publicClient = createPublicClient({
        chain: zetachain,
        transport: http(import.meta.env.VITE_ZETA_RPC_URL),
      });

      const result = await publicClient.readContract({
        address: import.meta.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
        abi: P2PLendingProtocolABI,
        functionName: 'getLoan',
        args: [loanId],
      });

      return result;
    } catch (error) {
      console.error('Get Loan Sync call failed', error);
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
