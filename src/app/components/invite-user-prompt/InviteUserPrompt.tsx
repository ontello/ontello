import React, {
  ChangeEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Box,
  Header,
  config,
  Text,
  IconButton,
  Icon,
  Icons,
  Input,
  Button,
  Spinner,
  color,
  TextArea,
  Dialog,
  Menu,
  toRem,
  Scroll,
  MenuItem,
} from 'folds';
import { Room } from 'matrix-js-sdk';
import { isKeyHotkey } from 'is-hotkey';
import FocusTrap from 'focus-trap-react';
import { stopPropagation } from '../../utils/keyboard';
import { useDirectUsers } from '../../hooks/useDirectUsers';
import { getMxIdLocalPart, getMxIdServer, isUserId } from '../../utils/matrix';
import { Membership } from '../../../types/matrix/room';
import { useAsyncSearch, UseAsyncSearchOptions } from '../../hooks/useAsyncSearch';
import { highlightText, makeHighlightRegex } from '../../plugins/react-custom-html-parser';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { BreakWord } from '../../styles/Text.css';
import { useAlive } from '../../hooks/useAlive';
import { isValidOntid, ontidToMxid } from '../../utils/ontid';
import { useInviteAgent } from './useInviteAgent';
import { BotInfo } from '../../externalApis';

const SEARCH_OPTIONS: UseAsyncSearchOptions = {
  limit: 1000,
  matchOptions: {
    contain: true,
  },
};
const getUserIdString = (userId: string) => getMxIdLocalPart(userId) ?? userId;

