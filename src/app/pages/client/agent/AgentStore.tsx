import React, { useState } from 'react';
import {
  Avatar,
  Badge,
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
  Spinner,
  Text,
  as,
  config,
  toRem,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Page, PageContent, PageContentCenter, PageHeader } from '../../../components/page';
import { RoomCardBase, RoomCardGrid } from '../../../components/room-card';
import { useScreenSizeContext } from '../../../hooks/useScreenSize';
import { stopPropagation } from '../../../utils/keyboard';
import { BotInfo, api } from '../../../externalApis';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import * as roomActions from '../../../../client/action/room';
import { useRoomNavigate } from '../../../hooks/useRoomNavigate';
import { timeDayMonYear } from '../../../utils/time';

const AgentCardName = as<'h6'>(({ ...props }, ref) => (
  <Text as="h6" size="H6" truncate {...props} ref={ref} />
));

const AgentCardDescription = as<'p'>(({ ...props }, ref) => (
  <Text as="p" size="T200" priority="400" {...props} ref={ref} />
));

// Agent detail dialog component
function AgentDetailDialog({
  agent,
  open,
  onClose,
}: {
  agent: BotInfo;
  open: boolean;
  onClose: () => void;
}) {
  const mx = useMatrixClient();
  const { navigateRoom } = useRoomNavigate();
  const queryClient = useQueryClient();

  const [addingToChat, setAddingToChat] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddToChats = async () => {
    setAddingToChat(true);
    setAddError(null);

    try {
      const result = await roomActions.createDM(mx, agent.mx_id, false);

      queryClient.invalidateQueries({ queryKey: ['bots'] });

      navigateRoom(result.room_id);

      onClose();
    } catch (error: any) {
      setAddError(error.message || 'Failed to add agent to chats');
    } finally {
      setAddingToChat(false);
    }
  };

  if (!open) return null;

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            clickOutsideDeactivates: true,
            onDeactivate: onClose,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog variant="Surface" style={{ width: '100%', maxWidth: toRem(520) }}>
            <Box direction="Column" gap="300">
              <Header
                style={{
                  padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                  borderBottomWidth: config.borderWidth.B300,
                }}
                variant="Surface"
                size="500"
              >
                <Box grow="Yes">
                  <Text size="H4" truncate>
                    {agent.bot_name}
                  </Text>
                </Box>
                <Box direction="Row" gap="100">
                  <IconButton size="300" onClick={onClose}>
                    <Icon src={Icons.Cross} />
                  </IconButton>
                </Box>
              </Header>
              <Box style={{ padding: `0 ${toRem(20)} ${toRem(20)}` }} direction="Column" gap="300">
                <Box direction="Row" gap="200" alignItems="Center">
                  <img
                    src={agent.icon}
                    alt={agent.bot_name}
                    style={{ width: `${toRem(80)}`, height: `${toRem(80)}`, objectFit: 'cover' }}
                  />
                  <Box grow="Yes" direction="Column" gap="100" justifyContent="End">
                    <Text size="T500">{agent.bot_name}</Text>
                    <Text size="B300">{agent.bot_did}</Text>
                  </Box>
                </Box>

                <Box>
                  <Text>By {agent.owner}</Text>
                  <Box>
                    {agent.medias.map((media) => (
                      <Badge aria-label="A status badge" role="status">
                        {/* <img src={} alt="" /> */}
                      </Badge>
                    ))}
                  </Box>
                </Box>
                <Box gap="200">
                  <Text size="T300">{agent.description}</Text>
                </Box>
                <Box gap="200" direction="Column">
                  <Box
                    style={{
                      background: '#F5F5F5',
                      padding: config.space.S100,
                      borderRadius: config.radii.R400,
                    }}
                    direction="Column"
                  >
                    <Text size="T200">Registration Date: </Text>
                    <Text>{timeDayMonYear(agent.create_time)}</Text>
                  </Box>
                  <Box
                    style={{
                      background: '#F5F5F5',
                      padding: config.space.S100,
                      borderRadius: config.radii.R400,
                    }}
                    direction="Column"
                  >
                    <Text size="T200">Agent DID：</Text>
                    <Text size="T200">{agent.bot_did}</Text>
                  </Box>
                  <Box
                    style={{
                      background: '#F5F5F5',
                      padding: config.space.S100,
                      borderRadius: config.radii.R400,
                    }}
                    direction="Column"
                  >
                    <Text size="T200">Capabilities： </Text>
                    <Text>{agent.capabilities}</Text>
                  </Box>
                </Box>

                {addError && (
                  <Box direction="Column" gap="100">
                    <Text style={{ color: 'red' }} size="T200">
                      {addError}
                    </Text>
                  </Box>
                )}

                <Box gap="200">
                  <Button
                    variant="Primary"
                    fill="Solid"
                    size="300"
                    style={{ flex: 1 }}
                    onClick={handleAddToChats}
                    disabled={addingToChat}
                    before={addingToChat ? <Spinner size="200" variant="Secondary" /> : undefined}
                  >
                    <Text size="B400" truncate>
                      Start Chat
                    </Text>
                  </Button>
                </Box>
              </Box>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}

