import React, { useCallback, useState } from 'react';
import {
  Box,
  Text,
  Button,
  Spinner,
  color,
  Badge,
  Overlay,
  OverlayCenter,
  Dialog,
  Header,
  config,
  IconButton,
  Icon,
  Icons,
  OverlayBackdrop,
} from 'folds';
import { ellipsisMiddle, sleep } from '@src/app/utils/common';
import { timeFullDateTime } from '@src/app/utils/time';
import { CredentialItem, deleteDevicesByPk } from '@src/app/extendApis';
import { UserOperationReceipt } from '@src/app/hooks/web3/types';
import { AsyncStatus, useAsyncCallback } from '@src/app/hooks/useAsyncCallback';
import { Address } from 'viem';
import { useAbstractAccount } from '@src/app/hooks/web3/useAbstractAccount';
import { useWeb3PublicClient } from '@src/app/hooks/web3/useWeb3Client';
import FocusTrap from 'focus-trap-react';
import { useMatrixClient } from '@src/app/hooks/useMatrixClient';

interface OwnerItemProps {
  credential: CredentialItem;
  currentPublicKey: string;
  aaAddress: Address;
  deleteCallback: () => void;
}

export function OwnerItem({
  credential,
  currentPublicKey,
  aaAddress,
  deleteCallback,
}: OwnerItemProps) {
  const { publicClient } = useWeb3PublicClient();
  const mx = useMatrixClient();
  const { removeOwner } = useAbstractAccount(publicClient, aaAddress);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const deletePasskey = async () => {
    try {
      const receipt = await removeOwner(credential.publicKey);
      await sleep(3000);
      await deleteDevicesByPk(mx, credential.publicKey);
      await deleteCallback();
    } catch (error) {
      console.log('Error deleting passkey:', error);
      throw error;
    }
  };

  const [removeState, startRemoveOwner, resetRemoveState] = useAsyncCallback<
    void,
    Error,
    Parameters<typeof deletePasskey>
  >(useCallback(deletePasskey, [deletePasskey]));

  const isCurrent = credential.publicKey === currentPublicKey;
  const closeDialogHandler = () => {
    setIsRemoveDialogOpen(false);
    if (removeState.status === AsyncStatus.Error) {
      resetRemoveState();
    }
  };

  return (
    <>
      <Box direction="Column">
        <Box
          key={credential.publicKey}
          direction="Row"
          justifyContent="SpaceBetween"
          alignItems="Center"
          grow="Yes"
        >
          <Box direction="Column">
            <Box alignItems="Center" gap="200" direction="Row">
              <Text>
                {(credential.publicKey.length === 43 && 'Wallet Recovery Phrase') || 'Passkey'}
              </Text>
              {isCurrent && (
                <Badge aria-label="A status badge" role="status">
                  <Text as="span" size="L400">
                    Current
                  </Text>
                </Badge>
              )}
            </Box>
            <Text>{timeFullDateTime(credential.timestamp)}</Text>
            <Text>Public Key: {ellipsisMiddle(credential.publicKey)}</Text>
          </Box>
          {!isCurrent && (
            <Button
              size="300"
              radii="300"
              variant="Critical"
              onClick={() => setIsRemoveDialogOpen(true)}
              disabled={removeState.status === AsyncStatus.Loading}
            >
              <Text size="B300">Revoke</Text>
            </Button>
          )}
        </Box>
      </Box>
      <Overlay open={isRemoveDialogOpen} backdrop={<OverlayBackdrop />}>
        <OverlayCenter>
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              onDeactivate: closeDialogHandler,
              clickOutsideDeactivates: true,
            }}
          >
            <Dialog>
              <Header
                style={{
                  padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                  borderBottomWidth: config.borderWidth.B300,
                }}
                variant="Surface"
                size="500"
              >
                <Box grow="Yes">
                  <Text size="H4" truncate>
                    Revoke the key
                  </Text>
                </Box>

                <IconButton size="300" onClick={closeDialogHandler} radii="300">
                  <Icon src={Icons.Cross} />
                </IconButton>
              </Header>
              <Box direction="Column" gap="500" style={{ padding: `${config.space.S500}` }}>
                {(removeState.status === AsyncStatus.Error && (
                  <Text as="span" size="T200">
                    Deletion failed, please try again.
                  </Text>
                )) || (
                  <>
                    <Text size="T300">
                      Devices using this key for login will be automatically logged out and
                      can&apos;t use this key for future access once it&apos;s revoked.
                    </Text>
                    <Button
                      variant="Critical"
                      onClick={startRemoveOwner}
                      disabled={removeState.status === AsyncStatus.Loading}
                    >
                      {removeState.status === AsyncStatus.Loading && <Spinner />}
                      <Text size="B400">Revoke</Text>
                    </Button>
                  </>
                )}
              </Box>
              {/* 空元素 */}
              <button
                type="button"
                tabIndex={0}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                aria-hidden="true"
              />
            </Dialog>
          </FocusTrap>
        </OverlayCenter>
      </Overlay>
    </>
  );
}
