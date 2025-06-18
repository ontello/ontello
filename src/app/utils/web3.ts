import {
  Address,
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
  Hex,
  PublicClient,
  toHex,
  getContract,
} from 'viem';
import { UserOperation } from '../hooks/web3/types';
import { EntryPointAbi } from '../static/abis';

export const calculateUserOpHash = async (
  ethClient: PublicClient,
  userop: UserOperation,
  entryPoint: Address,
  chainId: number
): Promise<Hex> => {
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
  const hash = keccak256(enc);
  // console.log('111111', hash);

  // const entryPointContract = getContract({
  //   address: entryPoint,
  //   abi: EntryPointAbi,
  //   client: ethClient,
  // });
  // const hash2 = await entryPointContract.read.getUserOpHash([userop]);
  // console.log('111112', hash2);

  return hash;
};

export const bigIntSerializer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};
export const serializerToHex = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return toHex(value);
  }
  return value;
};

export const calculateCallGasLimit = async (
  ethClient: PublicClient,
  entryPoint: Address,
  address: Address,
  data: Hex
): Promise<bigint> => {
  const baseEstimate = await ethClient.estimateGas({
    account: entryPoint,
    to: address,
    data,
    value: BigInt(0),
  });

  return (baseEstimate * BigInt(120)) / BigInt(100);
};

// export const calculatePreVerificationGas = (callData: Hex): bigint => {
//   const baseCost = BigInt(21000);

//   const calldataLength = BigInt((callData.length - 2) / 2); // 去掉 '0x'
//   const calldataZeros = BigInt(callData.split('00').length - 1);
//   const calldataNonZeros = calldataLength - calldataZeros;

//   const calldataGas = calldataZeros * BigInt(4) + calldataNonZeros * BigInt(16);

//   const bundlerGas = BigInt(50000);

//   const total = baseCost + calldataGas + bundlerGas;

//   return (total * BigInt(120)) / BigInt(100);
// };

export const calculateGasFees = async (
  ethClient: PublicClient,
  {
    multiplier = BigInt(2),
    fallbackPriorityFee = BigInt(2) * BigInt(10) ** BigInt(9), // 2 Gwei
  } = {}
): Promise<{
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}> => {
  const [block, estimatedPriorityFee] = await Promise.all([
    ethClient.getBlock(),
    ethClient.estimateMaxPriorityFeePerGas().catch(() => fallbackPriorityFee),
  ]);
  console.log('block', block);
  console.log('estimatedPriorityFee', estimatedPriorityFee);

  const baseFee = block.baseFeePerGas ?? BigInt(0);
  const priorityFee = estimatedPriorityFee ?? fallbackPriorityFee;

  const maxFeePerGas = baseFee * multiplier + priorityFee;

  return {
    maxFeePerGas,
    maxPriorityFeePerGas: priorityFee,
  };
};
