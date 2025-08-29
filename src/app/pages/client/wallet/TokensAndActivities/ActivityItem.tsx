import React from 'react';
import { Box, Text } from 'folds';
import { AssetAndChainIcon } from '../../../../components/wallet/AssetAndChainIcon';
import bsc from './testImgs/bsc.svg';
import usdt from './testImgs/usdt.svg';

export function ActivityItem() {
  return (
    <Box justifyContent="SpaceBetween" alignItems="Center" gap="300">
      <Box gap="100" alignItems="Center">
        <AssetAndChainIcon asset={usdt} chain={bsc} />
        <Box direction="Column">
          <Text>Sent</Text>
          <Text>Confirmed</Text>
        </Box>
      </Box>

      <Box>
        <Text>-10 USDT</Text>
      </Box>
    </Box>
  );
}
