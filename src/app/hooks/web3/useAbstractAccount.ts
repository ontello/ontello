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
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { EntryPointAbi, Erc20Abi, AccountAbi, PaymasterAbi } from '@src/app/static/abis';
import { bscTestnet } from 'viem/chains';
import { polling } from '@src/app/utils/common';
import { fromBase64Url, registerWithPasskey, signMessageWithPasskey } from '../../utils/passkey';
import {
  AccountCallType,
  BuildUserOperationParams,
  BuildUserOperationResult,
  UserOperation,
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
const BUNDLER_RPC = 'http://35.240.165.243:4337/rpc';

const GAS_ADDRESS = '0xd878dfE2b33A07E7FB290c1578A0b3cbc8aDadEA';
const PAYMASTERE_ADDRESS = '0xfe86e45222e784a40a2c5e94b58c41b910d7e9ca';
const ENTRY_POINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

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

  // paymaster
  const getPaymasterSign = async (
    userOp: UserOperation,
    chainId: number,
    gasTokenAddress: string
  ): Promise<Hex> => {
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
      throw new Error(`获取 Paymaster 签名失败: ${res.ErrorMessage}`);
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
    const response = await fetch(BUNDLER_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_estimateUserOperationGas',
          params: [userOp, ENTRY_POINT_ADDRESS],
        },
        serializerToHex
      ),
    });
    const res = await response.json();
    if (res.error) {
      throw new Error(`估算用户操作 gas 失败: ${res.error.message}`);
    }
    return res.result;
  };
  const sendUserOperation = async (userOp: UserOperation): Promise<Hex> => {
    const response = await fetch(BUNDLER_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_sendUserOperation',
          params: [userOp, ENTRY_POINT_ADDRESS],
        },
        serializerToHex
      ),
    });
    const res = await response.json();
    return res.result;
  };
  const getUserOperationReceipt = async (userOpHash: Hex) => {
    const getFunc = async () => {
      const response = await fetch(BUNDLER_RPC, {
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
      if (res.error) {
        return null;
      }
      return res.result;
    };
    const receipt = await polling(getFunc, (res) => !!res);
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
      args: [address, PAYMASTERE_ADDRESS],
    });

    if (allowance === BigInt(0)) {
      operations.unshift({
        type: AccountCallType.Execute,
        target: GAS_ADDRESS,
        data: encodeFunctionData({
          abi: Erc20Abi,
          functionName: 'approve',
          args: [PAYMASTERE_ADDRESS, maxUint256],
        }),
      });
    }

    const calls = operations.map((arg) => {
      if (arg.type === AccountCallType.Direct) {
        const callData = encodeFunctionData({
          abi: AccountAbi,
          functionName: arg.functionName as any,
          args: arg.args as any,
        });
        return {
          target: address,
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
    // params: BuildUserOperationParams,
    callData: Hex,
    keyIndex: bigint,
    signMessageFunc?: (message: Hex) => Promise<Hex>
  ): Promise<BuildUserOperationResult> => {
    try {
      const nonce = (await passKeyAccountContract.read.getNonce()) as bigint;
      const feeData = await calculateGasFees(ethClient);

      const userOp = {
        sender: address,
        nonce,
        initCode: '0x' as Hex,
        callData,
        callGasLimit: await calculateCallGasLimit(
          ethClient,
          ENTRY_POINT_ADDRESS,
          address,
          callData
        ),
        verificationGasLimit: BigInt(500_000),
        preVerificationGas: BigInt(200_000),
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        paymasterAndData: '0x' as Hex,
        // eslint-disable-next-line prefer-template
        signature: '0x' as Hex,
      };
      console.log('init userOp:', userOp);

      // const estimatedGas = await estimateUserOperationGas(userOp);
      // console.log('estimatedGas:', estimatedGas);
      // userOp.preVerificationGas = BigInt(estimatedGas.preVerificationGas);
      // userOp.verificationGasLimit = BigInt(estimatedGas.verificationGasLimit);

      const chainId = await ethClient.getChainId();
      if (!chainId) {
        throw new Error('无法获取链 ID');
      }
      const paymasterAndData = await getPaymasterSign(userOp, chainId, GAS_ADDRESS);
      userOp.paymasterAndData = paymasterAndData;

      const userOpHash = await calculateUserOpHash(ethClient, userOp, ENTRY_POINT_ADDRESS, chainId);

      if (signMessageFunc) {
        const signature = await signMessageFunc(userOpHash);
        userOp.signature = signature;
      } else {
        const passkeySignature = await signMessageWithPasskey(userOpHash);
        const webauthnSignatureEncoded = encodeAbiParameters(
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
              r: BigInt(fromBytes(passkeySignature.r, 'bigint')),
              s: BigInt(fromBytes(passkeySignature.s, 'bigint')),
            },
          ]
        ) as Hex;

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
          [{ keyIndex, signature: webauthnSignatureEncoded }]
        );

        console.log('signatureWrapper:', signatureWrapper);
        userOp.signature = signatureWrapper;
      }

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
    console.log('keyIndex:', keyIndex);

    const callData = await buildCallData([
      {
        type: AccountCallType.Direct,
        functionName: 'addOwnerAddress',
        args: [ownerAddress],
      },
    ]);

    const { userOp, userOpHash } = await buildUserOperation(callData, keyIndex);
    console.log('userOpHash:', userOpHash);
    console.log('userOp:', userOp);

    // const validateUserOp = await ethClient.readContract({
    //   address,
    //   abi: AccountAbi,
    //   functionName: 'validateUserOp',
    //   args: [userOp, userOpHash, BigInt(0)],
    //   account: ENTRY_POINT_ADDRESS,
    // });
    // console.log('validateUserOp:', validateUserOp);

    const res = await sendUserOperation(userOp);
    console.log('sendUserOperation res:', res);
    const receipt = await getUserOperationReceipt(userOpHash);
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
