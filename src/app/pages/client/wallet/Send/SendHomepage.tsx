import React from 'react';
import { Box, Button, Text } from 'folds';
import { SendNavMode, WalletNavMode } from '../types';

export function SendHomepage({
  setWalletNavMode,
  setSendNavMode,
}: {
  setWalletNavMode: (mode: WalletNavMode) => void;
  setSendNavMode: (mode: SendNavMode) => void;
}) {
  return (
    <Box direction="Column" gap="300">
      <Text size="H4">This is Send Homepage</Text>
      <Button onClick={() => setWalletNavMode(WalletNavMode.Main)}>Back</Button>
      <Button onClick={() => setSendNavMode(SendNavMode.SendSelectAsset)}>Select asset</Button>
      <Button onClick={() => setSendNavMode(SendNavMode.SendSelectToAddress)}>
        Select to address
      </Button>
    </Box>
  );
}
