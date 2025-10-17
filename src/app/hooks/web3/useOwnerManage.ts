import { Address, encodeFunctionData, getContract, Hex, toHex } from 'viem';
import { AccountAbi, CrossChainRelayerAbi, EntryPointAbi } from '@src/app/static/abis';
import { getUserOpSignature, serializeBigInt } from '@src/app/utils/web3';
import { FeeSessionResp, walletApi } from '@src/app/externalApis';
import { mnemonicToAccount } from 'viem/accounts';
import { fromBase64Url, registerWithPasskey } from '@src/app/utils/passkey';
import { useWeb3Client } from './useWeb3Client';
import { useAbstractAccount } from './useAbstractAccount';
import { useChainConfig } from './useChainConfig';
import { useBundler } from './useBundler';
import { AccountCallType, BuildUserOperationParams, ReplayOperation, UserOperation } from './types';

const NONCE_KEY = BigInt(5851);
// eslint-disable-next-line no-bitwise
const INITIAL_NONCE = NONCE_KEY << BigInt(64);

export const useOwnerManage = (aaAddress: Address) => {
  const { getCurrentKeyIndex, buildCallData, buildUserOperation } = useAbstractAccount(aaAddress);
  const { getWeb3PublicClient, createWeb3Clients } = useWeb3Client();
  const { publicClient: ethClient, chainConfig } = getWeb3PublicClient();
  const { mainChainConfig } = useChainConfig();
  const { sendUserOperation } = useBundler();
  const entryPointContract = getContract({
    address: chainConfig.entrypointAddr as Address,
    abi: EntryPointAbi,
    client: ethClient,
  });
  const AccountContract = getContract({
    address: aaAddress,
    abi: AccountAbi,
    client: ethClient,
  });

  const buildOwnerManageUserOperation = async (
    calls: Hex[],
    signMessageFunc?: (message: Hex) => Promise<Hex>
  ) => {
    // eslint-disable-next-line no-bitwise
    const nonce = await entryPointContract.read.getNonce([aaAddress, NONCE_KEY]);

    const callData = encodeFunctionData({
      abi: AccountAbi,
      functionName: 'executeWithoutChainIdValidation',
      args: [calls],
    });
    const userOp: UserOperation = {
      sender: aaAddress,
      nonce,
      initCode: '0x' as Hex,
      callData,
      callGasLimit: BigInt(500_000), // TODO
      verificationGasLimit: BigInt(2_000_000),
      preVerificationGas: BigInt(0),
      maxFeePerGas: BigInt(0),
      maxPriorityFeePerGas: BigInt(0),
      paymasterAndData: '0x' as Hex,
      signature: '0x' as Hex,
    };
    const userOpHash = await AccountContract.read.getUserOpHashWithoutChainId([userOp]);
    const keyIndex = await getCurrentKeyIndex();
    userOp.signature = await getUserOpSignature(userOpHash, keyIndex, signMessageFunc);
    return { userOp, userOpHash };
  };

  const payFee = async (session: Hex, token: Address, amount: bigint) => {
    const keyIndex = await getCurrentKeyIndex();

    const operations: BuildUserOperationParams = [
      {
        type: AccountCallType.Execute,
        target: mainChainConfig.crossChainRelayer as Address,
        data: encodeFunctionData({
          abi: CrossChainRelayerAbi,
          functionName: 'payFee',
          args: [session, token, amount],
        }),
      },
    ];
    const callData = await buildCallData(operations);
    const { userOp, userOpHash } = await buildUserOperation(callData, keyIndex, undefined);
    await sendUserOperation(userOp);
    return {
      userOp,
      userOpHash,
    };
  };

  const checkOwnerInitial = async (): Promise<boolean> => {
    const nonce = await entryPointContract.read.getNonce([aaAddress, NONCE_KEY]);
    return nonce === INITIAL_NONCE;
  };

  const getSyncStatus = async (targetChainIds: number[]) => {
    const mainChainNonce = await entryPointContract.read.getNonce([aaAddress, NONCE_KEY]);

    const web3Clients = createWeb3Clients(targetChainIds);

    const nonceResults = await Promise.all(
      web3Clients.map(async (clientResult) => {
        const { publicClient, chainConfig: currentChainConfig } = clientResult;

        try {
          const chainEntryPointContract = getContract({
            address: currentChainConfig.entrypointAddr as Address,
            abi: EntryPointAbi,
            client: publicClient,
          });
          const nonce = await chainEntryPointContract.read.getNonce([aaAddress, NONCE_KEY]);

          return { chainId: currentChainConfig.chainId, nonce };
        } catch (error) {
          console.error(`Error getting nonce for chain ${currentChainConfig.chainId}:`, error);
          return { chainId: currentChainConfig.chainId, nonce: undefined };
        }
      })
    );

    const syncStatus: Record<number, boolean> = {};

    nonceResults.forEach((result) => {
      syncStatus[result.chainId] = result.nonce !== undefined && result.nonce === mainChainNonce;
    });

    return syncStatus;
  };

  const changeOwner = async (
    operation: ReplayOperation,
    args: unknown[],
    chainIds: number[],
    signMessageFunc?: (message: Hex) => Promise<Hex>
  ): Promise<FeeSessionResp> => {
    const call = encodeFunctionData({
      abi: AccountAbi,
      functionName: operation,
      args,
    });
    const { userOp } = await buildOwnerManageUserOperation([call], signMessageFunc);
    const feeTokens = (await walletApi.walletdataFeeTokensGet()).result;

    const res = await walletApi.walletdataChangeOwnerPost({
      WalletdataChangeOwnerPostRequest: {
        userOperation: serializeBigInt(userOp),
        token: feeTokens[0].tokenAddr,
        chainId: chainIds,
      },
    });
    return res.result;
  };
  const addOwnerByAddress = async (
    ownerAddress: Address,
    chainIds: number[]
  ): Promise<FeeSessionResp> => {
    const feeSession = await changeOwner(ReplayOperation.AddOwnerAddress, [ownerAddress], chainIds);
    return feeSession;
  };
  const addOwnerByPublicKey = async (mnemonic: string, username: string, chainIds: number[]) => {
    const mnemonicAccount = mnemonicToAccount(mnemonic);
    const { x, y } = await registerWithPasskey(username);
    const feeSession = await changeOwner(
      ReplayOperation.AddOwnerPublicKey,
      [toHex(new Uint8Array(x)), toHex(new Uint8Array(y))],
      chainIds,
      (message) => mnemonicAccount.signMessage({ message: { raw: message } })
    );
    return feeSession;
  };
  const removeOwner = async (targetPublicKeyBase64: string, chainIds: number[]) => {
    const xy = fromBase64Url(targetPublicKeyBase64);
    const xyHex = toHex(new Uint8Array(xy));

    const feeSession = await changeOwner(ReplayOperation.RemoveOwner, [xyHex], chainIds);
    return feeSession;
  };
  const syncOwner = async (chainIds: number[]) => {
    const feeTokens = (await walletApi.walletdataFeeTokensGet()).result;
    const feeSessionRes = await walletApi.walletdataRelayChainPost({
      WalletdataRelayChainPostRequest: {
        address: aaAddress,
        token: feeTokens[0].tokenAddr,
        chainId: chainIds,
      },
    });
    return feeSessionRes.result;
  };

  return {
    buildOwnerManageUserOperation,
    payFee,
    checkOwnerInitial,
    getSyncStatus,
    addOwnerByAddress,
    addOwnerByPublicKey,
    removeOwner,
    syncOwner,
  };
};
