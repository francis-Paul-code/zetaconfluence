/* eslint-disable @typescript-eslint/no-unused-vars */
import { type Abi, createPublicClient, http, type WalletClient } from 'viem';
import { mainnet, zetachain, zetachainAthensTestnet } from 'viem/chains';

import { abi as PROTOCOL_ABI } from '../constants/abis';

export type HexAddr = `0x${string}`;

const currentChain = zetachainAthensTestnet;
type ReadArgs = {
  rpcUrl?: string;
  address?: HexAddr;
  abi?: Abi;
  functionName: string;
  args?: readonly unknown[];
};

type WriteArgs = {
  rpcUrl?: string;
  signer: WalletClient;
  address?: HexAddr;
  abi?: Abi;
  functionName: string;
  args?: readonly unknown[];
  waitForReceipt?: boolean;
};

/**
 * Read a contract function on ZetaChain.
 */
export const readContract = async <T = unknown>({
  rpcUrl = process.env.VITE_ZETA_RPC || '',
  address = process.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
  abi = PROTOCOL_ABI as Abi,
  functionName,
  args = [],
}: ReadArgs): Promise<T> => {
  const client = createPublicClient({ transport: http(rpcUrl) });
  return client.readContract({
    address,
    abi,
    functionName,
    args,
  }) as Promise<T>;
};

/**
 * Write (send tx) to a contract function on ZetaChain.
 * Pass a viem WalletClient as `signer` (already configured with account & chain).
 */
export const writeContract = async ({
  rpcUrl = process.env.VITE_ZETA_RPC_URL || '',
  signer,
  address = process.env.VITE_P2P_LENDING_PROTOCOL_ADDRESS as HexAddr,
  abi = PROTOCOL_ABI as Abi,
  functionName,
  args = [],
  waitForReceipt = true,
}: WriteArgs) => {
  const hash = await signer.writeContract({
    abi,
    address,
    functionName,
    args,
    account: signer.account!,
    chain: currentChain,
  });

  if (!waitForReceipt) return { hash };

  const publicClient = createPublicClient({ transport: http(rpcUrl) });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { hash, receipt };
};
