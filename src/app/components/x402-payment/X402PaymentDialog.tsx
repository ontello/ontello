import React, { useEffect, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import {
  Box,
  Button,
  Dialog,
  Header,
  Icon,
  IconButton,
  Icons,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Text,
} from 'folds';

import { useCloseGlobalDialog, useGlobalDialogState } from '../../state/hooks/globalDialogs';
import { GlobalDialogType } from '../../state/globalDialogs';
import { stopPropagation } from '../../utils/keyboard';
import * as css from './X402PaymentDialog.css';

export function X402PaymentDialog() {
  const dialogData = useGlobalDialogState(GlobalDialogType.X402Payment);
  const closeDialog = useCloseGlobalDialog(GlobalDialogType.X402Payment);
  const [isOpen, setIsOpen] = useState(false);

  const [accepts, setAccepts] = useState<string[]>([]);
  const [loadingAccepts, setLoadingAccepts] = useState(false);
  const [acceptsError, setAcceptsError] = useState<string | null>(null);

  useEffect(() => {
    setIsOpen(Boolean(dialogData));
  }, [dialogData]);

  useEffect(() => {
    if (!dialogData?.link) return;

    setLoadingAccepts(true);
    setAcceptsError(null);
    setAccepts([]);

    const fetchAccepts = async () => {
      try {
        const response = await fetch(dialogData.link, { method: 'GET' });
        console.log('response', response);
        console.log('json');
        if (response.status !== 402) {
          setAcceptsError(`No accepts found (status ${response.status}).`);
        }
        const resbBody = await response.json();
        setAccepts(resbBody.accepts);
      } catch (error) {
        setAcceptsError('Unable to load payment accepts.');
      }
    };

    fetchAccepts();
  }, [dialogData?.link]);

  if (!dialogData) return null;

  const acceptsLabel = (() => {
    if (loadingAccepts) return 'Fetching payment accepts...';
    if (acceptsError) return acceptsError;
    if (accepts.length) return `Supported accepts: ${accepts.join(', ')}`;
    return 'No available accepts.';
  })();

  const handleClose = () => {
    setIsOpen(false);
    closeDialog();
  };

  return (
    <Overlay open={isOpen} backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog className={css.Dialog} variant="Surface">
            <Header className={css.Header} variant="Surface" size="500">
              <Box grow="Yes" alignItems="Center" gap="100">
                <Text size="H4">X402 Checkout</Text>
              </Box>
              <IconButton size="300" onClick={handleClose} radii="300">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>

            <Box className={css.Content}>
              <Box className={css.Section}>
                <Box className={css.LabelRow}>
                  <Text size="B400" priority="500">
                    Payment For:
                  </Text>
                </Box>
                <Text size="T300" priority="500">
                  {dialogData.paymentFor || '—'}
                </Text>
              </Box>

              <Box className={css.Actions}>
                <Button variant="Primary" size="300" fill="Solid" disabled>
                  <Text size="B300">Pay</Text>
                </Button>
              </Box>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}

export default X402PaymentDialog;
