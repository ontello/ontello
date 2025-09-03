import React, { useEffect, useState } from 'react';
import { Box } from 'folds';
import { TokenItem } from './TokenItem';
import { TokenWithChain } from '../types';
import { useTokensContext } from '../hooks/useTokens';
import { AllChainId } from '../const';

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
      {tokensForSelectedNetwork.map((token) => (
        <TokenItem key={token.name + token.tokenAddr} token={token} onSelect={onSelect} />
      ))}
    </Box>
  );
}
