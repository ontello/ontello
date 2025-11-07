import React, { useState, useEffect } from 'react';
import { Box, Text, Button, Icon, IconButton, Icons, Scroll, Chip } from 'folds';
import { Address } from 'viem';
import { CredentialItem } from '@src/app/extendApis';
import { copyToClipboard } from '@src/app/utils/dom';
import { SyncOwnershipChange } from '@src/app/components/wallet/multi-chain/SyncOwnershipChange';
import { useChainConfig } from '@src/app/hooks/web3/useChainConfig';
import { useOwnerManage } from '@src/app/hooks/web3/useOwnerManage';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';
import { SettingTile } from '../../../components/setting-tile';
import { getAuthExtras } from '../../../state/authExtras';
import { useFetchPasskeyList } from '../../../hooks/useFetchPasskeyList';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { OwnerItem } from './OwnerItem';
import { RecoveryPhrase } from '../../../components/wallet/multi-chain/RecoveryPhrase';

type Props = {
  requestClose: () => void;
};

export function Wallet({ requestClose }: Props) {
  const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);
  const [isSetIsSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [isOwnerInitial, setIsOwnerInitial] = useState<boolean>(true);
  const { availableChains } = useChainConfig();
  const { publicKey: currentPublicKey, aaAddress } = getAuthExtras();
  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData, refetch] = useFetchPasskeyList(userId!);
  const { checkOwnerInitial } = useOwnerManage(aaAddress as Address);

  useEffect(() => {
    const checkOwnerStatus = async () => {
      try {
        const isInitial = await checkOwnerInitial();
        setIsOwnerInitial(isInitial);
      } catch (error) {
        console.error('Error checking owner initial status:', error);
        setIsOwnerInitial(true);
      }
    };

    checkOwnerStatus();
  }, [checkOwnerInitial]);

  const handleGenerateRecovery = async () => {
    setIsRecoveryDialogOpen(true);
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
                <Text size="L400">Wallet address</Text>
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
                {isOwnerInitial === false && (
                  <SequenceCard
                    className={SequenceCardStyle}
                    variant="SurfaceVariant"
                    direction="Column"
                    gap="400"
                  >
                    <SettingTile
                      title="Sync ownership changes"
                      description="You've modified the ownership of signers on your OVM wallet. You'll need to sync these changes so they take effect on other chains."
                      after={
                        <Button size="300" radii="300" onClick={handleSync}>
                          <Text size="B300">Sync</Text>
                        </Button>
                      }
                    />
                  </SequenceCard>
                )}
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
                <Text size="B300">
                  Please never modify the key name of Passkey, as doing so may result in a loss of
                  access.
                </Text>
              </Box>
            </Box>
          </PageContent>
        </Scroll>
      </Box>

      {isRecoveryDialogOpen && <RecoveryPhrase onClose={() => setIsRecoveryDialogOpen(false)} />}

      {isSetIsSyncDialogOpen && (
        <SyncOwnershipChange
          onClose={() => setIsSyncDialogOpen(false)}
          chainIds={availableChains.map((chain) => chain.chainId)}
        />
      )}
    </Page>
  );
}
