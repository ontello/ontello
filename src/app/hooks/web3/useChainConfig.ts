import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { walletApi } from '@src/app/externalApis';
import {
  chainConfigAtom,
  isLoadingChainConfigAtom,
  chainConfigErrorAtom,
  availableChainsAtom,
} from '../../state/web3/chainConfig';

const CACHE_DURATION = 60 * 60 * 1000;

export const useChainConfig = () => {
  const [chainConfig, setChainConfig] = useAtom(chainConfigAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingChainConfigAtom);
  const [error, setError] = useAtom(chainConfigErrorAtom);
  const [availableChains] = useAtom(availableChainsAtom);

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

  useEffect(() => {
    if (!chainConfig && !isLoading && !loadingRef.current) {
      loadChainConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    chainConfig,
    availableChains,
    isLoading,
    error,

    loadChainConfig,
    isChainSupported,
    refreshConfig: () => loadChainConfig(true),
  };
};
