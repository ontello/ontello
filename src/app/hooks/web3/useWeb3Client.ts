import { createPublicClient, http, createWalletClient } from 'viem';
import { bscTestnet } from 'viem/chains';

export const useWeb3PublicClient = () => {
  const client = createPublicClient({
    chain: bscTestnet,
    transport: http('https://ethrpc.wing.finance/bnbtestnet/'),
  });
  return client;
};
