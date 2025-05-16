// # Copyright 2024 New Vector Ltd.
import { MatrixClient, Method } from "matrix-js-sdk";

interface IPasskeyCredential {
  id: string;
  publicKey: string;
}

declare module "matrix-js-sdk" {
  interface MatrixClient {
    getPasskeyCredentials(userId: string): Promise<IPasskeyCredential[]>;
  }
}


const requestPrefix = "/_matrix/client/v3";
const registerExtendApis = (): void => {
  MatrixClient.prototype.getPasskeyCredentials = function (
    userId: string
  ): Promise<IPasskeyCredential[]> {
    return this.http.authedRequest(
      Method.Get,
      `/profile/${encodeURIComponent(userId)}/credentials`,
      undefined, // query params
      undefined, // data
      { prefix: requestPrefix }
    );
  };
}
registerExtendApis()