import { Address, encodeAbiParameters, parseAbiParameters, keccak256, Hex } from 'viem';
import { UserOperation } from '../hooks/web3/types';

export const calculateUserOpHash = (
  userop: UserOperation,
  entryPoint: Address,
  chainId: number
): Hex => {
  const packed = encodeAbiParameters(
    parseAbiParameters(
      'address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32'
    ),
    [
      userop.sender,
      userop.nonce,
      keccak256(userop.initCode),
      keccak256(userop.callData),
      userop.callGasLimit,
      userop.verificationGasLimit,
      userop.preVerificationGas,
      userop.maxFeePerGas,
      userop.maxPriorityFeePerGas,
      keccak256(userop.paymasterAndData),
    ]
  );

  const enc = encodeAbiParameters(parseAbiParameters('bytes32, address, uint256'), [
    keccak256(packed),
    entryPoint,
    BigInt(chainId),
  ]);

  return keccak256(enc);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const bigIntSerializer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};
