import {
  Dialog,
  Header,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  config,
  Box,
  Text,
  IconButton,
  Icons,
  Icon,
} from 'folds';
import React from 'react';
import FocusTrap from 'focus-trap-react';
import { stopPropagation } from '@src/app/utils/keyboard';

export function OntelloDialog({
  onClose,
  children,
  title = '',
  header,
}: {
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  header?: React.ReactNode;
}) {
  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: onClose,
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog variant="Surface">
            {header || (
              <Header
                style={{
                  padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                  borderBottomWidth: config.borderWidth.B300,
                }}
                variant="Surface"
                size="700"
              >
                <Box direction="Column" grow="Yes">
                  <Text size="H3">{title}</Text>
                </Box>
                <IconButton size="300" onClick={onClose} radii="300">
                  <Icon src={Icons.Cross} />
                </IconButton>
              </Header>
            )}
            {children}
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
