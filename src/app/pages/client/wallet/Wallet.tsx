import React, { useRef } from 'react';
import { Box, Text } from 'folds';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import { PageNav, PageNavContent, PageNavHeader } from '../../../components/page';

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
  useNavToActivePathMapper('agent');
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <PageNav>
      <WalletHeader />
      <PageNavContent scrollRef={scrollRef}>
        <Box direction="Column" gap="300">
          <div
            style={{
              position: 'relative',
            }}
          >
            Hello
          </div>
        </Box>
      </PageNavContent>
    </PageNav>
  );
}
