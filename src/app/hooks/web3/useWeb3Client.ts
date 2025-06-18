import { createPublicClient, http, createWalletClient } from 'viem';
import { bscTestnet } from 'viem/chains';

export const useWeb3PublicClient = () => {
  const client = createPublicClient({
    chain: bscTestnet,
    transport: http(
      'https://cool-intensive-model.bsc-testnet.quiknode.pro/0e16aef80a15ba93cdd7240c96051e294f52c269'
    ),
  });
  return client;
};
