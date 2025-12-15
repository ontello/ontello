import React from 'react';
import {
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Dialog,
  Header,
  Box,
  Text,
  IconButton,
  Icon,
  Icons,
  Button,
  config,
} from 'folds';

type ConfirmDialogProps = {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <Dialog variant="Surface">
          <Header
            size="500"
            variant="Surface"
            style={{ padding: `0 ${config.space.S200} 0 ${config.space.S400}` }}
          >
            <Box grow="Yes">
              <Text size="H4">{title}</Text>
            </Box>
            <IconButton size="300" radii="300" onClick={onCancel}>
              <Icon src={Icons.Cross} />
            </IconButton>
          </Header>
          <Box direction="Column" gap="400" style={{ padding: config.space.S400, minWidth: 0 }}>
            <Text
              size="T300"
              style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}
            >
              {message}
            </Text>
            <Box gap="200" justifyContent="End">
              <Button variant="Secondary" onClick={onCancel}>
                <Text size="B300">{cancelLabel}</Text>
              </Button>
              <Button variant="Primary" onClick={onConfirm}>
                <Text size="B300">{confirmLabel}</Text>
              </Button>
            </Box>
          </Box>
        </Dialog>
      </OverlayCenter>
    </Overlay>
  );
}
