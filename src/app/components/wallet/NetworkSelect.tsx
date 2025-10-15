import React, { useMemo } from 'react';
import { useChainConfig } from '../../hooks/web3/useChainConfig';
import { AllChainId } from '../../../types/wallet/const';
import { useTokensContext } from '../../hooks/wallet/useTokens';
import { ChainConfigWithTotalCurrency } from '../../../types/wallet/types';
import { NetworkSelectUi } from './NetworkSelectUi';

export function NetworkSelect({
  selectedChainId,
  onSelect,
  hideAllNetwork = false,
  showTotalCurrency = false,
}: {
  selectedChainId: number;
  onSelect: (chainId: number) => void;
  hideAllNetwork?: boolean;
  showTotalCurrency?: boolean;
}) {
  const { availableChains } = useChainConfig();
  const { tokens } = useTokensContext();

  const allChainsWithTotalCurrency: ChainConfigWithTotalCurrency[] = useMemo(
    () => [
      ...(hideAllNetwork
        ? []
        : [
            {
              chainId: AllChainId,
              chainName: 'All Networks',
              chainNameView: 'All Networks',
              iconUrls: [],
              blockExplorerUrls: [],
            } as unknown as ChainConfigWithTotalCurrency,
          ]),
      ...availableChains
        .map((chain) => ({
          ...chain,
          totalCurrency: showTotalCurrency
            ? tokens
                .filter((token) => token.chainId === chain.chainId)
                .reduce((acc, token) => acc + Number(token.currency || 0), 0)
                .toFixed(2)
            : undefined,
        }))
        .sort((a, b) => Number(b.totalCurrency || 0) - Number(a.totalCurrency || 0)),
    ],
    [availableChains, hideAllNetwork, tokens, showTotalCurrency]
  );

  return (
    <NetworkSelectUi
      networks={allChainsWithTotalCurrency}
      selectedChainId={selectedChainId}
      onSelect={onSelect}
      showTotalCurrency={showTotalCurrency}
    />
  );
}
