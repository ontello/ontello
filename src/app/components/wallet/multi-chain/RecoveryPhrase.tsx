import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { english, generateMnemonic, mnemonicToAccount } from 'viem/accounts';
import { Box, Text } from 'folds';
import { ContainerColor } from '@src/app/styles/ContainerColor.css';
import { useAsyncCallback, AsyncStatus } from '@src/app/hooks/useAsyncCallback';
import { useFetchPasskeyList } from '@src/app/hooks/useFetchPasskeyList';
import { useMatrixClient } from '@src/app/hooks/useMatrixClient';
import { useOwnerManage } from '@src/app/hooks/web3/useOwnerManage';
import { SyncDialog, SyncStatus } from './SyncDialog';
import { RecoveryPhraseStep1 } from './RecoveryPhraseStep1';
import { useChainConfig } from '../../../hooks/web3/useChainConfig';
import { FeeSessionResp } from '../../../externalApis';

enum Step {
  Step1 = 'step1',
  Step2 = 'step2',
}

export function RecoveryPhrase({
  // phrase,
  onClose,
  onSuccess,
}: {
  // phrase: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [step, setStep] = useState<Step>(Step.Step1);
  const { availableChains } = useChainConfig();
  const chains = useMemo(() => availableChains.filter((chain) => chain.isMain), [availableChains]);
  const [status, setStatus] = useState<SyncStatus>(SyncStatus.Init);
  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId!);
  const [phrase, setPhrase] = useState('');
  useEffect(() => {
    const mnemonic = generateMnemonic(english);
    setPhrase(mnemonic);
  }, []);

  const { addOwnerByAddress } = useOwnerManage(passkeyData?.walletAddress as `0x${string}`);

  const addOwnerByAddressRef = useRef(addOwnerByAddress);

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

    const mnemonicAccount = mnemonicToAccount(phrase);
    const feeSession = await addOwnerByAddressRef.current(
      mnemonicAccount.address,
      chains.map((chain) => chain.chainId)
    );
    return feeSession;
  }, [chains, phrase]);

  // Use useAsyncCallback to manage asynchronous state
  const [feeDataState, loadFeeData] = useAsyncCallback<FeeSessionResp | undefined, Error, []>(
    fetchFeeData
  );

  const feeData = useMemo(() => {
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
      aaAddress={passkeyData?.walletAddress || ''}
      feeSessionData={feeData}
      prependElement={prependElement}
      chains={chains}
      onEstimateFee={onEstimateFee}
      onClose={onCloseWithStatus}
      onDone={onDone}
      onFail={onFail}
      status={status}
      setStatus={setStatus}
    />
  );
}
