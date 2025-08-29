import React, { useCallback } from 'react';
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
import { Address, parseUnits } from 'viem';
import { useAsyncCallback, AsyncStatus } from '../../hooks/useAsyncCallback';
import { stopPropagation } from '../../utils/keyboard';
import { useChainConfig } from '../../hooks/web3/useChainConfig';
import * as css from './ReviewTransfer.css';
import type { ReviewTransferContentProps } from './types';

export function ReviewTransferContent({
  isOpen,
  onClose,
  transferData,
}: ReviewTransferContentProps) {
  const { getChainConfig } = useChainConfig();
  const chainConfig = getChainConfig(transferData.chainId);
  const { transfer } = useAbstractAccount(
    localStorage.getItem(cons.secretKey.AA_ADDRESS) as Address,
    chainConfig.chainId
  );

  const [transferState, executeTransfer] = useAsyncCallback<void, Error, []>(
    useCallback(async () => {
      const amountWithDecimals = parseUnits(
        transferData.token.amount,
        Number(transferData.token.decimals)
      );

      const receipt = await transfer(
        transferData.recipient.address,
        amountWithDecimals,
        transferData.token.address
      );

      console.log(receipt);
    }, [transferData, transfer])
  );

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
                {transferData.token.icon && (
                  <Box className={css.TokenIcon}>
                    <img
                      className={css.TokenIconImg}
                      src={transferData.token.icon}
                      alt={transferData.token.name}
                    />
                  </Box>
                )}
                <Box className={css.TokenInfo}>
                  <Text size="H5" priority="500">
                    {transferData.token.name}
                  </Text>
                  <Text size="T300" priority="300">
                    {transferData.token.amount} {transferData.token.name}
                  </Text>
                </Box>
                <Box className={css.TokenValue}>
                  <Text size="T400" priority="400">
                    {transferData.token.usdValue}
                  </Text>
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

              {/* Fee Address Section */}
              <Box className={css.Section}>
                <Text size="L400">Fee Address</Text>
                <Text size="B400">{transferData.feeAddress}</Text>
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
