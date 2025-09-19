import {
  Hex,
  Address,
  toHex,
  getContract,
  encodeFunctionData,
  encodeAbiParameters,
  maxUint256,
  bytesToBigInt,
} from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { EntryPointAbi, Erc20Abi, AccountAbi, AccountFactoryAbi } from '@src/app/static/abis';
import { fromBase64Url, registerWithPasskey, signMessageWithPasskey } from '../../utils/passkey';
import { useWeb3PublicClient } from './useWeb3Client';
import {
  AccountCallType,
  BuildUserOperationParams,
  BuildUserOperationResult,
  UserOperation,
} from './types';
import { calculateGasFees, calculateUserOpHash } from '../../utils/web3';
import cons from '../../../client/state/cons';
import { useBundler } from './useBundler';
import { usePaymaster } from './usePaymaster';

function formatUserOpStruct(struct: UserOperation) {
  const output = `{
            sender: ${struct.sender},
            nonce : ${struct.nonce},
            initCode : hex"${struct.initCode.slice(2)}",
            callData : hex"${struct.callData.slice(2)}",
            callGasLimit : ${struct.callGasLimit},
            verificationGasLimit : ${struct.verificationGasLimit},
            preVerificationGas : ${struct.preVerificationGas},
            maxFeePerGas : ${struct.maxFeePerGas},
            maxPriorityFeePerGas : ${struct.maxPriorityFeePerGas},
            paymasterAndData : hex"${struct.paymasterAndData.slice(2)}",
            signature : hex"${struct.signature.slice(2)}"
        }`;

  console.log(output);
}

// TODO
const MAIN_NETWORK_GAS_ADDRESS = '0xd878dfE2b33A07E7FB290c1578A0b3cbc8aDadEA';

