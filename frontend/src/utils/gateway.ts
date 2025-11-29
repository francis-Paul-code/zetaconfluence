import { evmCall, evmDepositAndCall } from '@zetachain/toolkit/chains/evm';
// import {
//   solanaCall,
//   solanaDepositAndCall,
// } from '@zetachain/toolkit/chains/solana';
// import { type PrimaryWallet } from '@zetachain/wallet';
// import { getSolanaWalletAdapter } from '@zetachain/wallet/solana';
import type { ethers } from 'ethers';

interface CallParams {
  receiver: string;
  types: string[];
  values: (string | bigint | boolean)[];
  revertOptions: {
    callOnRevert: boolean;
    revertAddress?: string;
    revertMessage: string;
    abortAddress?: string;
    onRevertGasLimit?: string | number | bigint;
  };
}
interface depositAndCallParams {
  values: (string | bigint | boolean)[];
  receiver: string;
  revertOptions: {
    callOnRevert: boolean;
    revertMessage: string;
    revertAddress?: string | undefined;
    abortAddress?: string | undefined;
    onRevertGasLimit?: string | number | bigint | undefined;
  };
  amount: string;
  types: string[];
  token?: string | undefined;
}

export default {
  evm: {
    gatewayCall: async function (
      callParams: CallParams,
      signer: ethers.AbstractSigner
    ) {
      try {
        const evmCallOptions = {
          signer,
          gateway: import.meta.env.VITE_EVM_GATEWAY_ADDRESS,
          txOptions: {
            gasLimit: 1000000,
          },
        };

        const result = await evmCall(callParams, evmCallOptions);

        await result.wait();
        return result;
      } catch (error) {
        console.error('Error in gatewayEVMCall:', error);
        throw error;
      }
    },

    depositAndCall: async function (
      callParams: depositAndCallParams,
      signer: ethers.AbstractSigner
    ) {
      try {
        const evmCallOptions = {
          signer,
          gateway:import.meta.env.VITE_EVM_GATEWAY_ADDRESS,
          txOptions: {
            gasLimit: 1000000,
          },
        };

        const result = await evmDepositAndCall(callParams, evmCallOptions);

        await result.wait();
        return result;
      } catch (error) {
        console.error('Error in gatewayEVMDepositAndCall:', error);
        throw error;
      }
    },
  },

  // solana: {
  //   gatewayCall: async function (
  //     callParams: CallParams,
  //     primaryWallet: PrimaryWallet,
  //     chainId: string
  //   ) {
  //     try {
  //       const walletAdapter = await getSolanaWalletAdapter(primaryWallet);

  //       const solanaCallOptions = {
  //         gateway: process.env.VITE_SOL_GATEWAY_ADDRESS,
  //         signer: walletAdapter,
  //         chainId,
  //       };

  //       const result = await solanaCall(callParams, solanaCallOptions);
  //       return result;
  //     } catch (error) {
  //       console.error('Error in gatewaySOLCall:', error);
  //       throw error;
  //     }
  //   },
  //   depositAndCall: async function (
  //     callParams: depositAndCallParams,
  //     primaryWallet: PrimaryWallet,
  //     chainId: string
  //   ) {
  //     try {
  //       const walletAdapter = await getSolanaWalletAdapter(primaryWallet);

  //       const solanaCallOptions = {
  //         gateway: process.env.VITE_SOL_GATEWAY_ADDRESS,
  //         signer: walletAdapter,
  //         chainId,
  //       };

  //       const result = await solanaDepositAndCall(
  //         callParams,
  //         solanaCallOptions
  //       );
  //       return result;
  //     } catch (error) {
  //       console.error('Error in gatewaySOLDepositAndCall:', error);
  //       throw error;
  //     }
  //   },
  // },

  btc: {},
};
