import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Box, Button, Text, Checkbox, config, Spinner } from 'folds';
import { HDAccount, parseUnits } from 'viem';
import { ChainConfig, FeeSessionResp, Token, walletApi } from '@src/app/externalApis';
import { ContainerColor } from '@src/app/styles/ContainerColor.css';
import { hexToBase58 } from '@src/app/utils/ontello/crypto';
import { OntelloDialog } from '../../ontello/OntelloDialog';
import { useChainConfig } from '../../../hooks/web3/useChainConfig';
import { ReceiveUi, ReceiveChainInfo } from '../ReceiveUi';
import { useOwnerManage } from '../../../hooks/web3/useOwnerManage';
import { formatDollarNumber } from '../../../utils/ontello/number';
import { formatPrecision } from '../../../utils/number';

export enum SyncStatus {
  Init = 'init',
  EstimatedFeeLoaded = 'estimatedFeeLoaded',
  Loading = 'loading',
  Success = 'success',
  Failed = 'failed',
}

enum EstimateFeeStatus {
  Init = 'init',
  Success = 'success',
  Failed = 'failed',
}

export function SyncDialog({
  title,
  description,
  prependElement,
  customBody,
  chains,
  chainsNotAllowedToSelect = [],
  chainsCannotSelectFlag = false,
  onEstimateFee,
  onClose,
  onDone,
  onFail,
  confirmButtonText = 'Confirm',
  doneButtonText = 'Done',
  failButtonText = 'Done',
  successText = 'Submit successful',
  failText = 'Submit failed',
  failTextDescription = '',
  aaAddress,
  feeSessionData,
  selectedChainIds = [],
  setSelectedChainIds,
  status,
  setStatus,
  account,
}: {
  title: string;
  description?: string;
  prependElement?: React.ReactNode;
  customBody?: React.ReactNode;
  chains: ChainConfig[];
  chainsNotAllowedToSelect?: ChainConfig[];
  chainsCannotSelectFlag?: boolean;
  onEstimateFee: () => Promise<void>;
  onClose: (status?: SyncStatus) => void;
  onDone: () => void;
  onFail: () => void;
  confirmButtonText?: string;
  doneButtonText?: string;
  failButtonText?: string;
  successText?: string;
  failText?: string;
  failTextDescription?: string;
  aaAddress: string;
  feeSessionData?: FeeSessionResp;
  selectedChainIds?: number[];
  setSelectedChainIds?: (chainIds: number[]) => void;
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
  account?: HDAccount;
}) {
  const [showReceiveUi, setShowReceiveUi] = useState(false);
  const [estimateFeeStatus, setEstimateFeeStatus] = useState<EstimateFeeStatus>(
    EstimateFeeStatus.Init
  );

  const chainsCanSelect = useMemo(() => {
    if (chainsCannotSelectFlag) return false;
    return chains.length > 1;
  }, [chains, chainsCannotSelectFlag]);
  const networkFeeData = useMemo(() => {
    if (!feeSessionData) return undefined;
    return feeSessionData.fee;
  }, [feeSessionData]);
  const isSponsoredNetworkFee = useMemo(() => {
    if (!feeSessionData) return false;
    return feeSessionData.isPaymaster;
  }, [feeSessionData]);
  const { availableChains } = useChainConfig();
  const { payFee } = useOwnerManage(aaAddress as `0x${string}`);
  const payFeeRef = useRef(payFee);
  payFeeRef.current = payFee;

  const toggleSelect = (chainId: number) => {
    if (!selectedChainIds || !setSelectedChainIds) return;
    if (status === SyncStatus.Loading) return;
    setStatus(SyncStatus.Init);
    if (selectedChainIds.includes(chainId)) {
      setSelectedChainIds(selectedChainIds.filter((id) => id !== chainId));
    } else {
      setSelectedChainIds([...selectedChainIds, chainId]);
    }
  };

  const [yourNetworkFeeTokenData, setYourNetworkFeeTokenData] = useState<Token | undefined>();

  const onCloseWithStatus = useCallback(() => {
    onClose(status);
  }, [onClose, status]);

  const fetchYourNetworkFeeTokenData = useCallback(async () => {
    if (!aaAddress) return;
    if (!feeSessionData) return;
    if (!networkFeeData) return;
    if (feeSessionData.isPaymaster) return;
    const res = await walletApi.walletdataTransferBalanceGet({
      addr: aaAddress || '',
      chain_id: networkFeeData?.chainId || 0,
      token_addr: networkFeeData?.tokenAddr || '',
    });
    setYourNetworkFeeTokenData(res.result);
  }, [aaAddress, networkFeeData, feeSessionData]);

  const timeout = useRef<number | null>(null);
  useEffect(() => {
    timeout.current = window.setInterval(fetchYourNetworkFeeTokenData, 5000);
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, [fetchYourNetworkFeeTokenData]);

  useEffect(() => {
    if (networkFeeData) {
      fetchYourNetworkFeeTokenData();
    }
  }, [networkFeeData, fetchYourNetworkFeeTokenData]);

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

  const receiveOntolagyNativeChainInfo: ReceiveChainInfo | undefined = useMemo(() => {
    if (!receiveChainInfo || !networkFeeData) return undefined;
    // the receiveChainInfo is ont evm mainnet or testnet
    if (!(Number(receiveChainInfo.chainId) === 58 || Number(receiveChainInfo.chainId) === 5851))
      return undefined;
    // support token need ong
    if (networkFeeData.symbol.toUpperCase() !== 'ONG') return undefined;
    return {
      ...receiveChainInfo,
      chainName: 'Ontology Native',
      chainNameView: 'Ontology Native',
      chainId: 6666666, // dummy chain id for ontology native
      iconUrls: ['https://img.ontello.app/Ontologynative.png'],
      address: hexToBase58(receiveChainInfo.address),
      supportedAssets: [networkFeeData],
      description: 'You can top up this address through an exchange or Ontology chain.',
    };
  }, [receiveChainInfo, networkFeeData]);

  const receiveChainInfoList = useMemo(() => {
    const receiveChainInfoWithDesc: ReceiveChainInfo | undefined = receiveChainInfo
      ? {
          ...receiveChainInfo,
          description: receiveOntolagyNativeChainInfo
            ? 'You can top up this address through Ontology EVM.'
            : undefined,
        }
      : undefined;
    return [receiveChainInfoWithDesc, receiveOntolagyNativeChainInfo].filter((chain) => !!chain);
  }, [receiveChainInfo, receiveOntolagyNativeChainInfo]);

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
    if (!chains || chains.length === 0) return true;
    if (status === SyncStatus.Loading) return true;
    if (selectedChains.length === 0) return true;
    if (status !== SyncStatus.Init && !feeInfoIsLoaded) return true;
    return false;
  }, [status, feeInfoIsLoaded, chains, selectedChains]);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const onTopUpFeeToken = () => {
    setShowReceiveUi(true);
  };

  const confirmClick = useCallback(async () => {
    try {
      setStatus(SyncStatus.Loading);
      if (!feeSessionData) {
        throw new Error('Fee data not found');
      }

      if (!isSponsoredNetworkFee) {
        await payFeeRef.current(
          feeSessionData.session as `0x${string}`,
          parseUnits(
            feeSessionData.fee.balance, // string, e.g. "0.001"
            feeSessionData.fee.decimals // number, e.g. 18
          ),
          (feeSessionData.fee.tokenAddr as `0x${string}`) || undefined,
          account
        );
      }

      await walletApi.walletdataConfirmPaymentPost({
        WalletdataConfirmPaymentPostRequest: {
          session: feeSessionData.session as `0x${string}`,
        },
      });

      setStatus(SyncStatus.Success);
    } catch (error) {
      console.error(error);
      setStatus(SyncStatus.Failed);
    }
  }, [feeSessionData, setStatus, isSponsoredNetworkFee, account]);

  const doEstimateFee = useCallback(async () => {
    try {
      setEstimateFeeStatus(EstimateFeeStatus.Init);
      await onEstimateFee();
      setEstimateFeeStatus(EstimateFeeStatus.Success);
    } catch (error) {
      console.error(error);
      setEstimateFeeStatus(EstimateFeeStatus.Failed);
    }
  }, [onEstimateFee]);

  const buttonText = useMemo(() => {
    if (status === SyncStatus.Loading) return 'Loading...';
    if (status === SyncStatus.Success) return doneButtonText;
    if (status === SyncStatus.Failed) return failButtonText;
    if (showNeedTopUpFeeToken) return 'Fund wallet';
    if (status === SyncStatus.Init) return 'Estimate fee';
    if (status === SyncStatus.EstimatedFeeLoaded) return confirmButtonText;
    return '';
  }, [showNeedTopUpFeeToken, status, confirmButtonText, doneButtonText, failButtonText]);

  const buttonClick = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    if (status === SyncStatus.Loading) return () => {};
    if (status === SyncStatus.Success) return () => onDone();
    if (status === SyncStatus.Failed) return () => onFail();
    if (showNeedTopUpFeeToken) return () => onTopUpFeeToken();
    if (status === SyncStatus.Init) return () => doEstimateFee();
    if (status === SyncStatus.EstimatedFeeLoaded) return () => confirmClick();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }, [showNeedTopUpFeeToken, status, confirmClick, onDone, onFail, doEstimateFee]);

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
                {formatDollarNumber(networkFeeData?.currency)}·
                {formatPrecision(networkFeeData?.balance)}
                {networkFeeData?.symbol}
              </Text>
            ) : (
              <Text size="T300">-</Text>
            )}
          </Box>
          {isSponsoredNetworkFee && (
            <Box direction="Row" gap="200" justifyContent="End" alignItems="Center">
              <Text size="T300">Sponsored by Ontello</Text>
            </Box>
          )}
        </Box>

        {estimateFeeStatus === EstimateFeeStatus.Failed && (
          <Box direction="Column" gap="200">
            <Text size="T200" style={{ color: '#FF0000' }}>
              Fee estimation failed, please try again
            </Text>
          </Box>
        )}

        {networkFeeData && !yourNetworkFeeTokenData && !isSponsoredNetworkFee && (
          <Box gap="200">
            <Spinner size="200" />{' '}
            <Text size="T200">Checking your {networkFeeData.symbol} balance</Text>
          </Box>
        )}

        {showNeedTopUpFeeToken && networkFeeData && (
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
    <ReceiveUi onClose={() => setShowReceiveUi(false)} chainsWithOtherInfo={receiveChainInfoList} />
  );

  if (showReceiveUi) {
    return receiveUiEl;
  }

  return (
    <OntelloDialog onClose={onCloseWithStatus} title={title}>
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
