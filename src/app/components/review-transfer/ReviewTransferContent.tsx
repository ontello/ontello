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
import { walletApi } from '@src/app/externalApis';
import { getAuthExtras } from '../../state/authExtras';
import { Address, parseUnits, formatEther } from 'viem';
import { useAsyncCallback, AsyncStatus } from '../../hooks/useAsyncCallback';
import { stopPropagation } from '../../utils/keyboard';
import { useChainConfig } from '../../hooks/web3/useChainConfig';
import * as css from './ReviewTransfer.css';
import type { ReviewTransferContentProps } from './types';

import { AvatarAndEnsData } from '../wallet/AvatarAndEnsData';
import { TransferResult, TransferResultEnum } from '../wallet/TransferResult';

export function ReviewTransferContent({
  isOpen,
  onClose,
  transferData,
}: ReviewTransferContentProps) {
  const { getChainConfig } = useChainConfig();
  const chainConfig = getChainConfig(transferData.chainId);
  const extras = getAuthExtras();
  const aaAddress = extras.aaAddress as Address | null;
  if (!aaAddress) {
    throw new Error('Account address not found');
  }
  const { transfer, estimateTransfer } = useAbstractAccount(aaAddress, chainConfig.chainId);

  const [feeEstimate, setFeeEstimate] = useState<{
    // estimatedEthFee: bigint;
    maxEthFee: bigint;
  } | null>(null);

  const [calculateFeeState, calculateFee] = useAsyncCallback<void, Error, []>(
    useCallback(async () => {
      try {
        const amountWithDecimals = parseUnits(
          transferData.token.amount,
          Number(transferData.token.decimals)
        );

        const estimateResult = await estimateTransfer(
          transferData.recipient.addr as Address,
          amountWithDecimals,
          transferData.fee.address,
          transferData.token.address
        );

        setFeeEstimate(estimateResult);
      } catch (error) {
        console.error('Failed to estimate fee:', error);
        if (error instanceof Error && error.message.includes('AA23 reverted (or OOG)')) {
          throw new Error('Insufficient gas fee');
        }
        throw error;
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  useEffect(() => {
    calculateFee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [transferState, executeTransfer] = useAsyncCallback<void, Error, []>(
    useCallback(async () => {
      if (!aaAddress) {
        throw new Error('Account address not found');
      }

      let tokenBalanceRaw = '0';
      let feeBalanceRaw = '0';

      try {
        const [tokenRes, feeRes] = await Promise.all([
          walletApi.walletdataTransferBalanceGet({
            chain_id: transferData.chainId,
            token_addr: transferData.token.address || '',
            addr: aaAddress,
          }),
          walletApi.walletdataTransferBalanceGet({
            chain_id: transferData.chainId,
            token_addr: transferData.fee.address || '',
            addr: aaAddress,
          }),
        ]);

        tokenBalanceRaw = tokenRes.result.balance || '0';
        feeBalanceRaw = feeRes.result.balance || '0';
      } catch (error) {
        console.error('Failed to fetch balances:', error);
        throw new Error('Failed to fetch balances');
      }

      // Balance validation before transfer
      const sendAmount = parseFloat(transferData.token.amount);
      const tokenBal = parseFloat(tokenBalanceRaw);

      // Calculate fee amount
      const feeInEth = feeEstimate ? Number(formatEther(feeEstimate.maxEthFee)) : 0;
      const feeInToken = feeInEth * Number(transferData.fee.exchangeRate);
      const feeBal = parseFloat(feeBalanceRaw);

      // Three scenarios of balance validation
      if (transferData.token.address?.toLowerCase() === transferData.fee.address?.toLowerCase()) {
        // Same token for both transfer and fee
        if (tokenBal < sendAmount + feeInToken) {
          throw new Error('Insufficient balance');
        }
      } else {
        // Different tokens
        if (tokenBal < sendAmount) {
          throw new Error('Insufficient balance');
        }
        if (feeBal < feeInToken) {
          throw new Error('Insufficient balance for fee');
        }
      }

      const amountWithDecimals = parseUnits(
        transferData.token.amount,
        Number(transferData.token.decimals)
      );

      const receipt = await transfer(
        transferData.recipient.addr as Address,
        amountWithDecimals,
        transferData.fee.address,
        transferData.token.address
      );

      console.log(receipt);
    }, [aaAddress, feeEstimate, transfer, transferData])
  );

  const feeDisplay = useMemo(() => {
    if (feeEstimate) {
      const feeInEth = Number(formatEther(feeEstimate.maxEthFee));
      const exchangeRate = Number(transferData.fee.exchangeRate);
      const feeInToken = (feeInEth * exchangeRate).toFixed(4);
      return `${feeInToken} ${transferData.fee.name}`;
    }
    return 'Calculating...';
  }, [feeEstimate, transferData.fee.exchangeRate, transferData.fee.name]);

  // TODO Mathematical calculation tools
  const totalCostUSD = useMemo(() => {
    if (feeEstimate) {
      const tokenUSDValue = Number(transferData.token.usdValue);

      const feeInEth = Number(formatEther(feeEstimate.maxEthFee));
      const exchangeRate = Number(transferData.fee.exchangeRate);
      const feeInToken = feeInEth * exchangeRate;
      const feeTokenPrice = Number(transferData.fee.price);
      const feeUSDValue = feeInToken * feeTokenPrice;

      const totalCost = tokenUSDValue + feeUSDValue;
      return `$${totalCost.toFixed(2)}`;
    }
    return 'Calculating...';
  }, [
    feeEstimate,
    transferData.token.usdValue,
    transferData.fee.price,
    transferData.fee.exchangeRate,
  ]);

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

  return (
    (transferState.status !== AsyncStatus.Success && (
      <Overlay open={isOpen} backdrop={<OverlayBackdrop />}>
        <OverlayCenter>
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              // onDeactivate: handleClose,
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
                <Box className={css.Section} direction="Column">
                  <Text size="L400">Send to</Text>
                  <AvatarAndEnsData ensData={transferData.recipient} />
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
                          alt={chainConfig.chainNameView}
                        />
                      </Box>
                    )}
                    <Text size="B400">{chainConfig.chainNameView}</Text>
                  </Box>
                </Box>

                {/* Fee Section */}
                <Box className={css.Section}>
                  <Text size="L400">Network Fee</Text>
                  <Box className={css.Network}>
                    <Text size="B400">{feeDisplay || 'Loading...'}</Text>
                  </Box>
                </Box>

                {/* cost Section */}
                <Box className={css.Section}>
                  <Text size="L400">Total Cost</Text>
                  <Box className={css.Network}>
                    <Text size="B400">{totalCostUSD}</Text>
                  </Box>
                </Box>

                {calculateFeeState.status === AsyncStatus.Error && (
                  <Box className={css.ErrorSection}>
                    <Text className={css.ErrorText} size="T300">
                      {calculateFeeState.error?.message}
                    </Text>
                  </Box>
                )}

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
                    disabled={transferState.status === AsyncStatus.Loading || !feeEstimate}
                  >
                    <Text size="B400">Send</Text>
                  </Button>
                </Box>
              </Box>
            </Dialog>
          </FocusTrap>
        </OverlayCenter>
      </Overlay>
    )) || <TransferResult type={TransferResultEnum.Success} onClose={onClose} />
  );
}

export default ReviewTransferContent;
