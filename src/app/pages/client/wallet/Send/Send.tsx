import React, { useRef, useState } from 'react';
import { Box, Button, Text } from 'folds';
import { openReviewTransfer } from '@src/client/action/navigation';
import { PageNavContent } from '../../../../components/page';
import { WalletNavMode, SendNavMode, TokenWithChain } from '../types';
import { SelectAsset } from './SelectAsset';
import { SelectToAddress } from './SelectToAddress';
import { Back } from '../../../../components/ontello/Back';
import { ContainerColor } from '../../../../styles/ContainerColor.css';
import { TokenItem } from '../components/TokenItem';

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

  return <Button onClick={handleTestTransfer}>Review Transfer</Button>;
}

export function Send({ setWalletNavMode }: { setWalletNavMode: (mode: WalletNavMode) => void }) {
  const [sendNavMode, setSendNavMode] = useState<SendNavMode>(SendNavMode.SendMain);
  const [selectedToken, setSelectedToken] = useState<TokenWithChain | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Box grow="Yes" direction="Column" className={ContainerColor({ variant: 'Surface' })}>
      <PageNavContent scrollRef={scrollRef}>
        {sendNavMode === SendNavMode.SendMain && (
          <Box direction="Column" gap="300">
            <Back onClick={() => setWalletNavMode(WalletNavMode.Main)}>
              <Text size="H5" align="Center" style={{ width: '100%' }}>
                Send
              </Text>
            </Back>
            <Text size="H4">This is Send Homepage</Text>
            <Button onClick={() => setSendNavMode(SendNavMode.SendSelectAsset)}>
              Select asset
            </Button>
            {selectedToken && (
              <TokenItem
                token={selectedToken}
                onSelect={() => setSendNavMode(SendNavMode.SendSelectAsset)}
              />
            )}
            <Button onClick={() => setSendNavMode(SendNavMode.SendSelectToAddress)}>
              Select to address
            </Button>
          </Box>
        )}
        {sendNavMode === SendNavMode.SendSelectAsset && (
          <SelectAsset setSendNavMode={setSendNavMode} setSelectedToken={setSelectedToken} />
        )}
        {sendNavMode === SendNavMode.SendSelectToAddress && (
          <SelectToAddress setSendNavMode={setSendNavMode} />
        )}
      </PageNavContent>

      <TestComponent />
    </Box>
  );
}
