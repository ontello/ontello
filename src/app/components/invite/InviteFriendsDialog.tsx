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
  Scroll,
  Text,
} from 'folds';

import { useCloseGlobalDialog, useGlobalDialogState } from '../../state/hooks/globalDialogs';
import { GlobalDialogType } from '../../state/globalDialogs';
import * as css from './InviteFriendsDialog.css';
import { stopPropagation } from '../../utils/keyboard';
import { InviteHistoryList, botApi } from '../../externalApis';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { getMxIdServer } from '../../utils/matrix';
import Gift from '../../../app/static/icons/Gift';
import Turbine from '../../../app/static/icons/Turbine';
import Lightning from '@src/app/static/icons/Lightning';
import { timeDayMonthYear } from '@src/app/utils/time';

export function InviteFriendsDialog() {
  const dialogData = useGlobalDialogState(GlobalDialogType.InviteFriends);
  const closeDialog = useCloseGlobalDialog(GlobalDialogType.InviteFriends);
  const [isOpen, setIsOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [inviteLink, setInviteLink] = useState('');
  const [loadingLink, setLoadingLink] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<InviteHistoryList[]>([]);
  const mx = useMatrixClient();
  const serverName = getMxIdServer(mx.getUserId() || '') ?? '';

  useEffect(() => {
    setIsOpen(Boolean(dialogData));
    if (!dialogData) {
      setCopyState('idle');
      setInviteLink('');
      setInviteError(null);
      setHistoryOpen(false);
      setHistoryError(null);
      setHistoryList([]);
    }
  }, [dialogData]);

  useEffect(() => {
    if (!dialogData) return;

    setLoadingLink(true);
    setInviteError(null);
    botApi
      .businessInvitecodeGet()
      .then((res) => {
        const inviteCode = res.result;

        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const link = inviteCode ? `${origin}/register/${serverName}?code=${inviteCode}` : '';
        setInviteLink(link);
      })
      .catch((error) => {
        console.error('Failed to fetch invite link', error);
        setInviteLink('');
        setInviteError('Failed to load invite link');
      })
      .finally(() => setLoadingLink(false));
  }, [dialogData, serverName]);

  useEffect(() => {
    if (!historyOpen) return;

    setHistoryLoading(true);
    setHistoryError(null);
    botApi
      .businessInviteListGet({
        page_num: 1,
        page_size: 100,
      })
      .then((res) => {
        setHistoryList(res.result ?? []);
      })
      .catch((error) => {
        console.error('Failed to fetch invite history', error);
        setHistoryError('Failed to load history');
      })
      .finally(() => setHistoryLoading(false));
  }, [historyOpen]);

  if (!dialogData) return null;

  const handleClose = () => {
    setIsOpen(false);
    setHistoryOpen(false);
    closeDialog();
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    if (!navigator.clipboard) {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 1500);
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1500);
    } catch (error) {
      console.error('Failed to copy invite link', error);
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 1500);
    }
  };

  const copyLabel =
    copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy';
  const linkLabel = inviteLink
    ? inviteLink
    : loadingLink
    ? 'Loading...'
    : inviteError || 'Invite link unavailable';
  const disableCopy = !inviteLink || loadingLink || Boolean(inviteError);

  return (
    <>
      <Overlay open={isOpen} backdrop={<OverlayBackdrop />}>
        <OverlayCenter>
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              clickOutsideDeactivates: true,
              escapeDeactivates: stopPropagation,
            }}
          >
            <Dialog className={css.InviteDialog} variant="Surface">
              <Header className={css.Header} variant="Surface" size="500">
                <Box grow="Yes" alignItems="Center" gap="200">
                  <Text size="H4">Invite friends</Text>
                </Box>
                <IconButton size="300" onClick={handleClose} radii="300">
                  <Icon src={Icons.Cross} />
                </IconButton>
              </Header>

              <Box className={css.Content}>
                <Box className={css.Section}>
                  <Text size="B400" priority="500">
                    Share your invitation link:
                  </Text>
                  <Box className={css.LinkRow}>
                    <Icon size="200" src={Icons.Link} />
                    <Text className={css.LinkText} size="T300" priority="500" truncate>
                      {linkLabel}
                    </Text>
                    <Button
                      className={css.CopyButton}
                      variant="Primary"
                      size="300"
                      fill="Solid"
                      onClick={handleCopy}
                      disabled={disableCopy}
                    >
                      <Text size="B300">{copyLabel}</Text>
                    </Button>
                  </Box>
                  {inviteError && (
                    <Text size="T200" priority="300">
                      {inviteError}
                    </Text>
                  )}
                </Box>

                <Box className={css.Section}>
                  <Text size="B400" priority="500">
                    How it works:
                  </Text>
                  <Box className={css.Step}>
                    <Icon size="200" src={Lightning} />
                    <Text size="T200">Share your invite link</Text>
                  </Box>
                  <Box className={css.Step}>
                    <Icon size="200" src={Turbine} />
                    <Text size="T200">They sign up and activate AI</Text>
                  </Box>
                  <Box className={css.Step}>
                    <Icon size="200" src={Gift} />
                    <Text size="T200">
                      You get <span className={css.Highlight}>10 credits</span>
                    </Text>
                  </Box>
                </Box>

                <Button
                  className={css.HistoryButton}
                  variant="Primary"
                  size="300"
                  fill="Soft"
                  onClick={() => setHistoryOpen(true)}
                >
                  <Icon size="200" src={Icons.Clock} />
                  <Text size="B300">Referral history</Text>
                </Button>
              </Box>
            </Dialog>
          </FocusTrap>
        </OverlayCenter>
      </Overlay>
      <Overlay open={historyOpen} backdrop={<OverlayBackdrop />}>
        <OverlayCenter>
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              clickOutsideDeactivates: true,
              escapeDeactivates: stopPropagation,
            }}
          >
            <Dialog className={css.HistoryDialog} variant="Surface">
              <Header className={css.HistoryHeader} variant="Surface" size="500">
                <Box grow="Yes" alignItems="Center">
                  <Text size="H4">Referral history</Text>
                </Box>
                <IconButton size="300" onClick={() => setHistoryOpen(false)} radii="300">
                  <Icon src={Icons.Cross} />
                </IconButton>
              </Header>

              <Box className={css.HistoryContent}>
                {(historyList.length > 0 || historyLoading || historyError) && (
                  <Box className={css.HistoryHeadings}>
                    <Text size="B300" priority="500">
                      Invitees
                    </Text>
                    <Text className={css.HistoryDate} size="B300" priority="500">
                      Date
                    </Text>
                  </Box>
                )}
                {historyLoading && (
                  <Box className={css.HistoryEmpty}>
                    <Text size="T200" priority="300">
                      Loading...
                    </Text>
                  </Box>
                )}
                {historyError && !historyLoading && (
                  <Box className={css.HistoryEmpty}>
                    <Text size="T200" priority="300">
                      {historyError}
                    </Text>
                  </Box>
                )}
                {!historyLoading && !historyError && historyList.length === 0 && (
                  <Box className={css.HistoryEmpty}>
                    <Text size="B300" priority="500">
                      No data
                    </Text>
                  </Box>
                )}
                {!historyLoading && !historyError && historyList.length > 0 && (
                  <Scroll className={css.HistoryScroll} visibility="Always" hideTrack>
                    <Box className={css.HistoryList}>
                      {historyList.map((item) => (
                        <Box className={css.HistoryRow} key={`${item.invitee}-${item.inviteTime}`}>
                          <Text className={css.HistoryInvitee} size="T300" priority="500" truncate>
                            {item.invitee}
                          </Text>
                          <Text className={css.HistoryDate} size="T300" priority="500">
                            {timeDayMonthYear(item.inviteTime)}
                          </Text>
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
    </>
  );
}

export default InviteFriendsDialog;
