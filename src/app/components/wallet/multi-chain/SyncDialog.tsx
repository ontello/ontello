import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Box, Button, Text, Checkbox, config, Spinner } from 'folds';
import { ChainConfig, Token, walletApi } from '@src/app/externalApis';
import { ContainerColor } from '@src/app/styles/ContainerColor.css';
import { OntelloDialog } from '../../ontello/OntelloDialog';
import { useChainConfig } from '../../../hooks/web3/useChainConfig';
import { ReceiveUi, ReceiveChainInfo } from '../ReceiveUi';

export enum SyncStatus {
  Init = 'init',
  Loading = 'loading',
  Success = 'success',
  Failed = 'failed',
}

export function SyncDialog({
  title,
  description,
  prependElement,
  customBody,
  status,
  chains,
  chainsNotAllowedToSelect = [],
  onClose,
  onConfirm,
  onDone,
  onFail,
  confirmButtonText = 'Confirm',
  doneButtonText = 'Done',
  failButtonText = 'Try again',
  successText = 'Successful',
  failText = 'Failed',
  failTextDescription = '',
  aaAddress,
  isSponsoredNetworkFee,
  networkFeeData,
  selectedChainIds = [],
  setSelectedChainIds,
}: {
  title: string;
  description?: string;
  prependElement?: React.ReactNode;
  customBody?: React.ReactNode;
  status: SyncStatus;
  chains: ChainConfig[];
  chainsNotAllowedToSelect?: ChainConfig[];
  onClose: () => void;
  onConfirm: (chains: ChainConfig[]) => void;
  onDone: () => void;
  onFail: () => void;
  confirmButtonText?: string;
  doneButtonText?: string;
  failButtonText?: string;
  successText?: string;
  failText?: string;
  failTextDescription?: string;
  aaAddress: string;
  isSponsoredNetworkFee: boolean;
  networkFeeData?: Token;
  selectedChainIds?: number[];
  setSelectedChainIds?: (chainIds: number[]) => void;
}) {
  const [showReceiveUi, setShowReceiveUi] = useState(false);
  const chainsCanSelect = useMemo(() => chains.length > 1, [chains]);
  const { availableChains } = useChainConfig();

  const toggleSelect = (chainId: number) => {
    if (!selectedChainIds || !setSelectedChainIds) return;
    if (selectedChainIds.includes(chainId)) {
      setSelectedChainIds(selectedChainIds.filter((id) => id !== chainId));
    } else {
      setSelectedChainIds([...selectedChainIds, chainId]);
    }
  };

  const [yourNetworkFeeTokenData, setYourNetworkFeeTokenData] = useState<Token | undefined>();

  const fetchYourNetworkFeeTokenData = useCallback(async () => {
    if (!aaAddress) return;
    if (!networkFeeData) return;
    if (yourNetworkFeeTokenData && yourNetworkFeeTokenData.balance >= networkFeeData.balance)
      return;
    const res = await walletApi.walletdataTransferBalanceGet({
      addr: aaAddress || '',
      chain_id: networkFeeData?.chainId || 0,
      token_addr: networkFeeData?.tokenAddr || '',
    });
    setYourNetworkFeeTokenData(res.result);
  }, [aaAddress, networkFeeData, yourNetworkFeeTokenData]);

  const timeout = useRef<number | null>(null);
  useEffect(() => {
    timeout.current = window.setTimeout(fetchYourNetworkFeeTokenData, 5000);
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, [fetchYourNetworkFeeTokenData]);

  const netWorkFeeChainConfig = useMemo(() => {
    if (!networkFeeData) return undefined;
    return availableChains.find((chain) => chain.chainId === networkFeeData.chainId);
  }, [networkFeeData, availableChains]);

  const receiveChainInfo: ReceiveChainInfo | undefined = useMemo(() => {
    if (!netWorkFeeChainConfig) return undefined;
    return {
      ...netWorkFeeChainConfig,
      address: aaAddress,
      supportedAssets: networkFeeData ? [networkFeeData] : [],
    };
  }, [netWorkFeeChainConfig, aaAddress, networkFeeData]);

  const selectedChains = useMemo(() => {
    if (chainsCanSelect && selectedChainIds) {
      return chains.filter((chain) => selectedChainIds.includes(chain.chainId));
    }
    return chains;
  }, [chains, selectedChainIds, chainsCanSelect]);

  const feeInfoIsLoaded = useMemo(() => {
    if (!networkFeeData) return false;
    if (!isSponsoredNetworkFee && !yourNetworkFeeTokenData) return false;
    return true;
  }, [isSponsoredNetworkFee, networkFeeData, yourNetworkFeeTokenData]);

  const showNeedTopUpFeeToken = useMemo(() => {
    if (isSponsoredNetworkFee) return false;
    if (!feeInfoIsLoaded) return false;
    if (!yourNetworkFeeTokenData || !networkFeeData) return false;
    return yourNetworkFeeTokenData.balance < networkFeeData.balance;
  }, [isSponsoredNetworkFee, feeInfoIsLoaded, yourNetworkFeeTokenData, networkFeeData]);

  const buttonDisabled = useMemo(() => {
    if (!feeInfoIsLoaded) return true;
    if (!chains || chains.length === 0) return true;
    if (status === SyncStatus.Loading) return true;
    if (selectedChains.length === 0) return true;
    return false;
  }, [status, feeInfoIsLoaded, chains, selectedChains]);

  const buttonText = useMemo(() => {
    if (showNeedTopUpFeeToken) return 'Fund wallet';
    if (status === SyncStatus.Init) return confirmButtonText;
    if (status === SyncStatus.Loading) return 'Loading...';
    if (status === SyncStatus.Success) return doneButtonText;
    if (status === SyncStatus.Failed) return failButtonText;
    return '';
  }, [showNeedTopUpFeeToken, status, confirmButtonText, doneButtonText, failButtonText]);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const onTopUpFeeToken = () => {
    setShowReceiveUi(true);
  };

  const buttonClick = useMemo(() => {
    if (showNeedTopUpFeeToken) return () => onTopUpFeeToken();
    if (status === SyncStatus.Init) return () => onConfirm(selectedChains);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    if (status === SyncStatus.Loading) return () => {};
    if (status === SyncStatus.Success) return () => onDone();
    if (status === SyncStatus.Failed) return () => onFail();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }, [showNeedTopUpFeeToken, status, onConfirm, onDone, onFail, selectedChains]);

  const successEl = (
    <Box direction="Column" alignItems="Center" gap="300">
      <Text size="T300">✅</Text>
      <Text size="H6">{successText}</Text>
    </Box>
  );

  const failEl = (
    <Box direction="Column" alignItems="Center" gap="300">
      <Text size="T300">❌</Text>
      <Text size="T300">{failText}</Text>
      {failTextDescription && <Text size="T200">{failTextDescription}</Text>}
    </Box>
  );

  const networkEl = (
    <Box direction="Column" gap="600">
      <Box
        direction="Column"
        gap="300"
        className={ContainerColor({ variant: 'SurfaceVariant' })}
        style={{
          padding: `${config.space.S300} ${config.space.S400}`,
          borderRadius: config.radii.R300,
        }}
      >
        <Text size="H6">Network</Text>
        <Box direction="Column" gap="200">
          {!chains || chains.length === 0 ? (
            <Spinner size="200" />
          ) : (
            chains.map((chain) => (
              <Box key={chain.chainId} direction="Row" gap="400" alignItems="Center">
                {chainsCanSelect && (
                  <Checkbox
                    disabled={chainsNotAllowedToSelect.some((c) => c.chainId === chain.chainId)}
                    checked={selectedChainIds.includes(chain.chainId)}
                    // @ts-expect-error - folds Checkbox component uses different prop names
                    onChange={() => toggleSelect(chain.chainId)}
                    size="50"
                  />
                )}
                <Box direction="Row" gap="200" alignItems="Center">
                  <img
                    src={chain.iconUrls[0]}
                    alt={chain.chainName}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <Text size="T300">{chain.chainNameView}</Text>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>

      <Box direction="Column" gap="200">
        <Box
          direction="Column"
          gap="200"
          className={ContainerColor({ variant: 'SurfaceVariant' })}
          style={{
            padding: `${config.space.S600} ${config.space.S400} ${config.space.S700}`,
            width: '100%',
          }}
        >
          <Box direction="Row" gap="200" alignItems="Center" justifyContent="SpaceBetween">
            <Text size="H6">Network Fee (est.)</Text>
            {networkFeeData ? (
              <Text
                size="T300"
                style={{ textDecoration: isSponsoredNetworkFee ? 'line-through' : 'none' }}
              >
                {networkFeeData?.balance} {networkFeeData?.symbol}
              </Text>
            ) : (
              <Spinner size="200" />
            )}
          </Box>
          {isSponsoredNetworkFee && (
            <Box direction="Row" gap="200" justifyContent="End" alignItems="Center">
              <Text size="T300">Sponsored by Ontology</Text>
            </Box>
          )}
        </Box>

        {networkFeeData && !yourNetworkFeeTokenData && (
          <Box gap="200">
            <Spinner size="200" />{' '}
            <Text size="T200">Checking your {networkFeeData.symbol} balance</Text>
          </Box>
        )}

        {yourNetworkFeeTokenData && networkFeeData && (
          <Box direction="Column" gap="200">
            <Text size="T200" style={{ color: '#FF0000' }}>
              You need more than {networkFeeData.balance} {networkFeeData.symbol} in{' '}
              {netWorkFeeChainConfig?.chainNameView} due to gas fees.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );

  const receiveUiEl = (
    <ReceiveUi
      onClose={() => setShowReceiveUi(false)}
      chainsWithOtherInfo={receiveChainInfo ? [receiveChainInfo] : []}
    />
  );

  if (showReceiveUi) {
    return receiveUiEl;
  }

  return (
    <OntelloDialog onClose={onClose} title={title}>
      {customBody || (
        <Box
          direction="Column"
          gap="600"
          style={{ padding: `${config.space.S600} ${config.space.S400} ${config.space.S700}` }}
        >
          {prependElement}
          {description && <Text size="T300">{description}</Text>}
          {status === SyncStatus.Success && successEl}
          {status === SyncStatus.Failed && failEl}
          {![SyncStatus.Success, SyncStatus.Failed].includes(status) && networkEl}
          <Button onClick={buttonClick} disabled={buttonDisabled}>
            {status === SyncStatus.Loading ? <Spinner size="200" /> : buttonText}
          </Button>
        </Box>
      )}
    </OntelloDialog>
  );
}
