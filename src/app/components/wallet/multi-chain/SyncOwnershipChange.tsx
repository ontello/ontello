import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChainConfig } from '@src/app/hooks/web3/useChainConfig';
import { useAsyncCallback, AsyncStatus } from '@src/app/hooks/useAsyncCallback';
import { FeeSessionResp } from '@src/app/externalApis';
import { useFetchPasskeyList } from '@src/app/hooks/useFetchPasskeyList';
import { useMatrixClient } from '@src/app/hooks/useMatrixClient';
import { useOwnerManage } from '@src/app/hooks/web3/useOwnerManage';
import { SyncDialog, SyncStatus } from './SyncDialog';

export function SyncOwnershipChange({
  chainIds,
  onClose,
  onSuccess,
}: {
  chainIds: number[];
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId!);

  const { syncOwner } = useOwnerManage(passkeyData?.walletAddress as `0x${string}`);

  const syncOwnerRef = useRef(syncOwner);

  const { availableChains } = useChainConfig();
  const chains = useMemo(
    () => availableChains.filter((chain) => chainIds.includes(chain.chainId)),
    [availableChains, chainIds]
  );

  const [selectedChainIds, setSelectedChainIds] = useState<number[]>(
    chains.map((chain) => chain.chainId)
  );

  const [status, setStatus] = useState<SyncStatus>(SyncStatus.Init);
  // Define the asynchronous function to fetch fee data
  const fetchFeeData = useCallback(async () => {
    if (!selectedChainIds.length) {
      return undefined;
    }

    const feeSession = await syncOwnerRef.current(selectedChainIds);
    return feeSession;
  }, [selectedChainIds]);

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

  const onEstimateFee = async () => {
    try {
      setStatus(SyncStatus.Loading);
      await loadFeeData();
      setStatus(SyncStatus.EstimatedFeeLoaded);
    } catch (error) {
      console.error(error);
      setStatus(SyncStatus.Init);
      throw error;
    }
  };

  const onCloseWithStatus = (closeStatus?: SyncStatus) => {
    if (closeStatus === SyncStatus.Success && onSuccess) {
      onSuccess?.();
    }
    onClose();
  };

  const onDone = () => {
    onCloseWithStatus(SyncStatus.Success);
  };

  const onFail = () => {
    setStatus(SyncStatus.Init);
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
      onEstimateFee={onEstimateFee}
      onClose={onCloseWithStatus}
      onDone={onDone}
      onFail={onFail}
      successText="Sync successful"
      failText="Sync failed"
      confirmButtonText="Sync"
      failButtonText="Try again"
      feeSessionData={feeSessionData}
      selectedChainIds={selectedChainIds}
      setSelectedChainIds={setSelectedChainIds}
      aaAddress={passkeyData?.walletAddress || ''}
      status={status}
      setStatus={setStatus}
    />
  );
}
