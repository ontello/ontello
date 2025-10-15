import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useChainConfig } from '@src/app/hooks/web3/useChainConfig';
import { sleep } from '@src/app/utils/common';
import { useAsyncCallback, AsyncStatus } from '@src/app/hooks/useAsyncCallback';
import { FeeSessionResp } from '@src/app/externalApis';
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
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<SyncStatus>(SyncStatus.Init);

  const { availableChains } = useChainConfig();

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

    // TODO fetch fee data
    await sleep(1000);
    const res = {
      fee: {
        balance: '100',
        symbol: 'USDT',
        chainId: 97,
        tokenAddr: '0xd878dfE2b33A07E7FB290c1578A0b3cbc8aDadEA',
      },
      session: '123',
      isPaymaster: false,
    } as FeeSessionResp;

    return res;
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

  // Load fee data when chains change
  useEffect(() => {
    if (availableChains.length > 0) {
      loadFeeData();
    }
  }, [availableChains, loadFeeData]);

  const onConfirm = async () => {
    setStatus(SyncStatus.Loading);
    try {
      // TODO, replace with actual recovery operation
      await sleep(1000);
      setStatus(SyncStatus.Success);
    } catch (error) {
      console.error(error);
      setStatus(SyncStatus.Failed);
    }
  };

  const onDone = () => {
    onSuccess();
    onClose();
  };

  const onFail = () => {
    onClose();
  };

  return (
    <SyncDialog
      title="Recover account"
      description="A network fee is required to recover your wallet"
      status={status}
      chains={availableChains}
      chainsNotAllowedToSelect={chainsNotAllowedToSelect}
      onClose={onClose}
      onConfirm={onConfirm}
      onDone={onDone}
      onFail={onFail}
      isSponsoredNetworkFee={!!feeSessionData?.isPaymaster}
      networkFeeData={feeSessionData?.fee}
      selectedChainIds={selectedChainIds}
      setSelectedChainIds={setSelectedChainIds}
      aaAddress={aaAddress}
    />
  );
}
