import { Hex } from 'viem';
import { bigIntSerializerToString } from '@src/app/utils/web3';
import { GasToken, UserOperation } from './types';

const API_URL = import.meta.env.VITE_PAYMASTER_API_URL;
export const usePaymaster = (chainId: number) => {
  const getPaymasterSign = async (userOp: UserOperation, gasTokenAddress: string): Promise<Hex> => {
    const response = await fetch(`${API_URL}/paymaster_sign`, {
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
        bigIntSerializerToString
      ),
    });
    const res = await response.json();
    if (res.Error !== 0) {
      throw new Error(`Get paymaster sign failed: ${res.Desc}`);
    }
    return res.Result;
  };

  const getSupportGasTokens = async (): Promise<GasToken[]> => {
    const response = await fetch(
      `${API_URL}/gas_token/price?chain_id=${chainId}&currency_name=usd`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    const res = await response.json();
    if (res.Error !== 0) {
      throw new Error(`Get supported gas tokens failed: ${res.Desc}`);
    }
    const result = (res.Result as GasToken[]).map((token) => ({
      ...token,
      token_hash: token.token_type === 'native' ? '' : token.token_hash,
    }));
    return result;
  };
  return {
    getPaymasterSign,
    getSupportGasTokens,
  };
};
