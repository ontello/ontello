import {
  Hex,
  Address,
  PublicClient,
  toHex,
  getContract,
  encodeFunctionData,
  encodeAbiParameters,
  fromBytes,
  maxUint256,
} from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import ERC20Abi from '@app/static/abis/ERC20.json';
import AccountAbi from '../../static/abis/PassKeyAccount.json';
import { fromBase64Url, registerWithPasskey, signMessageWithPasskey } from '../../utils/passkey';
import {
  AccountCallType,
  BuildUserOperationParams,
  BuildUserOperationResult,
  UserOperation,
} from './types';
import { calculateUserOpHash } from '../../utils/web3';
import cons from '../../../client/state/cons';
import { getPaymasterSign } from '../../extendApis';

// TODO
const GAS_ADDRESS = '0xd878dfE2b33A07E7FB290c1578A0b3cbc8aDadEA';
const PAYMASTERE_ADDRESS = '0xfe86e45222e784a40a2c5e94b58c41b910d7e9ca';

export const useAbstractAccount = (ethClient: PublicClient, address: Address) => {
  const passKeyAccountContract = getContract({
    address,
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

  const buildCallData = async (data: BuildUserOperationParams): Promise<Hex> => {
    // if (data.type === AccountCallType.Direct) {
    //   return encodeFunctionData({
    //     abi: AccountAbi,
    //     functionName: data.functionName,
    //     args: data.args,
    //   });
    // }

    // if (data.type === AccountCallType.Execute) {
    //   return encodeFunctionData({
    //     abi: AccountAbi,
    //     functionName: 'execute',
    //     args: [data.target, data.value ?? BigInt(0), data.data],
    //   });
    // }

    // if (data.type === AccountCallType.ExecuteBatch) {
    // 构建Call结构体数组
    const calls = data.map((arg) => {
      if (arg.type === AccountCallType.Direct) {
        const callData = encodeFunctionData({
          abi: AccountAbi,
          functionName: arg.functionName,
          args: arg.args,
        });
        return {
          target: address, // 对于Direct调用，目标是合约自身
          value: BigInt(0),
          data: callData,
        };
      }
      // Execute调用
      return {
        target: arg.target,
        value: arg.value ?? BigInt(0),
        data: arg.data,
      };
    });

    // 使用Call结构体数组调用executeBatch
    return encodeFunctionData({
      abi: AccountAbi,
      functionName: 'executeBatch',
      args: [calls],
    });
    // }
  };

  const buildUserOperation = async (
    // params: BuildUserOperationParams,
    callData: Hex,
    keyIndex: bigint,
    signMessageFunc?: (message: Hex) => Promise<Hex>
  ): Promise<BuildUserOperationResult> => {
    try {
      const feeData = await ethClient.estimateFeesPerGas();

      if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
        throw new Error('无法获取 gas 费用数据');
      }

      const nonce = (await passKeyAccountContract.read.getNonce()) as bigint;

      const callGasLimit = await ethClient.estimateGas({
        account: address,
        to: address,
        data: callData,
        value: BigInt(0),
      });
      const userOp = {
        sender: address,
        nonce,
        initCode: '0x' as Hex,
        callData,
        callGasLimit,
        verificationGasLimit: BigInt(100000),
        preVerificationGas: BigInt(21000),
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        paymasterAndData: '0x' as Hex,
        signature: '0x' as Hex,
      };

      const chainId = await ethClient.getChainId();
      if (!chainId) {
        throw new Error('无法获取链 ID');
      }
      const paymasterAndData = await getPaymasterSign(userOp, chainId, GAS_ADDRESS);
      userOp.paymasterAndData = paymasterAndData;

      const userOpHash = calculateUserOpHash(userOp, address, chainId);
      console.log('userOpHash:', userOpHash);

      if (signMessageFunc) {
        const signature = await signMessageFunc(userOpHash);
        userOp.signature = signature;
      } else {
        const passkeySignature = await signMessageWithPasskey(userOpHash);
        let webauthnSignatureEncoded = encodeAbiParameters(
          [
            { type: 'bytes', name: 'authenticatorData' },
            { type: 'bytes', name: 'clientDataJSON' },
            { type: 'uint256', name: 'challengeIndex' },
            { type: 'uint256', name: 'typeIndex' },
            { type: 'uint256', name: 'r' },
            { type: 'uint256', name: 's' },
          ],
          [
            toHex(new Uint8Array(passkeySignature.authenticatorData)),
            toHex(new Uint8Array(passkeySignature.clientDataJSON)),
            BigInt(passkeySignature.challengeIndex),
            BigInt(passkeySignature.typeIndex),
            BigInt(fromBytes(passkeySignature.r, 'bigint')),
            BigInt(fromBytes(passkeySignature.s, 'bigint')),
          ]
        ) as Hex;

        webauthnSignatureEncoded = `0x0000000000000000000000000000000000000000000000000000000000000020${webauthnSignatureEncoded.slice(
          2
        )}`;

        const signatureWrapper = encodeAbiParameters(
          [
            { type: 'uint256', name: 'keyIndex' },
            { type: 'bytes', name: 'signature' },
          ],
          [BigInt(keyIndex), webauthnSignatureEncoded]
        );

        userOp.signature = signatureWrapper;
      }

      return {
        userOp,
        userOpHash,
      };
    } catch (error) {
      console.error('构建用户操作失败:', error);
      throw error;
    }
  };

  const sendUserOperationWithClient = async (userOp: UserOperation) => {
    // ethClient.transport.request();
  };

  const addOwnerByAddress = async (ownerAddress: Address) => {
    const keyIndex = await getCurrentKeyIndex();
    const callData = await buildCallData([
      {
        type: AccountCallType.Execute,
        target: GAS_ADDRESS,
        data: encodeFunctionData({
          abi: ERC20Abi,
          functionName: 'approve',
          args: [PAYMASTERE_ADDRESS, maxUint256],
        }),
      },
      {
        type: AccountCallType.Direct,
        functionName: 'addOwnerAddress',
        args: [ownerAddress],
      },
    ]);

    const { userOp, userOpHash } = await buildUserOperation(callData, keyIndex);
    console.log('userOpHash:', userOpHash);
    console.log('userOp:', userOp);
  };

  const recoveryAccount = async (mnemonic: string, username: string) => {
    const mnemonicAccount = mnemonicToAccount(mnemonic);
    const { x, y } = await registerWithPasskey(username);
    const keyIndex = await getKeyIndexThroughAddress(mnemonicAccount.address);
    // const { userOp, userOpHash } = await buildUserOperation(
    //   {
    //     type: AccountCallType.Direct,
    //     functionName: 'addOwnerPublicKey',
    //     args: [toHex(new Uint8Array(x)), toHex(new Uint8Array(y))],
    //   },
    //   keyIndex,
    //   (message) => mnemonicAccount.signMessage({ message: { raw: message } })
    // );
  };
  const removeOwner = async (targetPublicKeyBase64: string) => {
    const keyIndex = await getCurrentKeyIndex();

    const xy = fromBase64Url(targetPublicKeyBase64);
    const input = encodeAbiParameters(
      [
        { name: 'x', type: 'bytes' },
        { name: 'y', type: 'bytes' },
      ],
      [toHex(new Uint8Array(xy.slice(0, 32))), toHex(new Uint8Array(xy.slice(32)))]
    );
    const targetKeyIndex = (await passKeyAccountContract.read.indexOfOwnerBytes([input])) as bigint;

    // const { userOp, userOpHash } = await buildUserOperation(
    //   {
    //     type: AccountCallType.Direct,
    //     functionName: 'removeOwnerAtIndex',
    //     args: [targetKeyIndex, input],
    //   },
    //   keyIndex
    // );
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
  };
};
