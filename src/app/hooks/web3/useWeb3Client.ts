import { useCallback } from 'react';
import { createPublicClient, http, defineChain, type PublicClient } from 'viem';
import { useChainConfig } from './useChainConfig';
import type { ChainConfig } from '../../externalApis';

export interface Web3PublicClientResult {
  publicClient: PublicClient;
  chainConfig: ChainConfig;
}

export interface UseWeb3ClientResult {
  getWeb3PublicClient: (chainId?: number) => Web3PublicClientResult;
  createWeb3Clients: (chainIds: number[]) => Web3PublicClientResult[];
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

const buildClient = (backendConfig: ChainConfig): Web3PublicClientResult => {
  const chain = createViemChain(backendConfig);
  const publicClient = createPublicClient({
    chain,
    transport: http(backendConfig.rpcUrls[0]),
  });

  return {
    publicClient,
    chainConfig: backendConfig,
  };
};

export const useWeb3Client = (): UseWeb3ClientResult => {
  const { availableChains } = useChainConfig();

  const getWeb3PublicClient = useCallback(
    (chainId?: number) => {
      const backendConfig = chainId
        ? availableChains.find((chain) => chain.chainId === chainId)
        : availableChains.find((chain) => chain.isMain);

      if (!backendConfig || !backendConfig.rpcUrls?.[0]) {
        const errorMsg = chainId
          ? `Chain ${chainId} not supported or missing RPC configuration`
          : 'No main chain found or missing RPC configuration';
        throw new Error(errorMsg);
      }

      return buildClient(backendConfig);
    },
    [availableChains]
  );

  const createWeb3Clients = useCallback(
    (chainIds: number[]) => chainIds.map((chainId) => getWeb3PublicClient(chainId)),
    [getWeb3PublicClient]
  );

  return {
    getWeb3PublicClient,
    createWeb3Clients,
  };
};
