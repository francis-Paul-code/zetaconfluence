import { narrow } from 'abitype';
import type { AbiItem } from 'viem';

import MainnetGatewayEVM from './abis/MainnetGatewayEVM.json';
import MainnetGatewayZEVM from './abis/MainnetGatewayZEVM.json';

export const EVM_GATEWAY_ABI = narrow(MainnetGatewayEVM as AbiItem[]);
export const ZEVM_GATEWAY_ABI = narrow(MainnetGatewayZEVM as AbiItem[]);
