import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Spinner, Text } from 'folds';
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

  const { syncOwner, getSyncStatus } = useOwnerManage(passkeyData?.walletAddress as `0x${string}`);

  const getSyncStatusRef = useRef(getSyncStatus);

  const syncOwnerRef = useRef(syncOwner);

  const [needSyncChainIds, setNeedSyncChainIds] = useState<number[]>([]);
  const [isGettingSyncStatus, setIsGettingSyncStatus] = useState(false);
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>([]);
  const prevChainIdsRef = useRef<number[]>([]);

  // Deep compare arrays
  const areArraysEqual = (arr1: number[], arr2: number[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
  };

  useEffect(() => {
    // If the content has not changed, do not re-fetch data
    if (areArraysEqual(prevChainIdsRef.current, chainIds)) {
      return;
    }
    prevChainIdsRef.current = [...chainIds];

    setIsGettingSyncStatus(true);
    getSyncStatusRef
      .current(chainIds)
      .then((syncStatus) => {
        const needSyncIds = chainIds.filter((chainId) => !syncStatus[chainId]);
        setNeedSyncChainIds(needSyncIds);
        setSelectedChainIds(needSyncIds);
      })
      .finally(() => {
        setIsGettingSyncStatus(false);
      });
  }, [chainIds]);

  const { availableChains } = useChainConfig();
  const chains = useMemo(
    () => availableChains.filter((chain) => needSyncChainIds.includes(chain.chainId)),
    [availableChains, needSyncChainIds]
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

  const customBody = useMemo(() => {
    if (isGettingSyncStatus) {
      return (
        <Box
          direction="Column"
          gap="600"
          alignItems="Center"
          justifyContent="Center"
          style={{ minHeight: '200px' }}
        >
          <Spinner size="200" />
          <Text size="T300">Checking sync status...</Text>
        </Box>
      );
    }

    if (chains.length === 0) {
      return (
        <Box
          direction="Column"
          gap="200"
          alignItems="Center"
          justifyContent="Center"
          style={{ minHeight: '200px' }}
        >
          <Text size="T300">All chains are already synced.</Text>
        </Box>
      );
    }
    return undefined;
  }, [chains, isGettingSyncStatus]);

  const description = useMemo(
    () =>
      `You've modified the ownership of Signers on your wallet. You’ll need to sync these changes so they take effect on ${
        chains.length > 1 ? 'other' : chains[0]?.chainNameView
      } ${chains.length > 1 ? 'chains' : 'chain'}.`,
    [chains]
  );

  return (
    <SyncDialog
      title="Sync Ownership Change"
      customBody={customBody}
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
