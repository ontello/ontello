import { MatrixClient, Method } from 'matrix-js-sdk';
import { Hex } from 'viem';
import { UserOperation } from '../hooks/web3/types';

const requestPrefix = '/_matrix/client/v3';

export const bigIntSerializer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

export interface IPasskeyCredential {
  id: string;
  publicKey: string;
}
export function getPasskeyCredentials(
  cl: MatrixClient,
  userId: string
): Promise<IPasskeyCredential[]> {
  return cl.http.authedRequest(
    Method.Get,
    `/profile/${encodeURIComponent(userId)}/credentials`,
    undefined,
    undefined,
    { prefix: requestPrefix }
  );
}

export const getPaymasterSign = async (
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
