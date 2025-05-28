import { V06 } from 'userop';
import { Hex, Address, PublicClient, Abi } from 'viem';

export const useAbstractAccount = (ethClient: PublicClient) => {
  const abstractAccount = new V06.Account.Instance({
    ...V06.Account.Common.SimpleAccount.base(
      ethClient
      // TODO
    ),
  });
  return {
    abstractAccount,
  };
};
