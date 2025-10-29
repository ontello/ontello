import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useChainConfig } from '@src/app/hooks/web3/useChainConfig';
import { useAsyncCallback, AsyncStatus } from '@src/app/hooks/useAsyncCallback';
import { FeeSessionResp } from '@src/app/externalApis';
import { useFetchPasskeyList } from '@src/app/hooks/useFetchPasskeyList';
import { useMatrixClient } from '@src/app/hooks/useMatrixClient';
import { useOwnerManage } from '@src/app/hooks/web3/useOwnerManage';
import { SyncDialog, SyncStatus } from './SyncDialog';

export function RevokePasskey({
  targetPublicKeyBase64,
  onClose,
  onSuccess,
}: {
  targetPublicKeyBase64: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId!);

  const { removeOwner } = useOwnerManage(passkeyData?.walletAddress as `0x${string}`);

  const removeOwnerRef = useRef(removeOwner);

  const { availableChains } = useChainConfig();

  const [status, setStatus] = useState<SyncStatus>(SyncStatus.Init);
  // Define the asynchronous function to fetch fee data
  const fetchFeeData = useCallback(async () => {
    const feeSession = await removeOwnerRef.current(
      targetPublicKeyBase64,
      availableChains.map((chain) => chain.chainId)
    );
    return feeSession;
  }, [targetPublicKeyBase64, availableChains]);

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
    }
  };

  const onDone = () => {
    onSuccess();
    onClose();
  };

  const onFail = () => {
    setStatus(SyncStatus.Init);
  };

  return (
    <SyncDialog
      title="Revoke the recover phrase"
      description="Once revoked, this recovery phrase will become invalid and can no longer be used to restore your wallet."
      chains={availableChains}
      chainsCannotSelectFlag
      onEstimateFee={onEstimateFee}
      onClose={onClose}
      onDone={onDone}
      onFail={onFail}
      successText="Revoke successful"
      failText="Revoke failed"
      confirmButtonText="Revoke"
      failButtonText="Try again"
      feeSessionData={feeSessionData}
      aaAddress={passkeyData?.walletAddress || ''}
      status={status}
      setStatus={setStatus}
    />
  );
}
