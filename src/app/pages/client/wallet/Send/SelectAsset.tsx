import React from 'react';
import { Box, Button, Text } from 'folds';
import { SendNavMode } from '../types';
import { Back } from '../../../../components/ontello/Back';

export function SelectAsset({ setSendNavMode }: { setSendNavMode: (mode: SendNavMode) => void }) {
  return (
    <Box direction="Column" gap="300">
      <Back onClick={() => setSendNavMode(SendNavMode.SendMain)}>
        <Text size="H5" align="Center" style={{ width: '100%' }}>
          Select asset
        </Text>
      </Back>
      <Text size="H4">This is Select Asset Page</Text>
    </Box>
  );
}
