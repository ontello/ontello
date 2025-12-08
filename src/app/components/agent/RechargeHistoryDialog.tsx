import React, { useEffect, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import {
  Box,
  Dialog,
  Header,
  Icon,
  IconButton,
  Icons,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Scroll,
  Spinner,
  Text,
} from 'folds';
import { botApi } from '../../externalApis';
import type { RechargeHistory } from '../../externalApis';
import * as css from './RechargeHistoryDialog.css';
import { timeFullDateTime } from '@src/app/utils/time';

type RechargeHistoryDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function RechargeHistoryDialog({ open, onClose }: RechargeHistoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<RechargeHistory[]>([]);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const loadHistory = async () => {
      setLoading(true);
      try {
        const res = await botApi.businessRechargeHistoryGet({ page_num: 1, page_size: 100 });
        if (mounted) {
          setHistory(res.result ?? []);
        }
      } catch (error) {
        console.error('Failed to load recharge history', error);
        if (mounted) {
          setHistory([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadHistory();
    return () => {
      mounted = false;
    };
  }, [open]);

  if (!open) return null;

  return (
    <Overlay open={isOpen} backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            clickOutsideDeactivates: true,
            escapeDeactivates: () => {
              onClose();
              return true;
            },
          }}
        >
          <Dialog className={css.Dialog} variant="Surface">
            <Header className={css.Header} variant="Surface" size="500">
              <Box grow="Yes">
                <Text size="H5">Recharge history</Text>
              </Box>
              <IconButton size="300" onClick={onClose} radii="300">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>

            <Box className={css.Content}>
              {loading ? (
                <Box alignItems="Center" justifyContent="Center" style={{ minHeight: '160px' }}>
                  <Spinner size="300" />
                </Box>
              ) : history.length === 0 ? (
                <Text size="T300" color="Secondary">
                  No recharge history
                </Text>
              ) : (
                <Scroll size="300" style={{ maxHeight: '360px' }}>
                  <Box className={css.List}>
                    <Box className={css.Item}>
                      <Text size="T200" className={css.ItemHeader}>
                        Credits
                      </Text>
                      <Text size="T200" className={css.ItemHeader}>
                        Costs
                      </Text>
                      <Text size="T200" className={css.ItemHeader}>
                        Time
                      </Text>
                    </Box>
                    {history.map((item, idx) => (
                      <Box key={`${item.rechargeTime}-${idx}`} className={css.Item}>
                        <Text size="B300">{item.creditsAmount}</Text>
                        <Text size="B300">{item.tokenAmount}</Text>
                        <Text size="T300">{timeFullDateTime(item.rechargeTime)}</Text>
                      </Box>
                    ))}
                  </Box>
                </Scroll>
              )}
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}

export default RechargeHistoryDialog;
