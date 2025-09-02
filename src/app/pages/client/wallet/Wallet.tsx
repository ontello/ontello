import React, { useState } from 'react';
import { Box, Text } from 'folds';
import { PageNav, PageNavHeader } from '../../../components/page';
import { WalletHomepage } from './WalletHomepage';
import { Send } from './Send/Send';
import { WalletNavMode } from './types';
import { TokensProvider, useTokens } from './hooks/useTokens';

function WalletHeader() {
  return (
    <PageNavHeader>
      <Box alignItems="Center" grow="Yes" gap="300">
        <Box grow="Yes">
          <Text size="H4" truncate>
            Smart wallet
          </Text>
        </Box>
      </Box>
    </PageNavHeader>
  );
}

export function Wallet() {
  const [walletNavMode, setWalletNavMode] = useState<WalletNavMode>(WalletNavMode.Main);
  const { tokensWithChain, getTokens, mockDataFlag, setMockDataFlag } = useTokens();

  return (
    <TokensProvider value={{ tokensWithChain, getTokens, mockDataFlag, setMockDataFlag }}>
      <PageNav>
        <WalletHeader />
        {walletNavMode === WalletNavMode.Main && (
          <WalletHomepage setWalletNavMode={setWalletNavMode} />
        )}
        {walletNavMode === WalletNavMode.Send && <Send setWalletNavMode={setWalletNavMode} />}
      </PageNav>
    </TokensProvider>
  );
}
