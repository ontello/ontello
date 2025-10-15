import React, { useMemo } from 'react';
import { useFetchPasskeyList } from '../../../../hooks/useFetchPasskeyList';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { useTokensContext } from '../../../../hooks/wallet/useTokens';
import { useChainConfig } from '../../../../hooks/web3/useChainConfig';
import { ReceiveUi, ReceiveChainInfo } from '../../../../components/wallet/ReceiveUi';

export function Receive({ onClose }: { onClose: () => void }) {
  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId!);
  const { tokens } = useTokensContext();
  const { availableChains } = useChainConfig();

  const receiveChainInfos: ReceiveChainInfo[] = useMemo(
    () =>
      availableChains.map((chain) => ({
        ...chain,
        address: passkeyData?.walletAddress || '',
        supportedAssets: tokens.filter((token) => token.chainId === chain.chainId),
      })),
    [availableChains, passkeyData?.walletAddress, tokens]
  );

  return <ReceiveUi onClose={onClose} chainsWithOtherInfo={receiveChainInfos} />;
}
