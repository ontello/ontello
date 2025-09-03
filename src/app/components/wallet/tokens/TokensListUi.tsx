import React from 'react';
import { Box } from 'folds';
import { TokenItem } from './TokenItem';
import { TokenWithChain } from '../../../../types/wallet/types';

export function TokensListUi({
  tokensList,
  onSelect,
}: {
  tokensList: TokenWithChain[];
  onSelect: (token: TokenWithChain) => void;
}) {
  return (
    <Box direction="Column" gap="300" style={{ marginTop: '10px' }}>
      {tokensList.map((token) => (
        <TokenItem key={token.name + token.tokenAddr} token={token} onSelect={onSelect} />
      ))}
    </Box>
  );
}
