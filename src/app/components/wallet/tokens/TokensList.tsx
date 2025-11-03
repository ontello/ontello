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
  onSelect: ((token: TokenWithChain) => void) | null;
}) {
  const [tokensForSelectedNetwork, setTokensForSelectedNetwork] = useState<TokenWithChain[]>([]);
  const { tokens } = useTokensContext();

  useEffect(() => {
    if (filterChainId === AllChainId) {
      setTokensForSelectedNetwork(tokens);
    } else {
      setTokensForSelectedNetwork(tokens.filter((token) => token.chainId === filterChainId));
    }
  }, [filterChainId, tokens]);

  return (
    <Box direction="Column" gap="300" style={{ marginTop: '10px' }}>
      <TokensListUi tokensList={tokensForSelectedNetwork} onSelect={onSelect} />
    </Box>
  );
}
