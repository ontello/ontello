import React, { useRef, useState } from 'react';
import { Box, Button, Text } from 'folds';
import { PageNavContent } from '../../../../components/page';
import { WalletNavMode, SendNavMode } from '../types';
import { SelectAsset } from './SelectAsset';
import { SelectToAddress } from './SelectToAddress';

export function Send({ setWalletNavMode }: { setWalletNavMode: (mode: WalletNavMode) => void }) {
  const [sendNavMode, setSendNavMode] = useState<SendNavMode>(SendNavMode.SendMain);

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <PageNavContent scrollRef={scrollRef}>
      {sendNavMode === SendNavMode.SendMain && (
        <Box direction="Column" gap="300">
          <Text size="H4">This is Send Homepage</Text>
          <Button onClick={() => setWalletNavMode(WalletNavMode.Main)}>Back</Button>
          <Button onClick={() => setSendNavMode(SendNavMode.SendSelectAsset)}>Select asset</Button>
          <Button onClick={() => setSendNavMode(SendNavMode.SendSelectToAddress)}>
            Select to address
          </Button>
        </Box>
      )}
      {sendNavMode === SendNavMode.SendSelectAsset && (
        <SelectAsset setSendNavMode={setSendNavMode} />
      )}
      {sendNavMode === SendNavMode.SendSelectToAddress && (
        <SelectToAddress setSendNavMode={setSendNavMode} />
      )}
    </PageNavContent>
  );
}
