import {
  Hex,
  Address,
  toHex,
  getContract,
  encodeFunctionData,
  encodeAbiParameters,
  fromBytes,
  maxUint256,
  bytesToBigInt,
} from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { EntryPointAbi, Erc20Abi, AccountAbi, PaymasterAbi } from '@src/app/static/abis';
import { polling } from '@src/app/utils/common';
import { fromBase64Url, registerWithPasskey, signMessageWithPasskey } from '../../utils/passkey';
import { useWeb3PublicClient } from './useWeb3Client';
import {
  AccountCallType,
  BuildUserOperationParams,
  BuildUserOperationResult,
  UserOperation,
  UserOperationReceipt,
} from './types';
import {
  bigIntSerializer,
  calculateCallGasLimit,
  calculateGasFees,
  calculateUserOpHash,
  serializerToHex,
} from '../../utils/web3';
import cons from '../../../client/state/cons';

// TODO
const GAS_ADDRESS = '0xd878dfE2b33A07E7FB290c1578A0b3cbc8aDadEA';

export const useAbstractAccount = (aaAddress: Address, chainId?: number) => {
  const { publicClient: ethClient, chainConfig } = useWeb3PublicClient(chainId);

  const passKeyAccountContract = getContract({
    address: aaAddress,
    abi: AccountAbi,
    client: ethClient,
  });
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
    const keyIndex = await getKeyIndexThroughXy(
      toHex(new Uint8Array(xy.slice(0, 32))),
      toHex(new Uint8Array(xy.slice(32)))
    );
    return keyIndex;
  };

  // paymaster
  const getPaymasterSign = async (userOp: UserOperation, gasTokenAddress: string): Promise<Hex> => {
    const response = await fetch(
      `https://service-test.onto.app/S5/v2/ontoservice/aa/paymaster_sign`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            init_code: userOp.initCode,
            chain_id: chainId,
            token_hash: gasTokenAddress,
            max_priority_fee_per_gas: userOp.maxPriorityFeePerGas,
            sender: userOp.sender,
            call_data: userOp.callData,
            verification_gas_limit: userOp.verificationGasLimit,
            max_fee_per_gas: userOp.maxFeePerGas,
            pre_verification_gas: userOp.preVerificationGas,
            call_gas_limit: userOp.callGasLimit,
            nonce: userOp.nonce,
          },
          bigIntSerializer
        ),
      }
    );
    const res = await response.json();
    if (res.Error !== 0) {
      throw new Error(`Get paymaster sign failed: ${res.Desc}`);
    }
    return res.Result;
  };

  // bundler
  const estimateUserOperationGas = async (
    userOp: UserOperation
  ): Promise<{
    preVerificationGas: Hex;
    verificationGasLimit: Hex;
    callGasLimit: Hex;
    // paymasterVerificationGasLimit: Hex;
  }> => {
    const response = await fetch(chainConfig.bundlerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_estimateUserOperationGas',
          params: [userOp, chainConfig.entrypointAddr],
        },
        serializerToHex
      ),
    });
    const res = await response.json();
    if (res.error) {
      throw new Error(`Estimate failed: ${res.error.message}`);
    }
    return res.result;
  };
  const sendUserOperation = async (userOp: UserOperation): Promise<Hex> => {
    const response = await fetch(chainConfig.bundlerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_sendUserOperation',
          params: [userOp, chainConfig.entrypointAddr],
        },
        serializerToHex
      ),
    });
    const res = await response.json();
    if (res.result) {
      return res.result;
    }
    throw new Error(res.error?.message);
  };
  const getUserOperationReceipt = async (userOpHash: Hex): Promise<UserOperationReceipt> => {
    const getFunc = async () => {
      const response = await fetch(chainConfig.bundlerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getUserOperationReceipt',
          params: [userOpHash],
        }),
      });
      const res = await response.json();

      if (res.error?.code === -32507) {
        throw new Error(res.error.message);
      }

      if (res.result) {
        return res.result;
      }
      return null;
    };
    const receipt = await polling(getFunc, (res) => {
      if (res) {
        return true;
      }
      return false;
    });
    console.log('receipt:', receipt);

    if (receipt) {
      return receipt;
    }
    throw new Error('Failed to get user operation receipt');
  };

  //
  const buildCallData = async (operations: BuildUserOperationParams): Promise<Hex> => {
    const allowance = await ethClient.readContract({
      address: GAS_ADDRESS,
      abi: Erc20Abi,
      functionName: 'allowance',
      args: [aaAddress, chainConfig.paymasterAddr as Address],
    });

    if (allowance === BigInt(0)) {
      operations.unshift({
        type: AccountCallType.Execute,
        target: GAS_ADDRESS,
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
    signMessageFunc?: (message: Hex) => Promise<Hex>
  ): Promise<BuildUserOperationResult> => {
    try {
      const nonce = (await passKeyAccountContract.read.getNonce()) as bigint;
      const feeData = await calculateGasFees(ethClient);
      const callGasLimit = await calculateCallGasLimit(
        ethClient,
        chainConfig.entrypointAddr as Address,
        aaAddress,
        callData
      );
      console.log('nonce', nonce);

      const userOp = {
        sender: aaAddress,
        nonce,
        initCode: '0x' as Hex,
        callData,
        callGasLimit,
        verificationGasLimit: BigInt(500_000),
        preVerificationGas: BigInt(200_000),
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        paymasterAndData: '0x' as Hex,
        signature: '0x' as Hex,
      };

      // const estimatedGas = await estimateUserOperationGas(userOp);
      // console.log('estimatedGas:', estimatedGas);
      // userOp.preVerificationGas = BigInt(estimatedGas.preVerificationGas);
      // userOp.verificationGasLimit = BigInt(estimatedGas.verificationGasLimit);

      const paymasterAndData = await getPaymasterSign(userOp, GAS_ADDRESS);
      userOp.paymasterAndData = paymasterAndData;

      const userOpHash = await calculateUserOpHash(
        ethClient,
        userOp,
        chainConfig.entrypointAddr as Address,
        chainConfig.chainId
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

  const transfer = async (to: Address, amount: bigint, tokenAddress?: Address) => {
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

    const callData = await buildCallData(operations);
    const { userOp, userOpHash } = await buildUserOperation(callData, keyIndex);

    await sendUserOperation(userOp);
    const receipt = await getUserOperationReceipt(userOpHash);
    return receipt;
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
  };
};
