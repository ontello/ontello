import React from 'react';
import { Box } from 'folds';

export function AssetAndChainIcon({
  asset,
  chain,
  assetSize = '36px',
  chainSize = '18px',
}: {
  asset: string | undefined;
  chain: string | undefined;
  assetSize?: string;
  chainSize?: string;
}) {
  return (
    <Box style={{ width: assetSize, height: assetSize, position: 'relative' }}>
      {asset && (
        <img
          src={asset}
          alt={asset}
          style={{
            width: assetSize,
            height: assetSize,
            borderRadius: '50%',
            objectFit: 'cover',
            overflow: 'hidden',
          }}
        />
      )}
      {chain && (
        <img
          src={chain}
          alt={chain}
          style={{
            width: chainSize,
            position: 'absolute',
            bottom: '0',
            right: '0',
            borderRadius: '50%',
            objectFit: 'cover',
            overflow: 'hidden',
          }}
        />
      )}
    </Box>
  );
}
