import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { walletApi } from '@src/app/externalApis';
import type { ChainConfig } from '@src/app/externalApis';
import type { ChainConfigResponse } from '../../state/web3/chainConfig';
import {
  chainConfigAtom,
  isLoadingChainConfigAtom,
  chainConfigErrorAtom,
  availableChainsAtom,
} from '../../state/web3/chainConfig';

const CACHE_DURATION = 60 * 60 * 1000;

type UseChainConfigReturn = {
  chainConfig: ChainConfigResponse | null;
  availableChains: ChainConfig[];
  mainChainConfig: ChainConfig;
  isLoading: boolean;
  error: string | null;
  loadChainConfig: (forceRefresh?: boolean) => Promise<void>;
  isChainSupported: (chainId: number) => boolean;
  getChainConfig: (chainId: number) => ChainConfig;
  refreshConfig: () => Promise<void>;
};

export const useChainConfig = (): UseChainConfigReturn => {
  const [chainConfig, setChainConfig] = useAtom(chainConfigAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingChainConfigAtom);
  const [error, setError] = useAtom(chainConfigErrorAtom);
  const [availableChains] = useAtom(availableChainsAtom);

  const mainChainConfig = useMemo(
    () => availableChains.find((chain) => chain.isMain)!,
    [availableChains]
  );

  const loadingRef = useRef(false);

  const loadChainConfig = useCallback(
    async (forceRefresh = false) => {
      if (loadingRef.current && !forceRefresh) {
        return;
      }

      try {
        loadingRef.current = true;
        setIsLoading(true);
        setError(null);

        const now = Date.now();
        const cachedConfig = localStorage.getItem('ontello-chain-config');

        if (!forceRefresh && cachedConfig) {
          const parsed = JSON.parse(cachedConfig);
          if (parsed && parsed.lastUpdated && now - parsed.lastUpdated < CACHE_DURATION) {
            setIsLoading(false);
            loadingRef.current = false;
            return;
          }
        }

        const response = await walletApi.walletdataChainConfigGet();

        if (response.error.code !== '0') {
          throw new Error(`API Error: ${response.error.message}`);
        }

        setChainConfig({
          chains: response.result,
          lastUpdated: now,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        // eslint-disable-next-line no-console
        console.error('Failed to load chain configuration:', err);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [setChainConfig, setIsLoading, setError]
  );

  const isChainSupported = useCallback(
    (chainId: number) => availableChains.some((chain) => chain.chainId === chainId),
    [availableChains]
  );

  const getChainConfig = useCallback(
    (chainId: number) => {
      const config = availableChains.find((chain) => chain.chainId === chainId);
      if (!config) {
        throw new Error(`Chain config not found for chainId: ${chainId}`);
      }
      return config;
    },
    [availableChains]
  );

  useEffect(() => {
    if (!chainConfig && !isLoading && !loadingRef.current) {
      loadChainConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    chainConfig,
    availableChains,
    mainChainConfig,
    isLoading,
    error,

    loadChainConfig,
    isChainSupported,
    getChainConfig,
    refreshConfig: () => loadChainConfig(true),
  };
};
