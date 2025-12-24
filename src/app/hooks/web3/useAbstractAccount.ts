import { useMemo } from 'react';
import {
  Hex,
  Address,
  type SignableMessage,
  type TypedData,
  type TypedDataDefinition,
  concatHex,
  createWalletClient,
  http,
  toHex,
  getContract,
  encodeFunctionData,
  encodeAbiParameters,
  maxUint256,
  bytesToBigInt,
  hashMessage,
  hashTypedData,
  keccak256,
} from 'viem';
import { mnemonicToAccount, toAccount } from 'viem/accounts';
import { EntryPointAbi, Erc20Abi, AccountAbi, AccountFactoryAbi } from '@src/app/static/abis';
import { fromBase64Url, registerWithPasskey, signMessageWithPasskey } from '../../utils/passkey';
import { useWeb3Client } from './useWeb3Client';
import {
  AccountCallType,
  BuildUserOperationParams,
  BuildUserOperationResult,
  GasData,
  ReplayOperation,
  UserOperation,
} from './types';
import {
  calculateGasFees,
  calculateUserOpHash,
  formatUserOpStruct,
  getUserOpSignature,
  serializeBigInt,
} from '../../utils/web3';
import { getAuthExtras } from '../../state/authExtras';
import { useBundler } from './useBundler';
import { usePaymaster } from './usePaymaster';
import { useChainConfig } from './useChainConfig';

const INIT_SIGNATURE =
  '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000260000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000017000000000000000000000000000000000000000000000000000000000000000168bd76d24faae41e9b10fa547c74f6d82ef3baf9ecfb18f828abb0fc13888b5bff4aa483155037396e6ca63771f0cba4585cb91a08d6492325d7f61518508eaf000000000000000000000000000000000000000000000000000000000000002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f37b2274797065223a22176562617574686e2e676574222c226368616c6c656e6765223a224b33624e59524e524f767432776b4f5449376f6d7153384a56794e5431536d544c56646d68586d6d357851222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a38303830222c2263726f73734f726967696e223a66616c73652c226f746865725f6b6579735f63616e5f62655f61646465645f68657265223a22646f206e6f7420636f6d7061726520636c69656e74446174614a534f4e20616761696e737420612074656d706c6174652e205365652068747470733a2f2f676f6f2e666c2f796162506577227d00000000000000000000000000' as Hex;
const MESSAGE_TYPEHASH = keccak256(toHex('OntelloSmartWalletMessage(bytes32 hash)'));

