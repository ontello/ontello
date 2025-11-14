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
  const isAndroidFlow = platform === 'android' && typeof onInstallClick === 'function';

  const platformContent = useMemo(() => {
    if (platform === 'android') {
      return (
        <Box direction="Column" gap="200">
          <Text size="B400">[Android UI 占位] 在这里放置一键安装的说明与插画。</Text>
          {isAndroidFlow ? (
            <Button disabled={installing} onClick={onInstallClick}>
              <Text as="span" size="B400">
                {installing ? '安装中…' : '安装到桌面'}
              </Text>
            </Button>
          ) : (
            <Text size="B400">[Android CTA 占位] 按钮禁用状态的额外提示。</Text>
          )}
        </Box>
      );
    }

    if (platform === 'ios') {
      return (
        <Box direction="Column" gap="200">
          {/* <Text size="B400">[iOS UI 占位] 展示 Safari“分享 → 添加到主屏幕”的操作。</Text>
          <Box direction="Column" gap="100">
            <Text size="B400">1. TODO：插入分享按钮的图示或描述。</Text>
            <Text size="B400">2. TODO：插入“添加到主屏幕”步骤。</Text>
          </Box> */}
          <Text size="B400">1.Click the button on the toolbar.</Text>
        </Box>
      );
    }

    return (
      <Box direction="Column" gap="200">
        <Text size="B400">[通用 UI 占位] 这里用于其它浏览器的安装指引。</Text>
        <Box direction="Column" gap="100">
          <Text size="B400">• TODO：步骤一文案。</Text>
          <Text size="B400">• TODO：步骤二文案。</Text>
        </Box>
      </Box>
    );
  }, [platform, isAndroidFlow, installing, onInstallClick]);

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
                <Text size="H4">安装 {APP_INFO.name}</Text>
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
                <Text size="B400">下次不再提示</Text>
              </Box>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
