import React from 'react';
import { Box, Button, Text } from 'folds';
import { SendNavMode } from '../types';
import { Back } from '../../../../components/ontello/Back';

export function SelectToAddress({
  setSendNavMode,
}: {
  setSendNavMode: (mode: SendNavMode) => void;
}) {
  return (
    <Box direction="Column" gap="600">
      <Back onClick={() => setSendNavMode(SendNavMode.SendMain)}>
        <Text size="H5" align="Center" style={{ width: '100%' }}>
          Select to address
        </Text>
      </Back>
      <Box direction="Column" gap="300">
        <Text size="H4">This is Select To address Page</Text>
      </Box>
    </Box>
  );
}
