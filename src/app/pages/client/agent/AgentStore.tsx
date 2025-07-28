import React, { useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Dialog,
  Icon,
  Icons,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Scroll,
  Spinner,
  Text,
  as,
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

  // Parse sample prompts if exists
  let samplePrompts: string[] = [];
  try {
    samplePrompts = agent.sample_prompts ? JSON.parse(agent.sample_prompts) : [];
  } catch (e) {
    // If parsing fails, use as plain text
    samplePrompts = agent.sample_prompts ? [agent.sample_prompts] : [];
  }

  const handleAddToChats = async () => {
    setAddingToChat(true);
    setAddError(null);

    try {
      // Create a direct message room with the bot
      const result = await roomActions.createDM(mx, agent.mx_id, false);

      // Invalidate query to refresh the room list
      queryClient.invalidateQueries({ queryKey: ['bots'] });

      // Navigate to the newly created room
      navigateRoom(result.room_id);

      // Close the dialog
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
          <Dialog variant="Surface" style={{ width: '100%', maxWidth: toRem(400) }}>
            <Box style={{ padding: toRem(20) }} direction="Column" gap="300">
              <Box direction="Row" gap="200" alignItems="Center">
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
                <Box grow="Yes" direction="Column" gap="100">
                  <AgentCardName>{agent.bot_name}</AgentCardName>
                  <Text size="T200" priority="400">
                    {agent.users?.toLocaleString() ?? 0} Members
                  </Text>
                </Box>
              </Box>

              <Box direction="Column" gap="200">
                <Text size="T300">{agent.description}</Text>

                {samplePrompts.length > 0 && (
                  <Box direction="Column" gap="100">
                    <Text size="L400">Example Prompts</Text>
                    <Box gap="100" direction="Column">
                      {samplePrompts.map((prompt) => (
                        <Box
                          key={`prompt-${agent.bot_id}-${prompt}`}
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            padding: toRem(10),
                            borderRadius: toRem(4),
                          }}
                        >
                          <Text size="T200">{prompt}</Text>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
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
                  variant="Secondary"
                  fill="Soft"
                  size="300"
                  onClick={onClose}
                  style={{ flex: 1 }}
                  disabled={addingToChat}
                >
                  <Text size="B300" truncate>
                    Close
                  </Text>
                </Button>
                <Button
                  variant="Primary"
                  fill="Solid"
                  size="300"
                  style={{ flex: 1 }}
                  onClick={handleAddToChats}
                  disabled={addingToChat}
                  before={addingToChat ? <Spinner size="200" variant="Secondary" /> : undefined}
                >
                  <Text size="B300" truncate>
                    {addingToChat ? 'Adding...' : 'Start Chat'}
                  </Text>
                </Button>
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
        <Box grow="Yes" basis="No">
          {/* Left side can be empty or have back button if needed */}
        </Box>
        <Box grow="Yes" justifyContent="Center" alignItems="Center" gap="200">
          <Text size="H3" truncate>
            Agent Store
          </Text>
        </Box>
        <Box grow="Yes" basis="No">
          {/* Right side can be empty or have action buttons if needed */}
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
