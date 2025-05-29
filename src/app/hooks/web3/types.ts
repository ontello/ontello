import { Hex, Address } from 'viem';

export enum AccountCallType {
  Direct = 'direct',
  Execute = 'execute',
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

export type BuildUserOperationParams = DirectCallParams | ExecuteCallParams;

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
  userOpHash: string;
};