export const useAbstractAccount = (aaAddress: Address, chainId?: number) => {
  const { getWeb3PublicClient } = useWeb3Client();
  const { publicClient: ethClient, chainConfig } = getWeb3PublicClient(chainId);
  const { estimateUserOperationGas, sendUserOperation, getUserOperationReceipt } = useBundler(
    chainConfig.chainId
  );
  const { getPaymasterSign } = usePaymaster(chainConfig.chainId);

  const passKeyAccountContract = useMemo(
    () =>
      getContract({
        address: aaAddress,
        abi: AccountAbi,
        client: ethClient,
      }),
    [aaAddress, ethClient]
  );

  const entryPointContract = useMemo(
    () =>
      getContract({
        address: chainConfig.entrypointAddr as Address,
        abi: EntryPointAbi,
        client: ethClient,
      }),
    [chainConfig.entrypointAddr, ethClient]
  );

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

    const { publicKey: publicKeyBase64 } = getAuthExtras();
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
    const { publicKey: publicKeyBase64 } = getAuthExtras();
    if (!publicKeyBase64) {
      throw new Error('Public key not found in local storage');
    }
    const xy = fromBase64Url(publicKeyBase64);
    const keyIndex = await getKeyIndexThroughXy(
      toHex(new Uint8Array(xy.slice(0, 32))),
      toHex(new Uint8Array(xy.slice(32)))
    );
    return keyIndex;
  };

  //
  const buildCallData = async (
    operations: BuildUserOperationParams,
    gasAddress?: Address
  ): Promise<Hex> => {
    if (gasAddress) {
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
    gasAddress?: Address //
  ): Promise<BuildUserOperationResult> => {
    try {
      const nonce = await entryPointContract.read.getNonce([aaAddress, BigInt(0)]);
      console.log('nonce', nonce);

      const initCode = await buildInitCode();

      const feeData = await calculateGasFees(ethClient);

      const userOp = {
        sender: aaAddress,
        nonce,
        initCode,
        callData,
        callGasLimit: BigInt(21000),
        verificationGasLimit: BigInt(100_000),
        preVerificationGas: BigInt(62_000),
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: BigInt(0),
        paymasterAndData: '0x' as Hex,
        signature: INIT_SIGNATURE,
      };
      if (gasAddress) {
        const paymasterAndData = await getPaymasterSign(userOp, gasAddress);
        userOp.paymasterAndData = paymasterAndData;
      }
      // formatUserOpStruct(userOp);
      const estimatedGas = await estimateUserOperationGas(userOp);
      // userOp.preVerificationGas = BigInt(estimatedGas.preVerificationGas);
      userOp.verificationGasLimit = chainConfig.supportPassKeySign
        ? (BigInt(estimatedGas.verificationGasLimit) * BigInt(12)) / BigInt(10)
        : BigInt(1000000); // maxVerificationGas of 3000000
      userOp.callGasLimit = BigInt(estimatedGas.callGasLimit);
      userOp.maxFeePerGas = feeData.maxFeePerGas;
      userOp.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

      if (gasAddress) {
        // again
        const paymasterAndData2 = await getPaymasterSign(userOp, gasAddress);
        userOp.paymasterAndData = paymasterAndData2;
      }

      const userOpHash = await calculateUserOpHash(
        ethClient,
        userOp,
        chainConfig.entrypointAddr as Address
      );

      userOp.signature = await getUserOpSignature(userOpHash, keyIndex, signMessageFunc);

      // console.log('userOp', userOp);
      // formatUserOpStruct(userOp);
      // console.log('userOpHash', userOpHash);

      // const validateUserOp = await ethClient.readContract({
      //   address: aaAddress,
      //   abi: AccountAbi,
      //   functionName: 'validateUserOp' as any,
      //   args: [userOp, userOpHash, BigInt(0)] as any,
      //   account: chainConfig.entrypointAddr as Address,
      // });
      // console.log('validateUserOp:', validateUserOp);

      return {
        userOp,
        userOpHash,
      };
    } catch (error) {
      console.error('build UserOperation failed:', error);
      throw error;
    }
  };
  const estimateGas = async (callData: Hex, gasAddress?: Address) => {
    const nonce = await entryPointContract.read.getNonce([aaAddress, BigInt(0)]);
    const feeData = await calculateGasFees(ethClient);
    const initCode = await buildInitCode();
    const userOp = {
      sender: aaAddress,
      nonce,
      initCode,
      callData,
      callGasLimit: BigInt(21000),
      verificationGasLimit: BigInt(100_000),
      preVerificationGas: BigInt(50_000),
      maxFeePerGas: BigInt(1),
      maxPriorityFeePerGas: BigInt(0),
      paymasterAndData: '0x' as Hex,
      signature: INIT_SIGNATURE,
    };
    if (gasAddress) {
      userOp.paymasterAndData = await getPaymasterSign(userOp, gasAddress);
    }
    const estimatedGas = await estimateUserOperationGas(userOp);
    const actualVerificationGasLimit = chainConfig.supportPassKeySign
      ? BigInt(estimatedGas.verificationGasLimit)
      : BigInt(1000000);

    const gasData: GasData = {
      callGasLimit: BigInt(estimatedGas.callGasLimit),
      verificationGasLimit: actualVerificationGasLimit,
      preVerificationGas: BigInt(estimatedGas.preVerificationGas),
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    };

    const maxEthFee =
      (BigInt(estimatedGas.callGasLimit) +
        actualVerificationGasLimit +
        BigInt(estimatedGas.preVerificationGas) +
        BigInt(50000)) *
      feeData.maxFeePerGas;

    return {
      gasData,
      maxEthFee,
    };
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

  const aaAccount = useMemo(() => {
    const signWithCurrentKey = async (hash: Hex) => {
      const keyIndex = await getCurrentKeyIndex();
      return getUserOpSignature(hash, keyIndex);
    };

    return toAccount({
      address: aaAddress,

      async sign({ hash }: { hash: Hex }) {
        return signWithCurrentKey(hash);
      },

      async signMessage({ message }: { message: SignableMessage }) {
        const hash = hashMessage(message);
        return signWithCurrentKey(hash);
      },

      async signTransaction() {
        throw new Error('signTransaction is not supported.');
      },

      async signTypedData<
        typedData extends TypedData | Record<string, unknown>,
        primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData
      >(typedData: TypedDataDefinition<typedData, primaryType>): Promise<Hex> {
        const hash = hashTypedData(typedData);
        const domainSeparator = (await passKeyAccountContract.read.domainSeparator()) as Hex;
        const structHash = keccak256(
          encodeAbiParameters([{ type: 'bytes32' }, { type: 'bytes32' }], [MESSAGE_TYPEHASH, hash])
        );
        const eip712Hash = keccak256(concatHex(['0x1901', domainSeparator, structHash]));
        const signature = await signWithCurrentKey(eip712Hash);
        // const validationResult = (await passKeyAccountContract.read.isValidSignature([
        //   hash,
        //   signature,
        // ])) as Hex;
        // console.log('validationResult', validationResult === '0x1626ba7e');

        return signature;
      },
    });
  }, [aaAddress, chainId]);
  const aaClient = useMemo(
    () =>
      createWalletClient({
        account: aaAccount,
        chain: ethClient.chain,
        transport: http(chainConfig.rpcUrls[0]),
      }),
    [aaAccount, ethClient.chain, chainConfig.rpcUrls]
  );

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
      mnemonicAccount.sign({ hash: message })
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
    gasAddress?: Address,
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
    gasAddress?: Address,
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
      const { maxEthFee } = await estimateGas(callData, gasAddress);
      return {
        maxEthFee,
      };
    } catch (error) {
      console.error('estimateTransfer failed:', error);
      throw error;
    }
  };

  const verify = async (hash: Hex, signature: Hex) => {
    const res = await passKeyAccountContract.read.isValidSignature([hash, signature]);
    console.log('isValidSignature result', res);
    return res;
  };

  return {
    isAccountDeployed,
    buildCallData,
    buildUserOperation,
    estimateGas,
    getKeyIndexThroughAddress,
    getKeyIndexThroughXy,
    getCurrentKeyIndex,
    aaAccount,
    aaClient,

    // TODO abandon or move
    recoveryAccount,
    removeOwner,
    addOwnerByAddress,
    transfer,
    estimateTransfer,
    verify,
  };
};
