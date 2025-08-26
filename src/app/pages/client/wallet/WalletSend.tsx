import React, { useRef } from 'react';
import { Box, Button, Text } from 'folds';
import { PageNavContent } from '../../../components/page';
import { WalletNavMode } from './types';

export function WalletSend({ setNavMode }: { setNavMode: (mode: WalletNavMode) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <PageNavContent scrollRef={scrollRef}>
      <Box direction="Column" gap="300">
        <Button onClick={() => setNavMode(WalletNavMode.Main)}>Back</Button>
        <Text size="H4">Send</Text>
      </Box>
    </PageNavContent>
  );
}
