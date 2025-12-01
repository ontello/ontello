import React, { useState } from 'react';
import { Box, Text } from 'folds';
import { PageNav, PageNavHeader } from '../../../components/page';
import { WalletHomepage } from './WalletHomepage';
import { Send } from './send/Send';
import { WalletNavMode } from '../../../../types/wallet/types';
import { TokensProvider, useTokens } from '../../../hooks/wallet/useTokens';
import { AgentLogo } from '../../../components/wallet/AgentLogo';
import { useScreenSizeContext, ScreenSize } from '../../../hooks/useScreenSize';

function WalletHeader() {
  const screenSize = useScreenSizeContext();
  const isMobile = screenSize === ScreenSize.Mobile;

  return (
    <PageNavHeader>
      <Box alignItems="Center" justifyContent="SpaceBetween" grow="Yes" gap="300">
        <Box grow="Yes">
          <Text size="H4" truncate>
            Smart wallet
          </Text>
        </Box>
        {isMobile && <AgentLogo />}
      </Box>
    </PageNavHeader>
  );
}

export function Wallet() {
  const [walletNavMode, setWalletNavMode] = useState<WalletNavMode>(WalletNavMode.Main);
  const tokensContext = useTokens();

  return (
    <TokensProvider value={tokensContext}>
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
