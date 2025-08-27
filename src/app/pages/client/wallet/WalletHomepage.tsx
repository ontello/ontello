import React, { useRef } from 'react';
import { Box, Button, Text, toRem } from 'folds';
import { PageNavContent } from '../../../components/page';
import { WalletNavMode } from './types';
import { ContainerColor } from '../../../styles/ContainerColor.css';

export function WalletHomepage({
  setWalletNavMode,
}: {
  setWalletNavMode: (mode: WalletNavMode) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Box grow="Yes" direction="Column" className={ContainerColor({ variant: 'Surface' })}>
      <PageNavContent scrollRef={scrollRef}>
        <Box direction="Column" gap="300">
          <div
            style={{
              position: 'relative',
              padding: toRem(12),
              borderRadius: toRem(8),
            }}
          >
            <Box grow="Yes" gap="300">
              <Text size="H4">$0.00</Text>
            </Box>
            <Box grow="Yes" gap="300">
              <Text size="H4">Chichi.ont.id</Text>
            </Box>
            <Box grow="Yes" gap="300">
              <Text size="B300">0xAdsdQnSGNfA43...GCh91s</Text>
            </Box>
            <Box grow="Yes" gap="300">
              <Box grow="Yes" gap="300" className={ContainerColor({ variant: 'SurfaceVariant' })}>
                <div
                  style={{
                    position: 'relative',
                    padding: toRem(12),
                    borderRadius: toRem(8),
                  }}
                >
                  <Button>Top up</Button>
                </div>
              </Box>
              <Box grow="Yes" gap="100" className={ContainerColor({ variant: 'SurfaceVariant' })}>
                <div
                  style={{
                    position: 'relative',
                    padding: toRem(12),
                    borderRadius: toRem(8),
                  }}
                >
                  <Button onClick={() => setWalletNavMode(WalletNavMode.Send)}>Send</Button>
                </div>
              </Box>
            </Box>
          </div>
        </Box>
      </PageNavContent>
    </Box>
  );
}
