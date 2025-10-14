import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useChainConfig } from '@src/app/hooks/web3/useChainConfig';
import { sleep } from '@src/app/utils/common';
import { useAsyncCallback, AsyncStatus } from '@src/app/hooks/useAsyncCallback';
import { FeeSessionResp } from '@src/app/externalApis';
import { SyncDialog, SyncStatus } from './SyncDialog';

export function SyncOwnershipChange({
  chainIds,
  onClose,
}: {
  chainIds: number[];
  onClose: () => void;
}) {
  const [status, setStatus] = useState<SyncStatus>(SyncStatus.Init);

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

    // TODO fetch fee data
    await sleep(1000);
    const res = {
      fee: {
        balance: '100',
        symbol: 'USDT',
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
    if (chains.length > 0) {
      loadFeeData();
    }
  }, [chains, loadFeeData]);

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
      customBody={<div>Sync Ownership Change</div>}
      status={status}
      chains={chains}
      onClose={onClose}
      onConfirm={onConfirm}
      onDone={onDone}
      onFail={onFail}
      isSponsoredNetworkFee={!!feeSessionData?.isPaymaster}
      networkFeeData={feeSessionData?.fee}
      selectedChainIds={selectedChainIds}
      setSelectedChainIds={setSelectedChainIds}
    />
  );
}
