import React, { useRef } from 'react';
import { Box, Icon, Text, config } from 'folds';
import { PageNavContent } from '../../../components/page';
import { WalletNavMode } from './types';
import { ContainerColor } from '../../../styles/ContainerColor.css';
import OntIdIconSvg from '../../../static/icons/svgs/ONTID.svg';
import TopUp from '../../../static/icons/TopUp';
import Send from '../../../static/icons/Send';

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
          <Box>
            <Text size="H1" style={{ fontWeight: '500' }}>
              $0.00
            </Text>
          </Box>
          <Box gap="100">
            <img src={OntIdIconSvg} alt="ONTID" />
            <Text size="T300">Chichi.ont.id</Text>
          </Box>
          <Box>
            <Text size="T300">0xAdsdQnSGNfA43...GCh91s</Text>
          </Box>
          <Box gap="300">
            <Box
              grow="Yes"
              gap="200"
              alignItems="Center"
              justifyContent="Center"
              className={ContainerColor({ variant: 'SurfaceVariant' })}
              style={{ height: '52px', borderRadius: config.radii.R400 }}
            >
              <Icon src={TopUp} size="Inherit" style={{ fontSize: '12px' }} />
              <Text size="T200">Top up</Text>
            </Box>
            <Box
              grow="Yes"
              gap="200"
              alignItems="Center"
              justifyContent="Center"
              className={ContainerColor({ variant: 'SurfaceVariant' })}
              style={{ height: '52px', borderRadius: config.radii.R400, cursor: 'pointer' }}
              onClick={() => setWalletNavMode(WalletNavMode.Send)}
            >
              <Icon src={Send} size="Inherit" style={{ fontSize: '12px' }} />
              <Text size="T200">Send</Text>
            </Box>
          </Box>
        </Box>
      </PageNavContent>
    </Box>
  );
}