export const useAbstractAccount = (aaAddress: Address, chainId?: number) => {
  const { publicClient: ethClient, chainConfig } = useWeb3PublicClient(chainId);
  const { estimateUserOperationGas, sendUserOperation, getUserOperationReceipt } = useBundler(
    chainConfig.chainId
  );
  const { getPaymasterSign } = usePaymaster(chainConfig.chainId);

  const passKeyAccountContract = getContract({
    address: aaAddress,
    abi: AccountAbi,
    client: ethClient,
  });
  const isAccountDeployed = async (): Promise<boolean> => {
    try {
      const bytecode = await ethClient.getCode({
        address: aaAddress,
      });
      return bytecode !== undefined && bytecode !== '0x';
    } catch (error) {
      console.error('Check deployment failed:', error);
      return false;
    }
  };

  const buildInitCode = async (): Promise<Hex> => {
    if (await isAccountDeployed()) {
      return '0x' as Hex;
    }

    const publicKeyBase64 = localStorage.getItem(cons.secretKey.PUBLIC_KEY);
    if (!publicKeyBase64) {
      throw new Error('Public key not found in local storage');
    }
    const xy = fromBase64Url(publicKeyBase64);
    const xyHex = toHex(new Uint8Array(xy));

    const encodedData = encodeFunctionData({
      abi: AccountFactoryAbi,
      functionName: 'createAccount',
      args: [[xyHex], BigInt(0)],
    });

    return `${chainConfig.accountFactoryAddr as Address}${encodedData.slice(2)}` as Hex;
  };

  const getKeyIndexThroughAddress = async (ownerAddress: Address): Promise<bigint> => {
    const keyIndex = (await passKeyAccountContract.read.indexOfOwnerAddress([
      ownerAddress,
    ])) as bigint;
    return keyIndex;
  };
  const getKeyIndexThroughXy = async (x: Hex, y: Hex): Promise<bigint> => {
    const keyIndex = (await passKeyAccountContract.read.indexOfOwnerPublicKey([x, y])) as bigint;
    return keyIndex;
  };

  const getCurrentKeyIndex = async () => {
    const publicKeyBase64 = localStorage.getItem(cons.secretKey.PUBLIC_KEY);
    if (!publicKeyBase64) {
      throw new Error('Public key not found in local storage');
    }
    const xy = fromBase64Url(publicKeyBase64);
    try {
      const keyIndex = await getKeyIndexThroughXy(
        toHex(new Uint8Array(xy.slice(0, 32))),
        toHex(new Uint8Array(xy.slice(32)))
      );
      return keyIndex;
    } catch (error) {
      return BigInt(0);
    }
  };

  //
  const buildCallData = async (
    operations: BuildUserOperationParams,
    gasAddress: Address = MAIN_NETWORK_GAS_ADDRESS
  ): Promise<Hex> => {
    const allowance = await ethClient.readContract({
      address: gasAddress,
      abi: Erc20Abi,
      functionName: 'allowance',
      args: [aaAddress, chainConfig.paymasterAddr as Address],
    });

    if (allowance === BigInt(0)) {
      operations.unshift({
        type: AccountCallType.Execute,
        target: gasAddress,
        data: encodeFunctionData({
          abi: Erc20Abi,
          functionName: 'approve',
          args: [chainConfig.paymasterAddr as Address, maxUint256],
        }),
      });
    }

    const calls = operations.map((arg) => {
      if (arg.type === AccountCallType.Direct) {
        const callData = encodeFunctionData({
          abi: AccountAbi,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          functionName: arg.functionName as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          args: arg.args as any,
        });
        return {
          target: aaAddress,
          value: BigInt(0),
          data: callData,
        };
      }
      return {
        target: arg.target,
        value: arg.value ?? BigInt(0),
        data: arg.data,
      };
    });

    return encodeFunctionData({
      abi: AccountAbi,
      functionName: 'executeBatch',
      args: [calls],
    });
  };

  const buildUserOperation = async (
    callData: Hex,
    keyIndex: bigint,
    signMessageFunc?: (message: Hex) => Promise<Hex>,
    gasAddress: Address = MAIN_NETWORK_GAS_ADDRESS
  ): Promise<BuildUserOperationResult> => {
    try {
      let nonce = BigInt(0);
      try {
        nonce = await passKeyAccountContract.read.getNonce();
      } catch (error) {
        // console.error('getNonce failed, use 0 as nonce:', error);
      }
      console.log('nonce', nonce);

      const initCode = await buildInitCode();

      const feeData = await calculateGasFees(ethClient);

      const userOp = {
        sender: aaAddress,
        nonce,
        initCode,
        callData,
        callGasLimit: BigInt(50000),
        verificationGasLimit: BigInt(500_000),
        preVerificationGas: BigInt(200_000),
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        paymasterAndData: '0x' as Hex,
        signature:
          '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000260000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000017000000000000000000000000000000000000000000000000000000000000000168bd76d24faae41e9b10fa547c74f6d82ef3baf9ecfb18f828abb0fc13888b5bff4aa483155037396e6ca63771f0cba4585cb91a08d6492325d7f61518508eaf000000000000000000000000000000000000000000000000000000000000002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f37b2274797065223a22176562617574686e2e676574222c226368616c6c656e6765223a224b33624e59524e524f767432776b4f5449376f6d7153384a56794e5431536d544c56646d68586d6d357851222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303830222c2263726f73734f726967696e223a66616c73652c226f746865725f6b6579735f63616e5f62655f61646465645f68657265223a22646f206e6f7420636f6d7061726520636c69656e74446174614a534f4e20616761696e737420612074656d706c6174652e205365652068747470733a2f2f676f6f2e666c2f796162506577227d00000000000000000000000000' as Hex, // init
      };

      const paymasterAndData = await getPaymasterSign(userOp, gasAddress);
      userOp.paymasterAndData = paymasterAndData;

      const estimatedGas = await estimateUserOperationGas(userOp);
      userOp.preVerificationGas = BigInt(estimatedGas.preVerificationGas);
      userOp.verificationGasLimit = chainConfig.supportPassKeySign
        ? BigInt(estimatedGas.verificationGasLimit)
        : BigInt(estimatedGas.verificationGasLimit) * BigInt(10);
      userOp.callGasLimit = BigInt(estimatedGas.callGasLimit);

      const paymasterAndData2 = await getPaymasterSign(userOp, gasAddress);
      userOp.paymasterAndData = paymasterAndData2;

      const userOpHash = await calculateUserOpHash(
        ethClient,
        userOp,
        chainConfig.entrypointAddr as Address
      );

      // const validatePaymasterAndData = await ethClient.readContract({
      //   address: chainConfig.paymasterAddr as Address,
      //   abi: PaymasterAbi,
      //   functionName: 'validatePaymasterUserOp' as any,
      //   args: [userOp, userOpHash, BigInt(0)] as any,
      //   account: chainConfig.entrypointAddr as Address,
      // });
      // console.log('validatePaymasterAndData:', validatePaymasterAndData);

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

      console.log('signature:', signature);
      console.log('keyIndex', keyIndex);

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

      userOp.signature = signatureWrapper;

      // const valid = await verifyMessage({
      //   address: '0xf8c3Abaa5dd97A7Edb5D827938AF1bb15DFB2EA1',
      //   message: { raw: userOpHash },
      //   signature,
      // });
      // console.log('valid', valid);
      // const signAddress = await recoverMessageAddress({
      //   message: { raw: userOpHash },
      //   signature,
      // });
      // console.log('signAddress', signAddress);

      // console.log('userOp', userOp);
      formatUserOpStruct(userOp);
      // console.log('userOpHash', userOpHash);

      const validateUserOp = await ethClient.readContract({
        address: aaAddress,
        abi: AccountAbi,
        functionName: 'validateUserOp' as any,
        args: [userOp, userOpHash, BigInt(0)] as any,
        account: chainConfig.entrypointAddr as Address,
      });
      console.log('validateUserOp:', validateUserOp);

      return {
        userOp,
        userOpHash,
      };
    } catch (error) {
      console.error('build UserOperation failed:', error);
      throw error;
    }
  };

  const addOwnerByAddress = async (ownerAddress: Address) => {
    const keyIndex = await getCurrentKeyIndex();

    const callData = await buildCallData([
      {
        type: AccountCallType.Direct,
        functionName: 'addOwnerAddress',
        args: [ownerAddress],
      },
    ]);

    const { userOp, userOpHash } = await buildUserOperation(callData, keyIndex);

    const res = await sendUserOperation(userOp);
    const receipt = await getUserOperationReceipt(userOpHash);
    return receipt;
  };

  const recoveryAccount = async (mnemonic: string, username: string) => {
    const mnemonicAccount = mnemonicToAccount(mnemonic);
    console.log('mnemonicAccount.address', mnemonicAccount.address);
    const { x, y } = await registerWithPasskey(username);
    const keyIndex = await getKeyIndexThroughAddress(mnemonicAccount.address);

    const callData = await buildCallData([
      {
        type: AccountCallType.Direct,
        functionName: 'addOwnerPublicKey',
        args: [toHex(new Uint8Array(x)), toHex(new Uint8Array(y))],
      },
    ]);

    const { userOp, userOpHash } = await buildUserOperation(callData, keyIndex, (message) =>
      mnemonicAccount.signMessage({ message: { raw: message } })
    );

    await sendUserOperation(userOp);
    const receipt = await getUserOperationReceipt(userOpHash);
    return receipt;
  };

  const removeOwner = async (targetPublicKeyBase64: string) => {
    const keyIndex = await getCurrentKeyIndex();

    const xy = fromBase64Url(targetPublicKeyBase64);
    const xyHex = toHex(new Uint8Array(xy));

    const targetKeyIndex = (await passKeyAccountContract.read.indexOfOwnerBytes([xyHex])) as bigint;

    const callData = await buildCallData([
      {
        type: AccountCallType.Direct,
        functionName: 'removeOwnerAtIndex',
        args: [targetKeyIndex, xyHex],
      },
    ]);
    const { userOp, userOpHash } = await buildUserOperation(callData, keyIndex);
    await sendUserOperation(userOp);
    const receipt = await getUserOperationReceipt(userOpHash);
    return receipt;
  };

  const transfer = async (
    to: Address,
    amount: bigint,
    gasAddress: Address,
    tokenAddress?: Address
  ) => {
    const keyIndex = await getCurrentKeyIndex();

    let operations: BuildUserOperationParams;

    if (tokenAddress) {
      operations = [
        {
          type: AccountCallType.Execute,
          target: tokenAddress,
          data: encodeFunctionData({
            abi: Erc20Abi,
            functionName: 'transfer',
            args: [to, amount],
          }),
        },
      ];
    } else {
      operations = [
        {
          type: AccountCallType.Execute,
          target: to,
          value: amount,
          data: '0x' as Hex,
        },
      ];
    }

    const callData = await buildCallData(operations, gasAddress);
    const { userOp, userOpHash } = await buildUserOperation(
      callData,
      keyIndex,
      undefined,
      gasAddress
    );

    await sendUserOperation(userOp);
    const receipt = await getUserOperationReceipt(userOpHash);
    return receipt;
  };
  const estimateTransfer = async (
    to: Address,
    amount: bigint,
    gasAddress: Address,
    tokenAddress?: Address
  ) => {
    try {
      let operations: BuildUserOperationParams;

      if (tokenAddress) {
        operations = [
          {
            type: AccountCallType.Execute,
            target: tokenAddress,
            data: encodeFunctionData({
              abi: Erc20Abi,
              functionName: 'transfer',
              args: [to, amount],
            }),
          },
        ];
      } else {
        operations = [
          {
            type: AccountCallType.Execute,
            target: to,
            value: amount,
            data: '0x' as Hex,
          },
        ];
      }

      const callData = await buildCallData(operations, gasAddress);
      const feeData = await calculateGasFees(ethClient);

      // const nonce = (await passKeyAccountContract.read.getNonce()) as bigint;
      let nonce = BigInt(0);
      try {
        nonce = await passKeyAccountContract.read.getNonce();
      } catch (error) {
        //
      }

      const initCode = await buildInitCode();

      const userOp = {
        sender: aaAddress,
        nonce,
        initCode,
        callData,
        callGasLimit: BigInt(21000),
        verificationGasLimit: BigInt(500_000),
        preVerificationGas: BigInt(200_000),
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        paymasterAndData: '0x' as Hex,
        signature:
          '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000260000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000017000000000000000000000000000000000000000000000000000000000000000168bd76d24faae41e9b10fa547c74f6d82ef3baf9ecfb18f828abb0fc13888b5bff4aa483155037396e6ca63771f0cba4585cb91a08d6492325d7f61518508eaf000000000000000000000000000000000000000000000000000000000000002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f37b2274797065223a22176562617574686e2e676574222c226368616c6c656e6765223a224b33624e59524e524f767432776b4f5449376f6d7153384a56794e5431536d544c56646d68586d6d357851222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303830222c2263726f73734f726967696e223a66616c73652c226f746865725f6b6579735f63616e5f62655f61646465645f68657265223a22646f206e6f7420636f6d7061726520636c69656e74446174614a534f4e20616761696e737420612074656d706c6174652e205365652068747470733a2f2f676f6f2e666c2f796162506577227d00000000000000000000000000' as Hex,
      };

      const paymasterAndData = await getPaymasterSign(userOp, gasAddress);
      userOp.paymasterAndData = paymasterAndData;

      const estimatedGas = await estimateUserOperationGas(userOp);
      const actualCallGasLimit = BigInt(estimatedGas.callGasLimit);
      const actualVerificationGasLimit = chainConfig.supportPassKeySign
        ? BigInt(estimatedGas.verificationGasLimit)
        : BigInt(estimatedGas.verificationGasLimit) * BigInt(10);
      const actualPreVerificationGas = BigInt(estimatedGas.preVerificationGas);

      const totalGasLimit =
        actualCallGasLimit + actualVerificationGasLimit + actualPreVerificationGas;

      const block = await ethClient.getBlock();
      const baseFee = block.baseFeePerGas ?? BigInt(0);
      const effectiveGasPrice = baseFee + feeData.maxPriorityFeePerGas;
      const estimatedEthFee =
        totalGasLimit *
        (effectiveGasPrice < feeData.maxFeePerGas ? effectiveGasPrice : feeData.maxFeePerGas);

      const maxEthFee = totalGasLimit * feeData.maxFeePerGas;

      return {
        estimatedEthFee,
        maxEthFee,
      };
    } catch (error) {
      console.error('estimateTransfer failed:', error);
      throw error;
    }
  };

  return {
    buildCallData,
    buildUserOperation,
    getKeyIndexThroughAddress,
    getKeyIndexThroughXy,
    getCurrentKeyIndex,
    recoveryAccount,
    removeOwner,
    addOwnerByAddress,
    transfer,
    estimateTransfer,
    isAccountDeployed,
  };
};
