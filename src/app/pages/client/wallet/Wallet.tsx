import React, { useState } from 'react';
import { Box, Text } from 'folds';
import { PageNav, PageNavHeader } from '../../../components/page';
import { WalletHomepage } from './WalletHomepage';
import { WalletSend } from './WalletSend';
import { WalletNavMode } from './types';

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
  const [navMode, setNavMode] = useState<WalletNavMode>(WalletNavMode.Main);

  return (
    <PageNav size="501">
      <WalletHeader />
      {navMode === WalletNavMode.Main && <WalletHomepage setNavMode={setNavMode} />}
      {navMode === WalletNavMode.Send && <WalletSend setNavMode={setNavMode} />}
    </PageNav>
  );
}
