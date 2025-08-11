import { createPublicClient, http, createWalletClient } from 'viem';
import { bscTestnet } from 'viem/chains';

export const useWeb3PublicClient = () => {
  const client = createPublicClient({
    chain: bscTestnet,
    transport: http(
      'https://twilight-powerful-arm.bsc-testnet.quiknode.pro/113731ea74452a2d8f164839de84d43e9b617419'
    ),
  });
  return client;
};
