import React from 'react';
import { Box, Text } from 'folds';
import { AssetAndChainIcon } from '../AssetAndChainIcon';
import { TokenWithChain } from '../../../../types/wallet/types';

export function TokenItem({
  token,
  onSelect,
}: {
  token: TokenWithChain;
  onSelect: (token: TokenWithChain) => void;
}) {
  return (
    <Box style={{ width: '100%', cursor: 'pointer' }} onClick={() => onSelect(token)}>
      <Box gap="200" shrink="Yes" grow="Yes" alignItems="Center">
        <AssetAndChainIcon asset={token.icon} chain={token.chain?.iconUrls?.[0]} />
        <Box>
          <Text size="H6">{token.name}</Text>
        </Box>
      </Box>
      <Box direction="Column" shrink="No">
        <Text size="B400" align="Right">
          ${token.currency}
        </Text>
        <Text size="T200" align="Right" priority="300">
          {token.balance} {token.symbol}
        </Text>
      </Box>
    </Box>
  );
}
