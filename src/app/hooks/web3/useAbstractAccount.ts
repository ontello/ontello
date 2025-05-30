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
import { signMessageWithPasskey } from '../../utils/passkey';
import {
  AccountCallType,
  BuildUserOperationParams,
  BuildUserOperationResult,
  UserOperation,
} from './types';
import { calculateUserOpHash } from '../../utils/web3';

export const useAbstractAccount = (ethClient: PublicClient, address: Address) => {
  const passKeyAccountContract = getContract({
    address,
    abi: AccountAbi,
    client: ethClient,
  });

  const buildUserOperation = async (
    params: BuildUserOperationParams
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
    const keyIndex = 0; // 暂时写0，可以从合约取

    const signatureWrapper = encodeAbiParameters(
      [
        { type: 'uint256', name: 'keyIndex' },
        { type: 'bytes', name: 'signature' },
      ],
      [BigInt(keyIndex), webauthnSignatureEncoded]
    );

    userOp.signature = signatureWrapper;

    return {
      userOp,
      userOpHash,
    };
  };

  const recoveryAccount = async (mnemonic: string) => {
    const mnemonicAccount = mnemonicToAccount(mnemonic);
  };
  return {
    buildUserOperation,
  };
};
