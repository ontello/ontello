import React from 'react';
import { Box } from 'folds';
import { TokenItem } from './TokenItem';
import { TokenWithChain } from '../../../../types/wallet/types';

export function TokensListUi({
  tokensList,
  onSelect,
  selectedToken,
}: {
  tokensList: TokenWithChain[];
  onSelect: ((token: TokenWithChain) => void) | null;
  selectedToken?: TokenWithChain | null;
}) {
  const isSelected = (token: TokenWithChain): boolean =>
    !!(
      selectedToken &&
      token.tokenAddr === selectedToken.tokenAddr &&
      token.chainId === selectedToken.chainId
    );

  return (
    <Box direction="Column" gap="200" style={{ marginTop: '10px' }}>
      {tokensList.map((token) => (
        <TokenItem
          key={token.name + token.tokenAddr + token.icon}
          token={token}
          onSelect={onSelect}
          isSelected={isSelected(token)}
        />
      ))}
    </Box>
  );
}
