import React, { useMemo, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Header,
  Icon,
  IconButton,
  Icons,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Text,
  config,
  toRem,
} from 'folds';
import { stopPropagation } from '../../utils/keyboard';
import { APP_INFO } from '../../config/appInfo';
import othersPng from '@app/static/imgs/Group 99246462.png';
import iosPng1 from '@app/static/imgs/IMG_9524.png';
import iosPng2 from '@app/static/imgs/IMG_9525.png';

export type InstallPromptPlatform = 'android' | 'ios' | 'other';
export const INSTALL_PROMPT_DISMISS_KEY = 'ontello_install_prompt_dismissed';

type InstallPromptModalProps = {
  platform: InstallPromptPlatform;
  installing: boolean;
  initialDontShowAgain?: boolean;
  onInstallClick?: () => void;
  onDismiss: () => void;
};

export function InstallPromptModal({
  platform,
  installing,
  initialDontShowAgain = false,
  onInstallClick,
  onDismiss,
}: InstallPromptModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(initialDontShowAgain);

  const platformContent = useMemo(() => {
    if (platform === 'android') {
      return (
        <Box direction="Column" gap="200">
          <Button disabled={installing} onClick={onInstallClick}>
            <Text as="span" size="B400">
              {installing ? 'Installing...' : 'Install'}
            </Text>
          </Button>
        </Box>
      );
    }

    if (platform === 'ios') {
      return (
        <Box direction="Column" gap="200">
          <Text size="B400">1.Click the button on the toolbar.</Text>
          <img src={iosPng1} alt="" />
          <Text size="B400">2.Click “Add to screen ”</Text>
          <img src={iosPng2} alt="" />
        </Box>
      );
    }

    return (
      <Box direction="Column" gap="200">
        <Text>Open this page in Chrome, then follow the guide below.</Text>
        <img src={othersPng} alt="" />
      </Box>
    );
  }, [platform, installing, onInstallClick]);

  const handleDontShowAgainChange = () => {
    const nextValue = !dontShowAgain;
    setDontShowAgain(nextValue);
    if (typeof window === 'undefined') return;
    if (nextValue) {
      window.localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, 'true');
    } else {
      window.localStorage.removeItem(INSTALL_PROMPT_DISMISS_KEY);
    }
  };

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            clickOutsideDeactivates: true,
            onDeactivate: onDismiss,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog variant="Surface" style={{ width: '100%', maxWidth: toRem(420) }}>
            <Header
              style={{
                padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                borderBottomWidth: config.borderWidth.B300,
              }}
              variant="Surface"
              size="500"
            >
              <Box grow="Yes">
                <Text size="H4">Install {APP_INFO.name}</Text>
              </Box>
              <IconButton size="300" onClick={onDismiss} radii="300">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>

            <Box direction="Column" gap="400" style={{ padding: config.space.S500 }}>
              {platformContent}

              <Box alignItems="Center" gap="200">
                {/* @ts-expect-error - folds Checkbox typing differs from DOM checkbox props */}
                <Checkbox checked={dontShowAgain} onChange={handleDontShowAgainChange} size="300" />
                <Text size="B400">Don't remind me again</Text>
              </Box>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
