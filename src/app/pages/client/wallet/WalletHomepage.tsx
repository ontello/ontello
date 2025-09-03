import React, { useRef, useState } from 'react';
import { Box, Icon, Text, config } from 'folds';
import { mxidToOntid } from '@src/app/utils/ontid';
import { useMatrixClient } from '@src/app/hooks/useMatrixClient';
import { useFetchPasskeyList } from '@src/app/hooks/useFetchPasskeyList';
import { formatAddress } from '@src/app/utils/formatData';

import { PageNavContent } from '../../../components/page';
import { WalletNavMode } from '../../../../types/wallet/types';
import { ContainerColor } from '../../../styles/ContainerColor.css';
import OntIdIconSvg from '../../../static/icons/svgs/ONTID.svg';
import TopUp from '../../../static/icons/TopUp';
import Send from '../../../static/icons/Send';
import { TokensAndActivities } from './tokensAndActivities';
import { Receive } from './receive/Receive';
import { useTokensContext } from '../../../hooks/wallet/useTokens';

export function WalletHomepage({
  setWalletNavMode,
}: {
  setWalletNavMode: (mode: WalletNavMode) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showReceive, setShowReceive] = useState(false);
  const { totalTokensCurrency } = useTokensContext();

  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const ontId = mxidToOntid(userId!);
  const [passkeyData] = useFetchPasskeyList(userId!);

  return (
    <Box grow="Yes" direction="Column" className={ContainerColor({ variant: 'Surface' })}>
      <PageNavContent scrollRef={scrollRef}>
        <Box direction="Column" gap="300">
          <Box>
            <Text size="H1" style={{ fontWeight: '500' }}>
              ${totalTokensCurrency.toFixed(2)}
            </Text>
          </Box>

          <Box gap="100">
            <img src={OntIdIconSvg} alt="ONTID" />
            <Text size="T300">{ontId}</Text>
          </Box>

          <Box>
            <Text size="T300">{formatAddress(passkeyData?.walletAddress || '', 15, 6)}</Text>
          </Box>

          <Box gap="300">
            <Box
              grow="Yes"
              shrink="Yes"
              basis="No"
              gap="200"
              alignItems="Center"
              justifyContent="Center"
              className={ContainerColor({ variant: 'SurfaceVariant' })}
              style={{ height: '52px', borderRadius: config.radii.R400, cursor: 'pointer' }}
              onClick={() => setShowReceive(true)}
            >
              <Icon src={TopUp} size="Inherit" style={{ fontSize: '12px' }} />
              <Text size="T200">Top up</Text>
            </Box>
            <Box
              grow="Yes"
              shrink="Yes"
              basis="No"
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

          <TokensAndActivities />
        </Box>
      </PageNavContent>
      {showReceive && <Receive onClose={() => setShowReceive(false)} />}
    </Box>
  );
}
