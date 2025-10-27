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
  color,
  Chip,
  Checkbox,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { english, generateMnemonic, mnemonicToAccount } from 'viem/accounts';
import { Address } from 'viem';
import { UserOperationReceipt } from '@src/app/hooks/web3/types';
import { CredentialItem } from '@src/app/extendApis';
import { copyToClipboard } from '@src/app/utils/dom';
import { SyncOwnershipChange } from '@src/app/components/wallet/multi-chain/SyncOwnershipChange';
import { useChainConfig } from '@src/app/hooks/web3/useChainConfig';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';
import { stopPropagation } from '../../../utils/keyboard';
import { SettingTile } from '../../../components/setting-tile';
import { getSecret } from '../../../../client/state/auth';
import { useFetchPasskeyList } from '../../../hooks/useFetchPasskeyList';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
// import { useAbstractAccount } from '../../../hooks/web3/useAbstractAccount';
import { useAsyncCallback, AsyncStatus } from '../../../hooks/useAsyncCallback';
import { OwnerItem } from './OwnerItem';
import { RecoveryPhrase } from '../../../components/wallet/multi-chain/RecoveryPhrase';

type Props = {
  requestClose: () => void;
};

export function Wallet({ requestClose }: Props) {
  const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);
  const [isSetIsSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const { availableChains } = useChainConfig();
  const { publicKey: currentPublicKey, aaAddress } = getSecret();
  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData, refetch] = useFetchPasskeyList(userId!);

  // const { addOwnerByAddress } = useAbstractAccount(aaAddress as Address);

  // const [addState, startAddOwnerByAddress] = useAsyncCallback<
  //   UserOperationReceipt,
  //   Error,
  //   Parameters<typeof addOwnerByAddress>
  // >(useCallback(addOwnerByAddress, [addOwnerByAddress]));

  // const [copyChecked, setCopyChecked] = useState(false);

  const handleGenerateRecovery = async () => {
    const mnemonic = generateMnemonic(english);
    // const mnemonicAccount = mnemonicToAccount(mnemonic);
    setIsRecoveryDialogOpen(true);
    setRecoveryKey(mnemonic);
    // try {
    //   const receipt = await startAddOwnerByAddress(mnemonicAccount.address);
    //   setRecoveryKey(mnemonic);
    // } catch (error) {
    //   console.error(error);
    //   return;
    // }
    // await refetch();
  };
  const handleSync = async () => {
    setIsSyncDialogOpen(true);
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
                    title="Wallet Recovery Phrase"
                    description="If you lose this device, or delete the passkey from the system, you risk losing your assets and message data. To protect your account, please establish a Wallet Recovery Phrase now!"
                    after={
                      <Button size="300" radii="300" onClick={handleGenerateRecovery}>
                        <Text size="B300">Generate</Text>
                      </Button>
                    }
                  />
                </SequenceCard>
              </Box>
              <Box direction="Column" gap="100">
                <Text size="L400">Manage wallet</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  <SettingTile
                    title="Sync ownership changes"
                    description="You've modified the ownership of Signers on your OVM wallet. You’ll need to sync these changes so they take effect on other chains."
                    after={
                      <Button size="300" radii="300" onClick={handleSync}>
                        <Text size="B300">Sync</Text>
                      </Button>
                    }
                  />
                </SequenceCard>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  {passkeyData?.credentials.map((item: CredentialItem) => (
                    <OwnerItem
                      key={item.publicKey}
                      currentPublicKey={currentPublicKey ?? ''}
                      credential={item}
                      aaAddress={aaAddress as Address}
                      deleteCallback={refetch}
                    />
                  ))}
                </SequenceCard>
                <Text>
                  Please never modify the key name of Passkey, as doing so may result in a loss of
                  access.
                </Text>
              </Box>
              <Box direction="Column" gap="100">
                <Text size="L400">Wallet Address</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  <SettingTile
                    title={passkeyData?.walletAddress ?? ''}
                    after={
                      <Chip
                        variant="Secondary"
                        radii="Pill"
                        onClick={() => copyToClipboard(passkeyData?.walletAddress ?? '')}
                      >
                        <Text size="T200">Copy</Text>
                      </Chip>
                    }
                  />
                </SequenceCard>
              </Box>
            </Box>
          </PageContent>
        </Scroll>
      </Box>

      {isRecoveryDialogOpen && (
        <RecoveryPhrase phrase={recoveryKey} onClose={() => setIsRecoveryDialogOpen(false)} />
      )}

      {isSetIsSyncDialogOpen && (
        <SyncOwnershipChange
          onClose={() => setIsSyncDialogOpen(false)}
          chainIds={availableChains.map((chain) => chain.chainId)}
        />
      )}

      {/* <Overlay open={isRecoveryDialogOpen} backdrop={<OverlayBackdrop />}>
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
                  <Text size="H4">Creating Wallet Recovery Phrase</Text>
                </Box>
                <IconButton size="300" onClick={() => setIsRecoveryDialogOpen(false)} radii="300">
                  <Icon src={Icons.Cross} />
                </IconButton>
              </Header>
              {addState.status === AsyncStatus.Success && (
                <Box style={{ padding: config.space.S400 }} direction="Column" gap="400">
                  <Box direction="Column" gap="200">
                    <Text>Please save this Wallet Recovery Phrase in a safe place:</Text>
                    <Box
                      direction="Column"
                      gap="100"
                      alignItems="Start"
                      style={{
                        backgroundColor: color.Background.Container,
                        padding: config.space.S400,
                        borderRadius: config.radii.R400,
                      }}
                    >
                      <Text size="B500" style={{ wordBreak: 'break-all' }}>
                        {recoveryKey}
                      </Text>
                      <Box alignSelf="End">
                        <Chip
                          variant="Secondary"
                          radii="Pill"
                          onClick={() => copyToClipboard(recoveryKey)}
                        >
                          <Text size="T200">Copy</Text>
                        </Chip>
                      </Box>
                    </Box>
                  </Box>
                  <Box gap="100">
                    <Checkbox checked={copyChecked} onChange={() => setCopyChecked(!copyChecked)} />
                    <Text>I&apos;ve saved this phrase in a safe place.</Text>
                  </Box>
                  <Button
                    variant="Secondary"
                    fill="Soft"
                    onClick={() => setIsRecoveryDialogOpen(false)}
                    disabled={!copyChecked}
                  >
                    <Text size="B400">Done</Text>
                  </Button>
                </Box>
              )}
              {addState.status === AsyncStatus.Loading && (
                <Box
                  direction="Column"
                  gap="400"
                  alignItems="Center"
                  style={{ padding: config.space.S400 }}
                >
                  <Spinner />
                  <Text>Do not close the window.</Text>
                </Box>
              )}
              {addState.status === AsyncStatus.Error && (
                <Box style={{ padding: config.space.S400 }} direction="Column">
                  <Text size="B400">
                    Error occurred while generating Wallet Recovery Phrase. Please try again.
                  </Text>
                </Box>
              )}

              <button
                type="button"
                tabIndex={0}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                aria-hidden="true"
              />
            </Dialog>
          </FocusTrap>
        </OverlayCenter>
      </Overlay> */}
    </Page>
  );
}
