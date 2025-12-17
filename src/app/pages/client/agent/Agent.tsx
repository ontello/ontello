import React, {
  MouseEventHandler,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom, useAtomValue } from 'jotai';
import {
  Avatar,
  Box,
  Button,
  Icon,
  IconButton,
  Icons,
  Menu,
  MenuItem,
  PopOut,
  RectCords,
  Text,
  config,
  color,
  toRem,
} from 'folds';
import { useVirtualizer } from '@tanstack/react-virtual';
import FocusTrap from 'focus-trap-react';
import storeImg from '@app/static/imgs/AgentstoreL.png';
import { Credits, botApi } from '../../../externalApis';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useInterval } from '../../../hooks/useInterval';
import { factoryRoomIdByActivity } from '../../../utils/sort';
import {
  NavButton,
  NavCategory,
  NavEmptyCenter,
  NavEmptyLayout,
  NavItem,
  NavItemContent,
} from '../../../components/nav';
import { getCanonicalAliasOrRoomId } from '../../../utils/matrix';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import { VirtualTile } from '../../../components/virtualizer';
import { RoomNavItem } from '../../../features/room-nav';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import { useAgentRooms } from './useAgentRooms';
import { PageNav, PageNavContent, PageNavHeader } from '../../../components/page';
import { useRoomsUnread } from '../../../state/hooks/unread';
import { markAsRead } from '../../../utils/notifications';
import { stopPropagation } from '../../../utils/keyboard';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import {
  getRoomNotificationMode,
  useRoomsNotificationPreferencesContext,
} from '../../../hooks/useRoomsNotificationPreferences';
import { STORE_PATH } from '../../paths';
import { getAgentDirectRoomPath } from '../../pathUtils';
import { useOpenGlobalDialog } from '../../../state/hooks/globalDialogs';
import { GlobalDialogType } from '../../../state/globalDialogs';
import { RechargeHistoryDialog } from '../../../components/agent/RechargeHistoryDialog';
import Gift from '../../../static/icons/Gift';
import Diamond from '../../../static/icons/Diamond';

// Agent menu (can be extended later)
type AgentMenuProps = {
  requestClose: () => void;
};
const AgentMenu = forwardRef<HTMLDivElement, AgentMenuProps>(({ requestClose }, ref) => {
  const mx = useMatrixClient();
  const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
  const agents = useAgentRooms();
  const unread = useRoomsUnread(agents, roomToUnreadAtom);

  const handleMarkAsRead = () => {
    if (!unread) return;
    agents.forEach((rId) => markAsRead(mx, rId, hideActivity));
    requestClose();
  };

  return (
    <Menu ref={ref} style={{ maxWidth: toRem(160), width: '100vw' }}>
      <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
        <MenuItem
          onClick={handleMarkAsRead}
          size="300"
          after={<Icon size="100" src={Icons.CheckTwice} />}
          radii="300"
          aria-disabled={!unread}
        >
          <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
            Mark as Read
          </Text>
        </MenuItem>
      </Box>
    </Menu>
  );
});

function AgentHeader() {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const cords = evt.currentTarget.getBoundingClientRect();
    setMenuAnchor((currentState) => {
      if (currentState) return undefined;
      return cords;
    });
  };

  const handleStoreClick = () => {
    navigate(STORE_PATH);
  };

  return (
    <>
      <PageNavHeader>
        <Box alignItems="Center" grow="Yes" gap="300">
          <Box grow="Yes">
            <Text size="H4" truncate>
              Agents
            </Text>
          </Box>
          <Box>
            <IconButton aria-pressed={!!menuAnchor} variant="Background" onClick={handleOpenMenu}>
              <Icon src={Icons.VerticalDots} size="200" />
            </IconButton>
          </Box>
        </Box>
      </PageNavHeader>
      <PopOut
        anchor={menuAnchor}
        position="Bottom"
        align="End"
        offset={6}
        content={
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              returnFocusOnDeactivate: false,
              onDeactivate: () => setMenuAnchor(undefined),
              clickOutsideDeactivates: true,
              isKeyForward: (evt: KeyboardEvent) => evt.key === 'ArrowDown',
              isKeyBackward: (evt: KeyboardEvent) => evt.key === 'ArrowUp',
              escapeDeactivates: stopPropagation,
            }}
          >
            <AgentMenu requestClose={() => setMenuAnchor(undefined)} />
          </FocusTrap>
        }
      />
      <NavCategory
        style={{ display: 'flex', justifyContent: 'center', padding: ` ${toRem(20)} 0` }}
      >
        <Box onClick={handleStoreClick}>
          <img src={storeImg} alt="" style={{ cursor: 'pointer' }} />
        </Box>
      </NavCategory>
    </>
  );
}

function AgentEmpty() {
  return (
    <NavEmptyCenter>
      <NavEmptyLayout
        icon={<Icon size="600" src={Icons.Bulb} />}
        title={
          <Text size="H5" align="Center">
            No Agent Chats
          </Text>
        }
        content={
          <Text size="T300" align="Center">
            You don&apos;t have any conversations with AI Agents yet.
          </Text>
        }
      />
    </NavEmptyCenter>
  );
}

