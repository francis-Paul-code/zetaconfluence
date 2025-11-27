import {
  createPublicClient,
  http,
  parseEther,
  toHex,
  type TransactionReceipt,
  type WalletClient,
  zeroAddress,
} from 'viem'

import { EVM_GATEWAY_ABI } from './abis'

type address = `0x${string}`;
async function waitFor3Confirm({
  client,
  hash,
}: {
  client: WalletClient
  hash: address
}): Promise<TransactionReceipt> {
  const publicClient = createPublicClient({
    chain: client.chain!,
    transport: http(),
  })

  return await publicClient.waitForTransactionReceipt({
    hash,
    confirmations: 3,
  })
}

export async function depositAndCall({
  client,
  gateway,
  payload,
  etherAmount,
}: {
  client: WalletClient
  gateway: address
  payload: address | Uint8Array
  etherAmount: string
}) {
  const payloadHex = typeof payload === 'string' ? payload : toHex(payload)

  const hash = await client.writeContract({
    address: gateway,
    abi: EVM_GATEWAY_ABI,
    functionName: 'depositAndCall',
    args: [
      process.env.NEXT_PUBLIC_LENDING_POOL as address,
      payloadHex,
      {
        revertAddress: client.account?.address as address,
        callOnRevert: true,
        abortAddress: zeroAddress,
        revertMessage: toHex('Revert'),
        onRevertGasLimit: BigInt(100000000),
      },
    ],
    value: parseEther(etherAmount),
  })

  return await waitFor3Confirm({ client, hash })
}

export async function gatewayCall({
  client,
  gateway,
  payload,
}: {
  client: WalletClient
  gateway: address
  payload: address | Uint8Array
}) {
  const payloadHex = typeof payload === 'string' ? payload : toHex(payload)

  const hash = await client.writeContract({
    address: gateway,
    abi: EVM_GATEWAY_ABI,
    functionName: 'call',
    args: [
      process.env.NEXT_PUBLIC_LENDING_POOL as address,
      payloadHex,
      {
        revertAddress: client.account?.address as address,
        callOnRevert: false,
        abortAddress: zeroAddress,
        revertMessage: '0x',
        onRevertGasLimit: BigInt(200000),
      },
    ],
  })

  return await waitFor3Confirm({ client, hash })
}