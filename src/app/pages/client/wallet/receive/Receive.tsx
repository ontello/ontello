import React, { useMemo } from 'react';
// import { useFetchPasskeyList } from '../../../../hooks/useFetchPasskeyList';
import { useTokensContext } from '../../../../hooks/wallet/useTokens';
import { useChainConfig } from '../../../../hooks/web3/useChainConfig';
import { ReceiveUi, ReceiveChainInfo } from '../../../../components/wallet/ReceiveUi';
import { getAuthExtras } from '@src/app/state/authExtras';

export function Receive({ onClose }: { onClose: () => void }) {
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
