import { useMemo } from 'react';
import { createPublicClient, http, defineChain, type PublicClient } from 'viem';
import { useChainConfig } from './useChainConfig';
import type { ChainConfig } from '../../externalApis';

export interface Web3PublicClientResult {
  publicClient: PublicClient;
  chainConfig: ChainConfig;
}

const createViemChain = (config: ChainConfig) =>
  defineChain({
    id: config.chainId,
    name: config.chainName,
    nativeCurrency: {
      name: config.nativeCurrency.name,
      symbol: config.nativeCurrency.symbol,
      decimals: config.nativeCurrency.decimals,
    },
    rpcUrls: {
      default: { http: config.rpcUrls },
      public: { http: config.rpcUrls },
    },
    blockExplorers: {
      default: {
        name: 'Explorer',
        url: config.blockExplorerUrls[0] || '',
      },
    },
  });

export const useWeb3PublicClient = (chainId?: number): Web3PublicClientResult => {
  const { availableChains } = useChainConfig();

  const result = useMemo(() => {
    const backendConfig = chainId
      ? availableChains.find((chain) => chain.chainId === chainId)
      : availableChains.find((chain) => chain.isMain) || availableChains[0];

    if (!backendConfig || !backendConfig.rpcUrls?.[0]) {
      const errorMsg = chainId
        ? `Chain ${chainId} not supported or missing RPC configuration`
        : 'No main chain found or missing RPC configuration';
      throw new Error(errorMsg);
    }

    const chain = createViemChain(backendConfig);
    const publicClient = createPublicClient({
      chain,
      transport: http(backendConfig.rpcUrls[0]),
    });

    return {
      publicClient,
      chainConfig: backendConfig,
    };
  }, [chainId, availableChains]);

  return result;
};
// TODO
export const useWeb3PublicClients = () => {
  const { availableChains } = useChainConfig();
  const createWeb3Client = (chainIds: number[]): Web3PublicClientResult[] =>
    chainIds.map((chainId) => {
      const backendConfig = availableChains.find((chain) => chain.chainId === chainId);

      if (!backendConfig || !backendConfig.rpcUrls?.[0]) {
        throw new Error(`Chain ${chainId} not supported or missing RPC configuration`);
      }

      const chain = createViemChain(backendConfig);
      const publicClient = createPublicClient({
        chain,
        transport: http(backendConfig.rpcUrls[0]),
      });

      return {
        publicClient,
        chainConfig: backendConfig,
      };
    });
  return {
    createWeb3Client,
  };
};
