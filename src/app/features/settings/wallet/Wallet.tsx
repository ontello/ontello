import React, { useState } from 'react';
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
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';
import { stopPropagation } from '../../../utils/keyboard';
import { SettingTile } from '../../../components/setting-tile';
import { getSecret } from '../../../../client/state/auth';
import { useFetchPasskeyList } from '../../../hooks/useFetchPasskeyList';
import { useMatrixClient } from '../../../hooks/useMatrixClient';

interface PasskeyItem {
  id: string;
  publicKey: string;
}

type Props = {
  requestClose: () => void;
};

export function Wallet({ requestClose }: Props) {
  const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');

  const { publicKey: currentPublicKey } = getSecret();
  const mx = useMatrixClient();
  const userId = mx.getUserId();

  const [passkeys, refetch] = useFetchPasskeyList(userId!);

  const handleGenerateRecovery = async () => {
    try {
      // TODO: 调用生成助记词的函数
      // const mnemonic = await generateMnemonic();
      setRecoveryKey('示例助记词');
      setIsRecoveryDialogOpen(true);
    } catch (error) {
      // TODO: 使用错误提示组件
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    try {
      // TODO: 实现删除 passkey 的逻辑
      // await mx.deletePasskey(passkeyId);
    } catch (err) {
      // TODO: 使用错误提示组件
      console.error(err);
    }
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
                <Text size="L400">Passkeys</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  {passkeys.map((item: PasskeyItem) => (
                    <Box
                      key={item.id}
                      direction="Row"
                      justifyContent="SpaceBetween"
                      alignItems="Center"
                    >
                      <Text>{item.publicKey}</Text>
                      {item.publicKey !== currentPublicKey && (
                        <Button variant="Critical" onClick={() => handleDeletePasskey(item.id)}>
                          Delete
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
                <IconButton size="300" onClick={() => setIsRecoveryDialogOpen(false)} radii="300">
                  <Icon src={Icons.Cross} />
                </IconButton>
              </Header>
              <Box style={{ padding: config.space.S400 }} direction="Column" gap="400">
                <Box direction="Column" gap="200">
                  <Text>Please save this recovery key in a safe place:</Text>
                  <Text style={{ wordBreak: 'break-all' }}>{recoveryKey}</Text>
                </Box>
                <Button
                  variant="Secondary"
                  fill="Soft"
                  onClick={() => setIsRecoveryDialogOpen(false)}
                >
                  <Text size="B400">Close</Text>
                </Button>
              </Box>
            </Dialog>
          </FocusTrap>
        </OverlayCenter>
      </Overlay>
    </Page>
  );
}
