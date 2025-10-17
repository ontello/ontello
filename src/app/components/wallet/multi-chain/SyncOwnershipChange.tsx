import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useChainConfig } from '@src/app/hooks/web3/useChainConfig';
import { useAsyncCallback, AsyncStatus } from '@src/app/hooks/useAsyncCallback';
import { FeeSessionResp } from '@src/app/externalApis';
import { useFetchPasskeyList } from '@src/app/hooks/useFetchPasskeyList';
import { useMatrixClient } from '@src/app/hooks/useMatrixClient';
import { useOwnerManage } from '@src/app/hooks/web3/useOwnerManage';
import { SyncDialog } from './SyncDialog';

export function SyncOwnershipChange({
  chainIds,
  onClose,
}: {
  chainIds: number[];
  onClose: () => void;
}) {
  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId!);

  const { syncOwner } = useOwnerManage(passkeyData?.walletAddress as `0x${string}`);

  const { availableChains } = useChainConfig();
  const chains = useMemo(
    () => availableChains.filter((chain) => chainIds.includes(chain.chainId)),
    [availableChains, chainIds]
  );

  const [selectedChainIds, setSelectedChainIds] = useState<number[]>(
    chains.map((chain) => chain.chainId)
  );

  // Define the asynchronous function to fetch fee data
  const fetchFeeData = useCallback(async () => {
    if (!selectedChainIds.length) {
      return undefined;
    }

    const feeSession = await syncOwner(selectedChainIds);
    return feeSession;
  }, [selectedChainIds, syncOwner]);

  // Use useAsyncCallback to manage asynchronous state
  const [feeDataState, loadFeeData] = useAsyncCallback<FeeSessionResp | undefined, Error, []>(
    fetchFeeData
  );

  const feeSessionData = useMemo(() => {
    if (feeDataState.status !== AsyncStatus.Success) {
      return undefined;
    }
    return feeDataState.data;
  }, [feeDataState]);

  // Load fee data when chains change
  useEffect(() => {
    if (chains.length > 0) {
      loadFeeData();
    }
  }, [chains, loadFeeData]);

  const onDone = () => {
    onClose();
  };

  const onFail = () => {
    onClose();
  };

  const description = useMemo(
    () =>
      `You've modified the ownership of Signers on your OVM wallet. You’ll need to sync these changes so they take effect on ${
        chains.length > 1 ? 'other' : chains[0].chainNameView
      } ${chains.length > 1 ? 'chains' : 'chain'}.`,
    [chains]
  );

  return (
    <SyncDialog
      title="Sync Ownership Change"
      description={description}
      chains={chains}
      onClose={onClose}
      onDone={onDone}
      onFail={onFail}
      feeSessionData={feeSessionData}
      selectedChainIds={selectedChainIds}
      setSelectedChainIds={setSelectedChainIds}
      aaAddress={passkeyData?.walletAddress || ''}
    />
  );
}
