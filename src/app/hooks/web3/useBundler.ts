import { Hex } from 'viem';
import { serializerToHex } from '@src/app/utils/web3';
import { polling } from '@src/app/utils/common';
import { UserOperation, UserOperationReceipt } from './types';
import { useWeb3Client } from './useWeb3Client';

export const useBundler = (chainId?: number) => {
  const { getWeb3PublicClient } = useWeb3Client();
  const { chainConfig } = getWeb3PublicClient(chainId);
  const estimateUserOperationGas = async (
    userOp: UserOperation
  ): Promise<{
    preVerificationGas: Hex;
    verificationGasLimit: Hex;
    callGasLimit: Hex;
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
  return {
    estimateUserOperationGas,
    sendUserOperation,
    getUserOperationReceipt,
  };
};
