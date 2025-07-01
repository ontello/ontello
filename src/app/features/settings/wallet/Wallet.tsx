import React, { useState, useCallback } from 'react';
import {
  Box,
  Text,
  Button,
  Overlay,
  OverlayCenter,
  OverlayBackdrop,
  Icon,
  IconButton,
  Icons,
  Dialog,
  Header,
  config,
  Scroll,
  Spinner,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { english, generateMnemonic, mnemonicToAccount } from 'viem/accounts';
import { Address } from 'viem';
import { UserOperationReceipt } from '@src/app/hooks/web3/types';
import { CredentialItem } from '@src/app/extendApis';
import { ellipsisMiddle } from '@src/app/utils/common';
import { timeDayMonthYear } from '@src/app/utils/time';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';
import { stopPropagation } from '../../../utils/keyboard';
import { SettingTile } from '../../../components/setting-tile';
import { getSecret } from '../../../../client/state/auth';
import { useFetchPasskeyList } from '../../../hooks/useFetchPasskeyList';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useWeb3PublicClient } from '../../../hooks/web3/useWeb3Client';
import { useAbstractAccount } from '../../../hooks/web3/useAbstractAccount';
import { useAsyncCallback, AsyncStatus } from '../../../hooks/useAsyncCallback';

type Props = {
  requestClose: () => void;
};

export function Wallet({ requestClose }: Props) {
  const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const { publicKey: currentPublicKey } = getSecret();
  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData, refetch] = useFetchPasskeyList(userId!);
  const publicClient = useWeb3PublicClient();

  const aaAddress: Address = '0x1a372366093d623ab831ebdef3020aaed362ce42'; // TODO @testuser21:ont.network
  const { addOwnerByAddress, removeOwner } = useAbstractAccount(publicClient, aaAddress);

  const [addState, startAddOwnerByAddress] = useAsyncCallback<
    UserOperationReceipt,
    Error,
    Parameters<typeof addOwnerByAddress>
  >(useCallback(addOwnerByAddress, [addOwnerByAddress]));

  const [removeState, startRemoveOwner] = useAsyncCallback<
    UserOperationReceipt,
    Error,
    Parameters<typeof removeOwner>
  >(useCallback(removeOwner, [removeOwner]));

  const handleGenerateRecovery = async () => {
    const mnemonic = generateMnemonic(english);
    const mnemonicAccount = mnemonicToAccount(mnemonic);
    setIsRecoveryDialogOpen(true);
    const receipt = await startAddOwnerByAddress(mnemonicAccount.address);
    setRecoveryKey(mnemonic);
    await refetch();
  };

  const handleDeletePasskey = async (publicKeyBase64: string) => {
    const receipt = await startRemoveOwner(publicKeyBase64);
    await refetch();
  };

  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Wallet
            </Text>
          </Box>
          <Box shrink="No">
            <IconButton onClick={requestClose} variant="Surface">
              <Icon src={Icons.Cross} />
            </IconButton>
          </Box>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <Box direction="Column" gap="700">
              <Box direction="Column" gap="100">
                <Text size="L400">Backup your wallet</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  <SettingTile
                    title="Recovery Key"
                    description="If you lose this device, or delete the passkey from the system, you risk losing your assets and message data. To protect your account, please establish a recovery key now!"
                    after={
                      <Button size="300" radii="300" onClick={handleGenerateRecovery}>
                        <Text size="B300">Generate</Text>
                      </Button>
                    }
                  />
                </SequenceCard>
              </Box>
              <Box direction="Column" gap="100">
                <Text size="L400">Owners</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  {passkeyData?.credentials.map((item: CredentialItem) => (
                    <Box
                      key={item.publicKey}
                      direction="Row"
                      justifyContent="SpaceBetween"
                      alignItems="Center"
                    >
                      <Box direction="Column">
                        <Text>{ellipsisMiddle(item.publicKey)}</Text>
                        <Text>{timeDayMonthYear(item.timestamp)}</Text>
                      </Box>

                      {item.publicKey !== currentPublicKey && (
                        <Button
                          size="300"
                          radii="300"
                          variant="Critical"
                          onClick={() => handleDeletePasskey(item.publicKey)}
                        >
                          <Text size="B300">Delete</Text>
                        </Button>
                      )}
                    </Box>
                  ))}
                </SequenceCard>
              </Box>
            </Box>
          </PageContent>
        </Scroll>
      </Box>

      <Overlay open={isRecoveryDialogOpen} backdrop={<OverlayBackdrop />}>
        <OverlayCenter>
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              onDeactivate: () => setIsRecoveryDialogOpen(false),
              clickOutsideDeactivates: true,
              escapeDeactivates: stopPropagation,
            }}
          >
            <Dialog variant="Surface">
              <Header
                style={{
                  padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                  borderBottomWidth: config.borderWidth.B300,
                }}
                variant="Surface"
                size="500"
              >
                <Box grow="Yes">
                  <Text size="H4">Recovery Key</Text>
                </Box>
                {/* <IconButton size="300" onClick={() => setIsRecoveryDialogOpen(false)} radii="300">
                  <Icon src={Icons.Cross} />
                </IconButton> */}
              </Header>
              {addState.status === AsyncStatus.Success ? (
                <Box style={{ padding: config.space.S400 }} direction="Column" gap="400">
                  <Box direction="Column" gap="200">
                    <Text>Please save this recovery key in a safe place:</Text>
                    <Text size="B500" style={{ wordBreak: 'break-all' }}>
                      {recoveryKey}
                    </Text>
                  </Box>
                  <Button
                    variant="Secondary"
                    fill="Soft"
                    onClick={() => setIsRecoveryDialogOpen(false)}
                  >
                    <Text size="B400">Close</Text>
                  </Button>
                </Box>
              ) : (
                <Box
                  justifyContent="Center"
                  alignItems="Center"
                  style={{
                    margin: ` ${config.space.S600} 0 ${config.space.S600} 0`,
                  }}
                >
                  <Spinner />
                  <button
                    type="button"
                    tabIndex={0}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    aria-hidden="true"
                  />
                </Box>
              )}
            </Dialog>
          </FocusTrap>
        </OverlayCenter>
      </Overlay>
    </Page>
  );
}
