import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Spinner, Text } from 'folds';
import { useChainConfig } from '@src/app/hooks/web3/useChainConfig';
import { useAsyncCallback, AsyncStatus } from '@src/app/hooks/useAsyncCallback';
import { FeeSessionResp } from '@src/app/externalApis';
import { useOwnerManage } from '@src/app/hooks/web3/useOwnerManage';
import { useCloseGlobalDialog, useGlobalDialogState } from '@src/app/state/hooks/globalDialogs';
import { GlobalDialogType } from '@src/app/state/globalDialogs';
import { SyncDialog, SyncStatus } from './SyncDialog';
import { Address } from 'viem';
import { AUTH_EXTRA_KEYS } from '@src/app/state/authExtras';

export interface SyncOwnershipDialogData {
  chainIds: number[];
  onSuccess?: () => void;
  onClose?: () => void;
}

export function SyncOwnershipChangeDialog() {
  const dialogData = useGlobalDialogState(GlobalDialogType.SyncOwnershipChange);
  const closeDialog = useCloseGlobalDialog(GlobalDialogType.SyncOwnershipChange);

  const aaAddress = localStorage.getItem(AUTH_EXTRA_KEYS.AA_ADDRESS) as Address;

  const { syncOwner, getSyncStatus, checkOwnerInitial, getDeploymentStatus } =
    useOwnerManage(aaAddress);

  const getSyncStatusRef = useRef(getSyncStatus);
  const checkOwnerInitialRef = useRef(checkOwnerInitial);
  const getDeploymentStatusRef = useRef(getDeploymentStatus);

  const syncOwnerRef = useRef(syncOwner);

  const [needSyncChainIds, setNeedSyncChainIds] = useState<number[]>([]);
  const [isGettingSyncStatus, setIsGettingSyncStatus] = useState(false);
  const [selectedChainIds, setSelectedChainIds] = useState<number[]>([]);
  const prevChainIdsRef = useRef<number[]>([]);
  const [status, setStatus] = useState<SyncStatus>(SyncStatus.Init);

  // Deep compare arrays
  const areArraysEqual = (arr1: number[], arr2: number[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
  };

  const resetDialogState = useCallback(() => {
    setNeedSyncChainIds([]);
    setSelectedChainIds([]);
    setIsGettingSyncStatus(false);
    setStatus(SyncStatus.Init);
    prevChainIdsRef.current = [];
  }, []);

  const onCloseWithStatus = useCallback(
    (status?: SyncStatus) => {
      if (!dialogData) {
        throw Error('dialogData is undefined');
      }
      if (status === SyncStatus.Success) {
        dialogData.onSuccess?.();
        closeDialog();
      } else if (status === SyncStatus.NoSyncNeeded) {
        dialogData.onSuccess?.();
      } else {
        dialogData.onClose?.();
        closeDialog();
      }
      resetDialogState();
    },
    [closeDialog, dialogData, resetDialogState]
  );

  useEffect(() => {
    if (!dialogData) {
      return;
    }

    resetDialogState();
    const targetChainIds = dialogData.chainIds;
    if (!targetChainIds.length) {
      onCloseWithStatus(SyncStatus.Success);
      return;
    }

    // If the content has not changed, do not re-fetch data
    if (areArraysEqual(prevChainIdsRef.current, targetChainIds)) {
      return;
    }
    prevChainIdsRef.current = [...targetChainIds];

    setIsGettingSyncStatus(true);
    Promise.all([
      getSyncStatusRef.current(targetChainIds),
      checkOwnerInitialRef.current(),
      getDeploymentStatusRef.current(targetChainIds),
    ])
      .then(([syncStatus, isOwnerInitial, deploymentStatus]) => {
        const needSyncIds = targetChainIds.filter((chainId) => {
          if (deploymentStatus[chainId] === false) return true;
          if (isOwnerInitial) return false;
          return !syncStatus[chainId];
        });
        if (!needSyncIds.length) {
          setStatus(SyncStatus.NoSyncNeeded);
          onCloseWithStatus(SyncStatus.NoSyncNeeded);
          return;
        }
        setNeedSyncChainIds(needSyncIds);
        setSelectedChainIds(needSyncIds);
      })
      .catch((error) => {
        console.error(error);
        onCloseWithStatus();
      })
      .finally(() => {
        setIsGettingSyncStatus(false);
      });
  }, [dialogData, onCloseWithStatus, resetDialogState]);

  const { availableChains } = useChainConfig();
  const chains = useMemo(
    () => availableChains.filter((chain) => needSyncChainIds.includes(chain.chainId)),
    [availableChains, needSyncChainIds]
  );

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

  if (!dialogData) {
    return null;
  }

  return (
    <SyncDialog
      title="Sync ownership change"
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
      aaAddress={aaAddress}
      status={status}
      setStatus={setStatus}
    />
  );
}
