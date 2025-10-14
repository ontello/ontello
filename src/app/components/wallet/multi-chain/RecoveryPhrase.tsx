import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Box, Text } from 'folds';
import { ContainerColor } from '@src/app/styles/ContainerColor.css';
import { useAsyncCallback, AsyncStatus } from '@src/app/hooks/useAsyncCallback';
import { SyncDialog, SyncStatus } from './SyncDialog';
import { RecoveryPhraseStep1 } from './RecoveryPhraseStep1';
import { useChainConfig } from '../../../hooks/web3/useChainConfig';
import { sleep } from '../../../utils/common';
import { Token } from '../../../externalApis';

enum Step {
  Step1 = 'step1',
  Step2 = 'step2',
}

export function RecoveryPhrase({ phrase, onClose }: { phrase: string; onClose: () => void }) {
  const [step, setStep] = useState<Step>(Step.Step1);
  const [status, setStatus] = useState<SyncStatus>(SyncStatus.Init);
  const { availableChains } = useChainConfig();
  const chains = useMemo(() => availableChains.filter((chain) => chain.isMain), [availableChains]);

  const customBody = useMemo(() => {
    if (step === Step.Step1) {
      return <RecoveryPhraseStep1 phrase={phrase} onNext={() => setStep(Step.Step2)} />;
    }
    return null;
  }, [step, phrase]);

  // Define the asynchronous function to fetch fee data
  const fetchFeeData = useCallback(async () => {
    if (!chains.length) {
      return undefined;
    }

    // TODO fetch fee data
    await sleep(1000);
    const feeData = {
      balance: '100',
      symbol: 'USDT',
    } as Token;

    return feeData;
  }, [chains]);

  // Use useAsyncCallback to manage asynchronous state
  const [feeDataState, loadFeeData] = useAsyncCallback<Token | undefined, Error, []>(fetchFeeData);

  const feeData = useMemo(() => {
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

  const prependElement = (
    <Box
      direction="Row"
      gap="200"
      alignItems="Center"
      justifyContent="Center"
      style={{ width: '100%' }}
    >
      <Text
        size="T300"
        className={ContainerColor({ variant: 'Primary' })}
        style={{
          width: '24px',
          height: '24px',
          textAlign: 'center',
          lineHeight: '24px',
          borderRadius: '50%',
        }}
      >
        2
      </Text>
    </Box>
  );

  return (
    <SyncDialog
      title="Recovery phrase"
      description="Add the recover phrase on chain to secure your account."
      customBody={customBody}
      networkFeeData={feeData}
      prependElement={prependElement}
      status={status}
      chains={chains}
      onClose={onClose}
      onConfirm={onConfirm}
      onDone={onDone}
      onFail={onFail}
      isSponsoredNetworkFee
    />
  );
}
