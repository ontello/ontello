import React from 'react';
import { Box, Button, Text } from 'folds';
import { SendNavMode } from '../types';

export function SelectToAddress({
  setSendNavMode,
}: {
  setSendNavMode: (mode: SendNavMode) => void;
}) {
  return (
    <Box direction="Column" gap="300">
      <Text size="H4">This is Select To address Page</Text>
      <Button onClick={() => setSendNavMode(SendNavMode.SendMain)}>Back</Button>
    </Box>
  );
}
