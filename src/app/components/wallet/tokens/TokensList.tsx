import React, { useEffect, useState } from 'react';
import { Box } from 'folds';
import { TokenWithChain } from '../../../../types/wallet/types';
import { useTokensContext } from '../../../hooks/wallet/useTokens';
import { AllChainId } from '../../../../types/wallet/const';
import { TokensListUi } from './TokensListUi';

export function TokensList({
  filterChainId,
  onSelect,
}: {
  filterChainId: number;
  onSelect: (token: TokenWithChain) => void;
}) {
  const [tokensForSelectedNetwork, setTokensForSelectedNetwork] = useState<TokenWithChain[]>([]);
  const { tokensWithChain, getTokens } = useTokensContext();

  useEffect(() => {
    const interval = setInterval(() => {
      getTokens();
    }, 5000);
    return () => clearInterval(interval);
  }, [getTokens]);

  useEffect(() => {
    if (filterChainId === AllChainId) {
      setTokensForSelectedNetwork(tokensWithChain);
    } else {
      setTokensForSelectedNetwork(
        tokensWithChain.filter((token) => token.chainId === filterChainId)
      );
    }
  }, [filterChainId, tokensWithChain]);

  return (
    <Box direction="Column" gap="300" style={{ marginTop: '10px' }}>
      <TokensListUi tokensList={tokensForSelectedNetwork} onSelect={onSelect} />
    </Box>
  );
}
