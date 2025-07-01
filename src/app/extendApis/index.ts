import { MatrixClient, Method } from 'matrix-js-sdk';
import { Address } from 'viem';

const requestPrefix = '/_matrix/client/v3';

export interface CredentialItem {
  id: string;
  publicKey: string;
  timestamp: number;
}
export interface IPasskeyCredential {
  credentials: CredentialItem[];
  walletAddress: Address;
}
export async function getPasskeyCredentials(
  cl: MatrixClient,
  userId: string
): Promise<IPasskeyCredential> {
  const res = await cl.http.authedRequest<IPasskeyCredential>(
    Method.Get,
    `/profile/${encodeURIComponent(userId)}/credentials`,
    undefined,
    undefined,
    { prefix: requestPrefix }
  );
  if (res && Array.isArray(res.credentials)) {
    res.credentials = res.credentials.map((item) => ({
      ...item,
      timestamp: item.timestamp * 1000,
    }));
  }
  return res;
}
