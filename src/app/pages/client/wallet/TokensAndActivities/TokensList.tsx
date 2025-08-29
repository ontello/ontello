import React from 'react';
import { Box } from 'folds';
import { TokenItem } from './TokenItem';
import { TokenWithChain } from '../types';

export function TokensList({ tokens }: { tokens: TokenWithChain[] }) {
  return (
    <Box direction="Column" gap="300" style={{ marginTop: '10px' }}>
      {tokens.map((token) => (
        <TokenItem key={token.symbol} token={token} />
      ))}
    </Box>
  );
}
