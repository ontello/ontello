import {
  Address,
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
  Hex,
  PublicClient,
  toHex,
  getContract,
  bytesToBigInt,
} from 'viem';
import { UserOperation } from '../hooks/web3/types';
import { EntryPointAbi } from '../static/abis';
import { signMessageWithPasskey } from './passkey';

export const calculateUserOpHash = async (
  ethClient: PublicClient,
  userop: UserOperation,
  entryPoint: Address
): Promise<Hex> => {
  // const chainId = await ethClient.getChainId();
  // const packed = encodeAbiParameters(
  //   parseAbiParameters(
  //     'address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32'
  //   ),
  //   [
  //     userop.sender,
  //     userop.nonce,
  //     keccak256(userop.initCode),
  //     keccak256(userop.callData),
  //     userop.callGasLimit,
  //     userop.verificationGasLimit,
  //     userop.preVerificationGas,
  //     userop.maxFeePerGas,
  //     userop.maxPriorityFeePerGas,
  //     keccak256(userop.paymasterAndData),
  //   ]
  // );
  // const enc = encodeAbiParameters(parseAbiParameters('bytes32, address, uint256'), [
  //   keccak256(packed),
  //   entryPoint,
  //   BigInt(chainId),
  // ]);
  // const hash = keccak256(enc);
  const entryPointContract = getContract({
    address: entryPoint,
    abi: EntryPointAbi,
    client: ethClient,
  });
  const hash = await entryPointContract.read.getUserOpHash([userop]);

  return hash;
};

export const getUserOpSignature = async (
  userOpHash: Hex,
  keyIndex: bigint,
  signMessageFunc?: (message: Hex) => Promise<Hex>
): Promise<Hex> => {
  let signature;
  if (signMessageFunc) {
    signature = await signMessageFunc(userOpHash);
  } else {
    const passkeySignature = await signMessageWithPasskey(userOpHash);
    signature = encodeAbiParameters(
      [
        {
          components: [
            { type: 'bytes', name: 'authenticatorData' },
            { type: 'bytes', name: 'clientDataJSON' },
            { type: 'uint256', name: 'challengeIndex' },
            { type: 'uint256', name: 'typeIndex' },
            { type: 'uint256', name: 'r' },
            { type: 'uint256', name: 's' },
          ],
          type: 'tuple',
        },
      ],
      [
        {
          authenticatorData: toHex(new Uint8Array(passkeySignature.authenticatorData)),
          clientDataJSON: toHex(new Uint8Array(passkeySignature.clientDataJSON)),
          challengeIndex: BigInt(passkeySignature.challengeIndex),
          typeIndex: BigInt(passkeySignature.typeIndex),
          r: bytesToBigInt(passkeySignature.r),
          s: bytesToBigInt(passkeySignature.s),
        },
      ]
    ) as Hex;
  }

  const signatureWrapper = encodeAbiParameters(
    [
      {
        components: [
          { type: 'uint256', name: 'keyIndex' },
          { type: 'bytes', name: 'signature' },
        ],
        type: 'tuple',
      },
    ],
    [{ keyIndex, signature }]
  );
  return signatureWrapper;
};

export const bigIntSerializerToString = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};
export const bigIntSerializerToHex = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return toHex(value);
  }
  return value;
};

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
    ethClient.getGasPrice(),
  ]);
  const baseFee = block.baseFeePerGas ?? BigInt(0);
  const priorityFee = estimatedPriorityFee ?? fallbackPriorityFee;

  const maxFeePerGas = baseFee * multiplier + priorityFee;

  return {
    maxFeePerGas,
    maxPriorityFeePerGas: priorityFee,
  };
};

export function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, serializeBigInt(v)]));
  }

  return obj;
}
