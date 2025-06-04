import {
  Hex,
  Address,
  PublicClient,
  toHex,
  getContract,
  encodeFunctionData,
  encodeAbiParameters,
  fromBytes,
} from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
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

export const useAbstractAccount = (ethClient: PublicClient, address: Address) => {
  const passKeyAccountContract = getContract({
    address,
    abi: AccountAbi,
    client: ethClient,
  });
  const getKeyIndexThroughAddress = async (ownerAddress: Address): Promise<bigint> => {
    const input = encodeAbiParameters([{ name: 'address', type: 'string' }], [ownerAddress]);
    const keyIndex = (await passKeyAccountContract.read.indexOfOwnerBytes([input])) as bigint;
    return keyIndex;
  };
  const getKeyIndexThroughXy = async (x: Hex, y: Hex): Promise<bigint> => {
    const input = encodeAbiParameters(
      [
        { name: 'x', type: 'bytes' },
        { name: 'y', type: 'bytes' },
      ],
      [x, y]
    );
    const keyIndex = (await passKeyAccountContract.read.indexOfOwnerBytes([input])) as bigint;
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

  const buildUserOperation = async (
    params: BuildUserOperationParams,
    keyIndex: bigint,
    signMessageFunc?: (message: Hex) => Promise<Hex>
  ): Promise<BuildUserOperationResult> => {
    let callData: Hex;
    if (params.type === AccountCallType.Direct) {
      callData = encodeFunctionData({
        abi: AccountAbi,
        functionName: params.functionName,
        args: params.args,
      });
    } else {
      callData = encodeFunctionData({
        abi: AccountAbi,
        functionName: 'execute',
        args: [params.target, params.value ?? BigInt(0), params.data],
      });
    }

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

    const chainId = ethClient.chain?.id;
    if (!chainId) {
      throw new Error('无法获取链 ID');
    }
    const userOpHash = calculateUserOpHash(userOp, address, chainId);

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
      // const keyIndex = 0; // 暂时写0，可以从合约取

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
  };

  const recoveryAccount = async (mnemonic: string, username: string) => {
    const mnemonicAccount = mnemonicToAccount(mnemonic);
    const { x, y } = await registerWithPasskey(username);
    const keyIndex = await getKeyIndexThroughAddress(mnemonicAccount.address);
    const { userOp, userOpHash } = await buildUserOperation(
      {
        type: AccountCallType.Direct,
        functionName: 'addOwnerPublicKey',
        args: [toHex(new Uint8Array(x)), toHex(new Uint8Array(y))],
      },
      keyIndex,
      (message) => mnemonicAccount.signMessage({ message: { raw: message } })
    );
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

    const { userOp, userOpHash } = await buildUserOperation(
      {
        type: AccountCallType.Direct,
        functionName: 'removeOwnerAtIndex',
        args: [targetKeyIndex, input],
      },
      keyIndex
    );
  };
  return {
    buildUserOperation,
    getKeyIndexThroughAddress,
    getKeyIndexThroughXy,
    getCurrentKeyIndex,
    recoveryAccount,
    removeOwner,
  };
};
