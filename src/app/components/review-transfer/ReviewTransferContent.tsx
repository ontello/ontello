import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import {
  Box,
  Text,
  Button,
  Overlay,
  OverlayCenter,
  OverlayBackdrop,
  Dialog,
  Header,
  IconButton,
  Icon,
  Icons,
  Spinner,
} from 'folds';

import { useAbstractAccount } from '@src/app/hooks/web3/useAbstractAccount';
import cons from '@src/client/state/cons';
import { Address, parseUnits, formatEther } from 'viem';
import { walletApi } from '@src/app/externalApis';
import { useAsyncCallback, AsyncStatus } from '../../hooks/useAsyncCallback';
import { stopPropagation } from '../../utils/keyboard';
import { useChainConfig } from '../../hooks/web3/useChainConfig';
import * as css from './ReviewTransfer.css';
import type { ReviewTransferContentProps } from './types';

import type { WalletdataTransferBalanceGet200Response } from '../../externalApis/models/WalletdataTransferBalanceGet200Response';

export function ReviewTransferContent({
  isOpen,
  onClose,
  transferData,
}: ReviewTransferContentProps) {
  const { getChainConfig } = useChainConfig();
  const chainConfig = getChainConfig(transferData.chainId);
  const { transfer, estimateTransfer } = useAbstractAccount(
    localStorage.getItem(cons.secretKey.AA_ADDRESS) as Address,
    chainConfig.chainId
  );

  const [gasInfo, setGasInfo] = useState<WalletdataTransferBalanceGet200Response | null>(null);
  const [feeEstimate, setFeeEstimate] = useState<{
    estimatedEthFee: bigint;
    maxEthFee: bigint;
  } | null>(null);

  useEffect(() => {
    const calculateFee = async () => {
      if (!feeEstimate) {
        try {
          const amountWithDecimals = parseUnits(
            transferData.token.amount,
            Number(transferData.token.decimals)
          );

          const estimateResult = await estimateTransfer(
            transferData.recipient.address,
            amountWithDecimals,
            transferData.feeAddress,
            transferData.token.address
          );

          setFeeEstimate(estimateResult);
        } catch (error) {
          console.error('Failed to calculate fee:', error);
        }
      }
    };

    const fetchTokenBalance = async () => {
      if (!gasInfo && transferData.feeAddress) {
        try {
          const balanceInfo = await walletApi.walletdataTransferBalanceGet({
            chain_id: transferData.chainId,
            token_addr: transferData.feeAddress,
            addr: localStorage.getItem(cons.secretKey.AA_ADDRESS) as string,
          });
          setGasInfo(balanceInfo);
        } catch (error) {
          console.error('Failed to fetch token balance:', error);
        }
      }
    };

    // Execute both functions in parallel
    calculateFee();
    fetchTokenBalance();
  }, [
    feeEstimate,
    gasInfo,
    transferData.chainId,
    transferData.token.address,
    transferData.token.amount,
    transferData.token.decimals,
    transferData.recipient.address,
    transferData.feeAddress,
    estimateTransfer,
  ]);

  const [transferState, executeTransfer] = useAsyncCallback<void, Error, []>(
    useCallback(async () => {
      const amountWithDecimals = parseUnits(
        transferData.token.amount,
        Number(transferData.token.decimals)
      );

      const receipt = await transfer(
        transferData.recipient.address,
        amountWithDecimals,
        transferData.feeAddress,
        transferData.token.address
      );

      console.log(receipt);
    }, [transferData, transfer])
  );

  const feeDisplay = useMemo(() => {
    if (gasInfo && feeEstimate) {
      // feeEstimate.maxEthFee
      return `${formatEther(feeEstimate.maxEthFee)}ETH`;
    }
    return 'Calculating';
  }, [gasInfo, feeEstimate]);

  const handleConfirm = () => {
    executeTransfer();
  };

  const handleClose = () => {
    if (transferState.status === AsyncStatus.Success) {
      onClose();
    } else if (transferState.status !== AsyncStatus.Loading) {
      onClose();
    }
  };

  const getRecipientDisplay = () => {
    const { ontId, ens, address } = transferData.recipient;

    if (ontId) return ontId;
    if (ens) return ens;
    return address;
  };

  return (
    <Overlay open={isOpen} backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: handleClose,
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog className={css.ReviewTransferDialog} variant="Surface">
            <Header className={css.Header} variant="Surface" size="500">
              <Box grow="Yes" alignItems="Center" gap="200">
                <Text size="H4">Review</Text>
              </Box>
              <IconButton size="300" onClick={handleClose} radii="300">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>

            <Box className={css.Content}>
              {/* Token Section */}
              <Box className={css.TokenSection}>
                <Box className={css.TokenIcon}>
                  <img
                    className={css.TokenIconImg}
                    src={transferData.token.icon}
                    alt={transferData.token.name}
                  />
                </Box>
                <Box className={css.TokenInfo}>
                  <Text size="H5" priority="500">
                    {transferData.token.name}
                  </Text>
                </Box>
                <Box className={css.TokenValue}>
                  <Text>{transferData.token.amount}</Text>
                  <Text>${transferData.token.usdValue}</Text>
                </Box>
              </Box>

              {/* Recipient Section */}
              <Box className={css.Section}>
                <Box className={css.SectionHeader}>
                  <Text size="L400">Send to</Text>
                </Box>
                <Box className={css.Recipient}>
                  {transferData.recipient.avatar && (
                    <Box className={css.RecipientAvatar}>
                      <img
                        className={css.RecipientAvatarImg}
                        src={transferData.recipient.avatar}
                        alt="Recipient"
                      />
                    </Box>
                  )}
                  <Box className={css.RecipientInfo}>
                    <Box className={css.RecipientAddress}>
                      <Text className={css.AddressText} size="T300">
                        {getRecipientDisplay()}
                      </Text>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Network Section */}
              <Box className={css.Section}>
                <Text size="L400">Network</Text>
                <Box className={css.Network}>
                  {chainConfig.iconUrls?.[0] && (
                    <Box className={css.NetworkIcon}>
                      <img
                        className={css.NetworkIconImg}
                        src={chainConfig.iconUrls[0]}
                        alt={chainConfig.chainName}
                      />
                    </Box>
                  )}
                  <Text size="B400">{chainConfig.chainName}</Text>
                </Box>
              </Box>

              {/* Fee Section */}
              <Box className={css.Section}>
                <Text size="L400">Transaction Fee</Text>
                <Box className={css.Network}>
                  <Text size="B400">{feeDisplay || 'Loading...'}</Text>
                </Box>
              </Box>

              {/* Error Section */}
              {transferState.status === AsyncStatus.Error && (
                <Box className={css.ErrorSection}>
                  <Text className={css.ErrorText} size="T300">
                    {transferState.error?.message || 'Transfer failed'}
                  </Text>
                </Box>
              )}

              {/* Action Buttons */}
              <Box className={css.Actions}>
                <Button
                  className={css.ActionButton}
                  size="500"
                  onClick={handleConfirm}
                  before={
                    transferState.status === AsyncStatus.Loading ? (
                      <Spinner variant="Primary" size="200" />
                    ) : undefined
                  }
                  aria-disabled={
                    transferState.status === AsyncStatus.Loading ||
                    transferState.status === AsyncStatus.Success
                  }
                >
                  <Text size="B400">Send</Text>
                </Button>
              </Box>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}

export default ReviewTransferContent;
