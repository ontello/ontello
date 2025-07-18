import React, { useCallback } from 'react';
import { Box, Text, Button, Spinner, color, Badge } from 'folds';
import { ellipsisMiddle } from '@src/app/utils/common';
import { timeDayMonthYear, timeDayMonYear, timeFullDateTime } from '@src/app/utils/time';
import { CredentialItem } from '@src/app/extendApis';
import { UserOperationReceipt } from '@src/app/hooks/web3/types';
import { AsyncStatus, useAsyncCallback } from '@src/app/hooks/useAsyncCallback';
import { Address } from 'viem';
import { useAbstractAccount } from '@src/app/hooks/web3/useAbstractAccount';
import { useWeb3PublicClient } from '@src/app/hooks/web3/useWeb3Client';

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
  const publicClient = useWeb3PublicClient();
  const { removeOwner } = useAbstractAccount(publicClient, aaAddress);
  const [removeState, startRemoveOwner] = useAsyncCallback<
    UserOperationReceipt,
    Error,
    Parameters<typeof removeOwner>
  >(useCallback(removeOwner, [removeOwner]));
  const handleDeletePasskey = async (publicKeyBase64: string) => {
    const receipt = await startRemoveOwner(publicKeyBase64);
    await deleteCallback();
  };
  const isCurrent = credential.publicKey === currentPublicKey;

  return (
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
            <Text>{(credential.publicKey.length === 43 && 'Recovery Key') || 'Passkey'}</Text>
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
            onClick={() => handleDeletePasskey(credential.publicKey)}
            disabled={removeState.status === AsyncStatus.Loading}
          >
            {removeState.status === AsyncStatus.Loading ? (
              <Spinner />
            ) : (
              <Text size="B300">Delete</Text>
            )}
          </Button>
        )}
      </Box>
      {removeState.status === AsyncStatus.Error && (
        <Text as="span" style={{ color: color.Critical.Main }} size="T200">
          Deletion failed, please try again.
        </Text>
      )}
    </Box>
  );
}
