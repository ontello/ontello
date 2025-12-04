import { Hex, Address } from 'viem';

export enum AccountCallType {
  Direct = 'direct',
  Execute = 'execute',
  // ExecuteBatch = 'executeBatch',
}

export type DirectCallParams = {
  type: AccountCallType.Direct;
  functionName: string;
  args: unknown[];
};

export type ExecuteCallParams = {
  type: AccountCallType.Execute;
  target: Address;
  value?: bigint;
  data: Hex;
};
// export type ExecuteBatchParams = {
//   type: AccountCallType.ExecuteBatch;
//   args: (DirectCallParams | ExecuteCallParams)[];
// };

// export type BuildUserOperationParams = DirectCallParams | ExecuteCallParams | ExecuteBatchParams;
export type BuildUserOperationParams = (DirectCallParams | ExecuteCallParams)[];

export type UserOperation = {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: Hex;
};
export type BuildUserOperationResult = {
  userOp: UserOperation;
  userOpHash: Hex;
};

export type UserOperationReceipt = {
  userOpHash: Hex;
  sender: Address;
  paymaster: Address;
  nonce: bigint;
  success: boolean;
  actualGasCost: bigint;
  actualGasUsed: bigint;
  from: Address;
  receipt: {
    blockHash: Hex;
    blockNumber: Hex;
    from: Address;
    cumulativeGasUsed: Hex;
    gasUsed: Hex;
    transactionHash: Hex;
    transactionIndex: Hex;
    logs: any[];
    logsBloom: string;
    effectiveGasPrice: Hex;
  };
};

export type GasToken = {
  token_name: string;
  token_hash: string;
  token_type: string;
  decimals: number;
  currency_price: string;
  icon: string;
  exchange_rate: string;
};

export enum ReplayOperation {
  AddOwnerAddress = 'addOwnerAddress',
  RemoveOwner = 'removeOwner',
  AddOwnerPublicKey = 'addOwnerPublicKey',
}

export type GasData = {
  callGasLimit: BigInt;
  verificationGasLimit: BigInt;
  preVerificationGas: BigInt;
  maxFeePerGas: BigInt;
  maxPriorityFeePerGas: BigInt;
};
