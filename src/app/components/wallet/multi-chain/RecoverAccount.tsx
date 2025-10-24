import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChainConfig } from '@src/app/hooks/web3/useChainConfig';
import { useAsyncCallback, AsyncStatus } from '@src/app/hooks/useAsyncCallback';
import { FeeSessionResp } from '@src/app/externalApis';
import { useOwnerManage } from '@src/app/hooks/web3/useOwnerManage';
import { SyncDialog, SyncStatus } from './SyncDialog';

export function RecoverAccount({
  username,
  aaAddress,
  recoveryPhrase,
  onSuccess,
  onClose,
}: {
  username: string;
  aaAddress: string;
  recoveryPhrase: string;
  onSuccess?: () => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<SyncStatus>(SyncStatus.Init);
  const { availableChains } = useChainConfig();
  const { addOwnerByPublicKey } = useOwnerManage(aaAddress as `0x${string}`);
  const addOwnerByPublicKeyRef = useRef(addOwnerByPublicKey);

  const [selectedChainIds, setSelectedChainIds] = useState<number[]>(
    availableChains.map((chain) => chain.chainId)
  );

  const chainsNotAllowedToSelect = useMemo(
    () => availableChains.filter((chain) => chain.isMain),
    [availableChains]
  );

  // Define the asynchronous function to fetch fee data
  const fetchFeeData = useCallback(async () => {
    if (!selectedChainIds.length) {
      return undefined;
    }

    const feeSession = await addOwnerByPublicKeyRef.current(
      recoveryPhrase,
      username,
      selectedChainIds
    );
    return feeSession;
  }, [selectedChainIds, recoveryPhrase, username]);

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
      onSuccess();
    }
    onClose();
  };

  const onDone = () => {
    onCloseWithStatus(SyncStatus.Success);
  };

  const onFail = () => {
    onClose();
  };

  return (
    <SyncDialog
      title="Recover account"
      description="A network fee is required to recover your wallet"
      chains={availableChains}
      chainsNotAllowedToSelect={chainsNotAllowedToSelect}
      onEstimateFee={onEstimateFee}
      onClose={onCloseWithStatus}
      onDone={onDone}
      onFail={onFail}
      feeSessionData={feeSessionData}
      selectedChainIds={selectedChainIds}
      setSelectedChainIds={setSelectedChainIds}
      aaAddress={aaAddress}
      status={status}
      setStatus={setStatus}
      successText="Submit successful"
      failText="Submit failed"
      failButtonText="Try again"
    />
  );
}
