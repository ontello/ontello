import React, { useMemo } from 'react';
// import { useFetchPasskeyList } from '../../../../hooks/useFetchPasskeyList';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { useTokensContext } from '../../../../hooks/wallet/useTokens';
import { useChainConfig } from '../../../../hooks/web3/useChainConfig';
import { ReceiveUi, ReceiveChainInfo } from '../../../../components/wallet/ReceiveUi';
import { getAuthExtras } from '@src/app/state/authExtras';

export function Receive({ onClose }: { onClose: () => void }) {
  const mx = useMatrixClient();
  const userId = mx.getUserId();
  // const [passkeyData] = useFetchPasskeyList(userId!);
  const { aaAddress } = getAuthExtras();
  const { tokens } = useTokensContext();
  const { availableChains } = useChainConfig();

  const receiveChainInfos: ReceiveChainInfo[] = useMemo(
    () =>
      availableChains.map((chain) => ({
        ...chain,
        address: aaAddress || '',
        supportedAssets: tokens.filter((token) => token.chainId === chain.chainId),
      })),
    [availableChains, aaAddress, tokens]
  );

  return <ReceiveUi onClose={onClose} chainsWithOtherInfo={receiveChainInfos} />;
}
