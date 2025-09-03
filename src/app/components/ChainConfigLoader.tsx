import { ReactNode, useEffect } from 'react';
import { useChainConfig } from '../hooks/web3/useChainConfig';

type ChainConfigLoaderProps = {
  fallback?: () => ReactNode;
  error?: (err: string, retry: () => void) => ReactNode;
  children: () => ReactNode;
};

export function ChainConfigLoader({ fallback, error, children }: ChainConfigLoaderProps) {
  const { availableChains, isLoading, error: chainError, loadChainConfig } = useChainConfig();

  useEffect(() => {
    if (!isLoading && availableChains.length === 0 && !chainError) {
      loadChainConfig();
    }
  }, [isLoading, availableChains.length, chainError, loadChainConfig]);

  if (isLoading) {
    return fallback ? fallback() : null;
  }

  if (chainError && availableChains.length === 0) {
    return error ? error(chainError, () => loadChainConfig(true)) : null;
  }

  return children();
}
