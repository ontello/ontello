// # Copyright 2024 New Vector Ltd.
import { MatrixClient, Method } from "matrix-js-sdk";



const requestPrefix = "/_matrix/client/v3";

export interface IPasskeyCredential {
  id: string;
  publicKey: string;
}
export function getPasskeyCredentials(
  cl: MatrixClient,
  userId: string,
): Promise<IPasskeyCredential[]> {
  return cl.http.authedRequest(
    Method.Get,
    `/profile/${encodeURIComponent(userId)}/credentials`,
    undefined,
    undefined,
    { prefix: requestPrefix }
  );
};
