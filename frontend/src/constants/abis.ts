import {
  type ExtractAbiFunctionNames,
  type ExtractAbiFunctions,
  narrow,
} from 'abitype';
import type { AbiItem } from 'viem';

import P2PLendingProtocolABI from './P2PLendingProtocol.abi.json';

export const abi = narrow(P2PLendingProtocolABI as AbiItem[]);

export type ContractFunctions = ExtractAbiFunctions<typeof abi>;
export type PayableContractFunctionNames = ExtractAbiFunctionNames<typeof abi>;
export type ContractFunctionNames = ExtractAbiFunctionNames<typeof abi>;