import React from 'react';
import { Box, Text } from 'folds';
import { EnsData } from '@src/app/externalApis/models/EnsData';
import { AvatarForAddress } from '@src/app/components/wallet/AvatarForAddress';

export function AvatarAndEnsData({ ensData }: { ensData: EnsData }) {
  return (
    <Box direction="Row" gap="100">
      <Box>
        <AvatarForAddress address={ensData.addr} />
      </Box>
      <Box direction="Column" gap="100">
        <Text size="H5">{ensData.domain}</Text>
        <Text size="H5">{ensData.addr}</Text>
      </Box>
    </Box>
  );
}