function AgentCard({ agent }: { agent: BotInfo }) {
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = () => setDetailOpen(true);
  const closeDetail = () => setDetailOpen(false);

  // Parse LLM info if exists
  const llmInfo = agent.llm ? agent.llm.split(',').map((item) => item.trim()) : [];

  return (
    <>
      <RoomCardBase>
        <Box gap="200" justifyContent="SpaceBetween">
          <Box direction="Row" gap="200" alignItems="End">
            <Avatar size="500">
              {agent.icon ? (
                <img
                  src={agent.icon}
                  alt={agent.bot_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Icon size="400" src={Icons.Bulb} />
              )}
            </Avatar>
            <Box direction="Row" gap="100">
              {llmInfo.slice(0, 2).map((llm) => (
                <Badge key={`llm-${agent.bot_id}-${llm}`}>
                  <Text size="B300">{llm}</Text>
                </Badge>
              ))}
            </Box>
          </Box>
        </Box>
        <Box grow="Yes" direction="Column" gap="100">
          <AgentCardName>{agent.bot_name}</AgentCardName>
          <AgentCardDescription>{agent.description}</AgentCardDescription>
        </Box>
        <Box gap="100">
          <Icon size="50" src={Icons.User} />
          <Text size="T200">{agent.users?.toLocaleString() ?? 0} Members</Text>
        </Box>
        <Button variant="Secondary" size="300" onClick={openDetail}>
          <Text size="B300" truncate>
            View
          </Text>
        </Button>
      </RoomCardBase>

      <AgentDetailDialog agent={agent} open={detailOpen} onClose={closeDetail} />
    </>
  );
}

export function AgentStore() {
  const screenSize = useScreenSizeContext();

  // Fetch bots data
  const { data, isLoading, error } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const response = await api.botsGet({ page_no: 1, page_size: 100 });
      return response.result.bots;
    },
  });

  if (isLoading) {
    return (
      <Page>
        <PageHeader>
          <Box grow="Yes" basis="No" />
          <Box grow="Yes" justifyContent="Center" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Agent Store
            </Text>
          </Box>
          <Box grow="Yes" basis="No" />
        </PageHeader>
        <Box grow="Yes" alignItems="Center" justifyContent="Center">
          <Spinner size="600" />
        </Box>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageHeader>
          <Box grow="Yes" basis="No" />
          <Box grow="Yes" justifyContent="Center" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Agent Store
            </Text>
          </Box>
          <Box grow="Yes" basis="No" />
        </PageHeader>
        <Box grow="Yes" alignItems="Center" justifyContent="Center" direction="Column" gap="200">
          <Icon size="600" src={Icons.Warning} />
          <Text size="T300">Failed to load agents</Text>
          <Button
            variant="Primary"
            fill="Solid"
            size="300"
            onClick={() => window.location.reload()}
          >
            <Text size="B300">Retry</Text>
          </Button>
        </Box>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader>
        <Box grow="Yes" justifyContent="Center" alignItems="Center" gap="200">
          <Text size="H3" truncate>
            Agent Store
          </Text>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <PageContentCenter>
              <Box direction="Column" gap="600">
                <Box direction="Column" gap="400">
                  <Text size="H4">Popular agents</Text>
                  {data && data.length > 0 ? (
                    <RoomCardGrid>
                      {data.map((agent) => (
                        <AgentCard key={agent.bot_id} agent={agent} />
                      ))}
                    </RoomCardGrid>
                  ) : (
                    <Box
                      direction="Column"
                      alignItems="Center"
                      justifyContent="Center"
                      gap="200"
                      style={{ padding: toRem(40) }}
                    >
                      <Icon size="600" src={Icons.Bulb} />
                      <Text size="T300">No agents available</Text>
                    </Box>
                  )}
                </Box>
              </Box>
            </PageContentCenter>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
