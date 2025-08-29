import React, { useRef } from 'react';
import { Box, Button, Text } from 'folds';
import { openReviewTransfer } from '@src/client/action/navigation';
import { PageNavContent } from '../../../components/page';
import { WalletNavMode } from './types';

function TestComponent() {
  const handleTestTransfer = () => {
    const testData = {
      token: {
        address: '0xd878dfE2b33A07E7FB290c1578A0b3cbc8aDadEA',
        name: 'USDT',
        amount: '0.01',
        decimals: 18,
        usdValue: '0.01',
        icon: 'https://testnet.bscscan.com/assets/bsc/images/svg/empty-token.svg?v=25.8.3.1',
      },
      recipient: {
        address: '0x6cfa3DFD6c34426382E049dCfaf3326fEBfe52F4',
        ontId: 'test.ont.id',
        ens: 'test.eth',
        avatar: 'https://example.com/avatar.png',
      },
      chainId: 97,
      feeAddress: '0xd878dfE2b33A07E7FB290c1578A0b3cbc8aDadEA',
    };

    openReviewTransfer(testData);
  };

  return <Button onClick={handleTestTransfer}>测试 Review Transfer</Button>;
}

export function WalletSend({ setNavMode }: { setNavMode: (mode: WalletNavMode) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <PageNavContent scrollRef={scrollRef}>
      <Box direction="Column" gap="300">
        <Button onClick={() => setNavMode(WalletNavMode.Main)}>Back</Button>
        <Text size="H4">Send</Text>
      </Box>
      <TestComponent />
    </PageNavContent>
  );
}
