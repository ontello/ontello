import React, { useMemo } from 'react';
import { useTokensContext } from '../../../../hooks/wallet/useTokens';
import { useChainConfig } from '../../../../hooks/web3/useChainConfig';
import { ReceiveUi, ReceiveChainInfo } from '../../../../components/wallet/ReceiveUi';
import { getAuthExtras } from '@src/app/state/authExtras';
import { useCloseGlobalDialog, useGlobalDialogState } from '@src/app/state/hooks/globalDialogs';
import { GlobalDialogType } from '@src/app/state/globalDialogs';

function ReceiveContent({ onClose, chainId }: { onClose: () => void; chainId?: number }) {
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

  return <ReceiveUi onClose={onClose} chainsWithOtherInfo={receiveChainInfos} chainId={chainId} />;
}

export function Receive() {
  const dialogData = useGlobalDialogState(GlobalDialogType.Receive);
  const closeDialog = useCloseGlobalDialog(GlobalDialogType.Receive);

  if (!dialogData) return null;

  return <ReceiveContent onClose={closeDialog} chainId={dialogData.chainId} />;
}