function AgentFooter() {
  const openInviteDialog = useOpenGlobalDialog(GlobalDialogType.InviteFriends);

  const handleOpenInvite = useCallback(() => {
    openInviteDialog({});
  }, [openInviteDialog]);
  const [popAnchor, setPopAnchor] = useState<RectCords>();
  const popContentRef = useRef<HTMLDivElement>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [creditsError, setCreditsError] = useState<string>();
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleTogglePopOut: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const cords = evt.currentTarget.getBoundingClientRect();
    setPopAnchor((currentState) => {
      if (currentState) return undefined;
      return cords;
    });
  };

  const handleOpenRechargeHistory = () => {
    setShowHistory(true);
    setPopAnchor(undefined);
  };

  const fetchCredits = useCallback(async () => {
    try {
      setLoadingCredits(true);
      const res = await botApi.businessCreditsGet();
      setCredits(res.result ?? null);
      setCreditsError(undefined);
    } catch (error) {
      setCredits(null);
      setCreditsError((error as Error).message);
    } finally {
      setLoadingCredits(false);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  useInterval(fetchCredits, 5000);

  const totalLabel = credits?.totalCredits ?? '--';

  return (
    <>
      <Box
        style={{
          position: 'sticky',
          bottom: 0,
          padding: `${config.space.S200}`,
        }}
      >
        <Box gap="200" direction="Column" style={{ width: '100%' }}>
          <Button
            variant="Primary"
            fill="Soft"
            size="300"
            onClick={handleOpenInvite}
            style={{
              flex: 1,
              width: '100%',
              minHeight: toRem(42),
              justifyContent: 'flex-start',
              gap: config.space.S200,
            }}
          >
            <Icon src={Gift} />
            <Text size="B300" truncate>
              Get free credits
            </Text>
          </Button>
          <Button
            variant="Primary"
            fill="Soft"
            size="300"
            onClick={handleTogglePopOut}
            style={{
              flex: 1,
              width: '100%',
              minHeight: toRem(42),
              justifyContent: 'flex-start',
              gap: config.space.S200,
            }}
          >
            <Icon src={Diamond} />
            <Text size="B300" truncate>
              {totalLabel}
            </Text>
          </Button>

          {popAnchor && (
            <PopOut
              anchor={popAnchor}
              position="Top"
              align="Start"
              offset={2}
              content={
                <FocusTrap
                  focusTrapOptions={{
                    initialFocus: false,
                    returnFocusOnDeactivate: false,
                    onDeactivate: () => setPopAnchor(undefined),
                    clickOutsideDeactivates: true,
                    escapeDeactivates: stopPropagation,
                    fallbackFocus: () => popContentRef.current || document.body,
                  }}
                >
                  <Box
                    ref={popContentRef}
                    direction="Column"
                    gap="100"
                    style={{
                      padding: config.space.S300,
                      borderRadius: config.radii.R400,
                      backgroundColor: color.Surface.Container,
                      color: color.Surface.OnContainer,
                      boxShadow: config.shadow.E200,
                      width: popAnchor.width,
                    }}
                    tabIndex={-1}
                  >
                    <Box direction="Column" gap="100">
                      {credits && (
                        <Box gap="300" direction="Column">
                          <Box direction="Column">
                            <Box direction="Row" justifyContent="SpaceBetween" alignItems="Center">
                              <Text size="T300">Daily credits</Text>
                              <Text size="T300">{credits.freeCredits}</Text>
                            </Box>
                            <Text size="T200">Reset at midnight UTC</Text>
                          </Box>

                          <Box direction="Row" justifyContent="SpaceBetween" alignItems="Center">
                            <Text size="T300">Recharge credits</Text>
                            <Text size="T300">{credits.paidCredits}</Text>
                          </Box>
                          <Box direction="Row" justifyContent="SpaceBetween" alignItems="Center">
                            <Text size="T300">Referral credits</Text>
                            <Text size="T300">{credits.inviteCredits}</Text>
                          </Box>
                          <Button
                            variant="Secondary"
                            size="300"
                            fill="Soft"
                            onClick={handleOpenRechargeHistory}
                            style={{ width: '100%' }}
                          >
                            <Text size="B300">Recharge history</Text>
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </FocusTrap>
              }
            />
          )}
        </Box>
      </Box>
      <RechargeHistoryDialog open={showHistory} onClose={() => setShowHistory(false)} />
    </>
  );
}

export function Agent() {
  const mx = useMatrixClient();
  useNavToActivePathMapper('agent');
  const scrollRef = useRef<HTMLDivElement>(null);
  const agents = useAgentRooms();
  const notificationPreferences = useRoomsNotificationPreferencesContext();

  const selectedRoomId = useSelectedRoom();
  const noRoomToDisplay = agents.length === 0;

  const sortedAgents = useMemo(
    () => Array.from(agents).sort(factoryRoomIdByActivity(mx)),
    [mx, agents]
  );

  const virtualizer = useVirtualizer({
    count: sortedAgents.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 38,
    overscan: 10,
  });

  return (
    <PageNav>
      <AgentHeader />
      {noRoomToDisplay ? (
        <AgentEmpty />
      ) : (
        <PageNavContent scrollRef={scrollRef}>
          <Box direction="Column" gap="300">
            <div
              style={{
                position: 'relative',
                height: virtualizer.getTotalSize(),
              }}
            >
              {virtualizer.getVirtualItems().map((vItem) => {
                const roomId = sortedAgents[vItem.index];
                const room = mx.getRoom(roomId);
                if (!room) return null;
                const selected = selectedRoomId === roomId;

                return (
                  <VirtualTile
                    virtualItem={vItem}
                    key={vItem.index}
                    ref={virtualizer.measureElement}
                  >
                    <RoomNavItem
                      room={room}
                      selected={selected}
                      showAvatar
                      direct
                      linkPath={getAgentDirectRoomPath(getCanonicalAliasOrRoomId(mx, roomId))}
                      notificationMode={getRoomNotificationMode(
                        notificationPreferences,
                        room.roomId
                      )}
                    />
                  </VirtualTile>
                );
              })}
            </div>
          </Box>
        </PageNavContent>
      )}
      <AgentFooter />
    </PageNav>
  );
}
