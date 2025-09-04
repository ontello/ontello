import React, { useMemo, useState } from 'react';
import { Box, config, Text } from 'folds';
import { AssetAndChainIcon } from '../AssetAndChainIcon';
import { useChainConfig } from '../../../hooks/web3/useChainConfig';
import { Token, TokenWithChain } from '../../../../types/wallet/types';
import { ContainerColor } from '../../../styles/ContainerColor.css';

export function TokenItem({
  token,
  onSelect,
  showHoverBg = true,
}: {
  token: Token;
  onSelect: ((token: TokenWithChain) => void) | null;
  showHoverBg?: boolean;
}) {
  const { availableChains } = useChainConfig();
  const [isHovered, setIsHovered] = useState(false);

  const tokenChain = useMemo(
    () => availableChains.find((chain) => chain.chainId === token.chainId),
    [availableChains, token.chainId]
  );
  const tokenWithChain = useMemo(() => ({ ...token, chain: tokenChain }), [token, tokenChain]);

  return (
    <Box
      style={{
        width: '100%',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'background-color 0.2s ease',
        borderRadius: config.radii.R300,
        padding: `${config.space.S200} ${config.space.S100}`,
      }}
      onClick={() => onSelect?.(tokenWithChain)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={onSelect && showHoverBg && isHovered ? ContainerColor({ variant: 'Primary' }) : ''}
    >
      <Box gap="200" shrink="Yes" grow="Yes" alignItems="Center">
        <AssetAndChainIcon asset={token.icon} chain={tokenChain?.iconUrls?.[0]} />
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