type InviteUserProps = {
  room: Room;
  requestClose: () => void;
};
export function InviteUserPrompt({ room, requestClose }: InviteUserProps) {
  const mx = useMatrixClient();
  const alive = useAlive();

  const inputRef = useRef<HTMLInputElement>(null);
  const directUsers = useDirectUsers();
  const [validUserId, setValidUserId] = useState<string>();
  const { isSearchAgent, setIsSearchAgent, searchAgent } = useInviteAgent();
  const [agentResults, setAgentResults] = useState<BotInfo[]>([]);
  const [agentSearching, setAgentSearching] = useState(false);
  const [agentError, setAgentError] = useState<string>();

  const filteredUsers = useMemo(
    () =>
      directUsers.filter((userId) => {
        const membership = room.getMember(userId)?.membership;
        return membership !== Membership.Join;
      }),
    [directUsers, room]
  );
  const [result, search, resetSearch] = useAsyncSearch(
    filteredUsers,
    getUserIdString,
    SEARCH_OPTIONS
  );
  const queryHighlighRegex = result?.query
    ? makeHighlightRegex(result.query.split(' '))
    : undefined;

  const [inviteState, invite] = useAsyncCallback<void, Error, [string, string | undefined]>(
    useCallback(
      async (userId, reason) => {
        await mx.invite(room.roomId, userId, reason);
      },
      [mx, room]
    )
  );

  const inviting = inviteState.status === AsyncStatus.Loading;

  const performAgentSearch = useCallback(
    async (keyword: string) => {
      setAgentSearching(true);
      setAgentError(undefined);
      try {
        const bots = await searchAgent(keyword);
        if (alive()) {
          setAgentResults(bots);
        }
      } catch (error) {
        if (alive()) {
          setAgentResults([]);
          setAgentError(error instanceof Error ? error.message : 'Something went wrong!');
        }
      } finally {
        if (alive()) {
          setAgentSearching(false);
        }
      }
    },
    [alive, searchAgent]
  );

  const handleReset = () => {
    if (inputRef.current) inputRef.current.value = '';
    setValidUserId(undefined);
    resetSearch();
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    const target = evt.target as HTMLFormElement | undefined;

    if (inviting || !validUserId) return;

    const reasonInput = target?.reasonInput as HTMLTextAreaElement | undefined;
    const reason = reasonInput?.value.trim();

    invite(validUserId, reason || undefined).then(() => {
      if (alive()) {
        handleReset();
        if (reasonInput) reasonInput.value = '';
      }
    });
  };

  const handleSearchChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    const rawValue = evt.currentTarget.value.trim();
    if (isSearchAgent) {
      const normalizedValue = isValidOntid(rawValue) ? ontidToMxid(rawValue, mx) : rawValue;
      if (normalizedValue && isUserId(normalizedValue)) {
        setValidUserId(normalizedValue);
      } else {
        setValidUserId(undefined);
      }
      performAgentSearch(rawValue);
      return;
    }
    const value = isValidOntid(rawValue) ? ontidToMxid(rawValue, mx) : rawValue;
    if (!value) {
      setValidUserId(undefined);
      resetSearch();
      return;
    }
    if (isUserId(value)) {
      setValidUserId(value);
    } else {
      setValidUserId(undefined);
      const term = getMxIdLocalPart(value) ?? (value.startsWith('@') ? value.slice(1) : value);
      if (term) {
        search(term);
      } else {
        resetSearch();
      }
    }
  };

  const handleUserId = (userId: string) => {
    if (inputRef.current) {
      inputRef.current.value = userId;
      setValidUserId(userId);
      resetSearch();
      inputRef.current.focus();
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (evt) => {
    if (isKeyHotkey('escape', evt)) {
      resetSearch();
      return;
    }
    if (!isSearchAgent && isKeyHotkey('tab', evt) && result && result.items.length > 0) {
      evt.preventDefault();
      const userId = result.items[0];
      handleUserId(userId);
    }
  };

  useEffect(() => {
    if (isSearchAgent) {
      performAgentSearch('');
    } else {
      setAgentResults([]);
      setAgentError(undefined);
      setAgentSearching(false);
    }
  }, [isSearchAgent, performAgentSearch]);

  const toggleSearchMode = useCallback(
    (value: boolean) => {
      if (value === isSearchAgent) return;
      setValidUserId(undefined);
      if (inputRef.current) inputRef.current.value = '';
      resetSearch();
      setAgentResults([]);
      setAgentError(undefined);
      setAgentSearching(false);
      setIsSearchAgent(value);
    },
    [isSearchAgent, resetSearch, setIsSearchAgent]
  );

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: () => inputRef.current,
            clickOutsideDeactivates: true,
            onDeactivate: requestClose,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog>
            <Box grow="Yes" direction="Column">
              <Header
                size="500"
                style={{ padding: `0 ${config.space.S200} 0 ${config.space.S400}` }}
              >
                <Box grow="Yes">
                  <Text size="H4" truncate>
                    Invite
                  </Text>
                </Box>
                <Box shrink="No">
                  <IconButton size="300" radii="300" onClick={requestClose}>
                    <Icon src={Icons.Cross} />
                  </IconButton>
                </Box>
              </Header>
              <Box
                as="form"
                onSubmit={handleSubmit}
                shrink="No"
                style={{ padding: config.space.S400 }}
                direction="Column"
                gap="400"
              >
                <Box direction="Column" gap="100">
                  <Box justifyContent="SpaceBetween" alignItems="Center" gap="200">
                    <Text size="L400">Search</Text>
                    <Box direction="Row" gap="100">
                      <Button
                        type="button"
                        size="300"
                        variant="Secondary"
                        fill={isSearchAgent ? 'None' : 'Soft'}
                        radii="300"
                        onClick={() => toggleSearchMode(false)}
                      >
                        <Text size="B300">ONT/Matrix ID</Text>
                      </Button>
                      <Button
                        type="button"
                        size="300"
                        variant="Secondary"
                        fill={isSearchAgent ? 'Soft' : 'None'}
                        radii="300"
                        onClick={() => toggleSearchMode(true)}
                      >
                        <Text size="B300">Agents</Text>
                      </Button>
                    </Box>
                  </Box>
                  <div>
                    <Input
                      size="500"
                      ref={inputRef}
                      onChange={handleSearchChange}
                      onKeyDown={handleKeyDown}
                      placeholder={isSearchAgent ? 'Search agents' : '@username:server'}
                      name="userIdInput"
                      variant="Background"
                      disabled={inviting}
                      autoComplete="off"
                      required
                    />
                    {!isSearchAgent && result && result.items.length > 0 && (
                      <FocusTrap
                        focusTrapOptions={{
                          initialFocus: false,
                          onDeactivate: resetSearch,
                          returnFocusOnDeactivate: false,
                          clickOutsideDeactivates: true,
                          allowOutsideClick: true,
                          isKeyForward: (evt: KeyboardEvent) => isKeyHotkey('arrowdown', evt),
                          isKeyBackward: (evt: KeyboardEvent) => isKeyHotkey('arrowup', evt),
                          escapeDeactivates: stopPropagation,
                        }}
                      >
                        <Box style={{ position: 'relative' }}>
                          <Menu style={{ position: 'absolute', top: 0, zIndex: 1, width: '100%' }}>
                            <Scroll size="300" style={{ maxHeight: toRem(100) }}>
                              <div style={{ padding: config.space.S100 }}>
                                {result.items.map((userId) => {
                                  const username = `${getMxIdLocalPart(userId)}`;
                                  const userServer = getMxIdServer(userId);

                                  return (
                                    <MenuItem
                                      key={userId}
                                      type="button"
                                      size="300"
                                      variant="Surface"
                                      radii="300"
                                      onClick={() => handleUserId(userId)}
                                      after={
                                        <Text size="T200" truncate>
                                          {userServer}
                                        </Text>
                                      }
                                      disabled={inviting}
                                    >
                                      <Box grow="Yes">
                                        <Text size="T300" truncate>
                                          <b>
                                            {queryHighlighRegex
                                              ? highlightText(queryHighlighRegex, [
                                                  username ?? userId,
                                                ])
                                              : username}
                                          </b>
                                        </Text>
                                      </Box>
                                    </MenuItem>
                                  );
                                })}
                              </div>
                            </Scroll>
                          </Menu>
                        </Box>
                      </FocusTrap>
                    )}
                    {isSearchAgent && (
                      <Box direction="Column" gap="100" style={{ marginTop: config.space.S100 }}>
                        {agentSearching && (
                          <Box alignItems="Center" gap="100">
                            <Spinner size="200" variant="Primary" fill="Solid" />
                            <Text size="T200">Searching agents…</Text>
                          </Box>
                        )}
                        {!agentSearching && agentResults.length > 0 && (
                          <FocusTrap
                            focusTrapOptions={{
                              initialFocus: false,
                              onDeactivate: () => undefined,
                              returnFocusOnDeactivate: false,
                              clickOutsideDeactivates: true,
                              allowOutsideClick: true,
                              isKeyForward: (evt: KeyboardEvent) => isKeyHotkey('arrowdown', evt),
                              isKeyBackward: (evt: KeyboardEvent) => isKeyHotkey('arrowup', evt),
                              escapeDeactivates: stopPropagation,
                            }}
                          >
                            <Box style={{ position: 'relative' }}>
                              <Menu
                                style={{ position: 'absolute', top: 0, zIndex: 1, width: '100%' }}
                              >
                                <Scroll size="300" style={{ maxHeight: toRem(150) }}>
                                  <div style={{ padding: config.space.S100 }}>
                                    {agentResults.map((agent) => (
                                      <MenuItem
                                        key={agent.mx_id}
                                        type="button"
                                        size="300"
                                        variant="Surface"
                                        radii="300"
                                        onClick={() => handleUserId(agent.mx_id)}
                                        disabled={inviting}
                                        after={
                                          <Box gap="100" alignItems="Center">
                                            <Icon size="100" src={Icons.User} />
                                            <Text size="T200">
                                              {(agent.users ?? 0).toLocaleString()}
                                            </Text>
                                          </Box>
                                        }
                                      >
                                        <Box direction="Column" gap="100" grow="Yes">
                                          <Text size="T300" truncate>
                                            <b>{agent.bot_name ?? agent.mx_id}</b>
                                          </Text>
                                          {/* {agent.description && (
                                            <Text size="T200" truncate>
                                              {agent.description}
                                            </Text>
                                          )} */}
                                        </Box>
                                      </MenuItem>
                                    ))}
                                  </div>
                                </Scroll>
                              </Menu>
                            </Box>
                          </FocusTrap>
                        )}
                        {agentError && (
                          <Text size="T200" style={{ color: color.Critical.Main }}>
                            <b>{agentError}</b>
                          </Text>
                        )}
                      </Box>
                    )}
                  </div>
                </Box>
                <Box direction="Column" gap="100">
                  <Text size="L400">Reason (Optional)</Text>
                  <TextArea
                    size="500"
                    name="reasonInput"
                    variant="Background"
                    rows={4}
                    resize="None"
                  />
                </Box>
                {inviteState.status === AsyncStatus.Error && (
                  <Text size="T200" style={{ color: color.Critical.Main }} className={BreakWord}>
                    <b>{inviteState.error.message}</b>
                  </Text>
                )}
                <Button
                  type="submit"
                  disabled={!validUserId || inviting}
                  before={inviting && <Spinner size="200" variant="Primary" fill="Solid" />}
                >
                  <Text size="B400">Invite</Text>
                </Button>
              </Box>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
