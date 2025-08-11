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
  color,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import OntelloIcon from '@src/app/static/icons/OntelloIcon';
import WebsiteIcon from '@src/app/static/icons/WebsiteIcon';
import XIcon from '@src/app/static/icons/XIcon';
import { Page, PageContent, PageContentCenter, PageHeader } from '../../../components/page';
import { RoomCardBase, RoomCardGrid } from '../../../components/room-card';
import { useScreenSizeContext } from '../../../hooks/useScreenSize';
import { stopPropagation } from '../../../utils/keyboard';
import {
  BotInfo,
  BotInfoMediasInner,
  BotInfoMediasInnerMediaEnum,
  api,
} from '../../../externalApis';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import * as roomActions from '../../../../client/action/room';
import { useRoomNavigate } from '../../../hooks/useRoomNavigate';
import { timeDayMonYear } from '../../../utils/time';
import { getDMRoomFor } from '@src/app/utils/matrix';

const AgentCardName = as<'h6'>(({ ...props }, ref) => (
  <Text as="h6" size="H6" truncate {...props} ref={ref} />
));

const AgentCardDescription = as<'p'>(({ ...props }, ref) => (
  <Text as="p" size="T200" priority="400" {...props} ref={ref} />
));

interface InfoContainerProps {
  label: string;
  value: string | React.ReactNode;
}

const InfoContainer: React.FC<InfoContainerProps> = ({ label, value }) => (
  <Box
    style={{
      backgroundColor: color.SurfaceVariant.Container,
      padding: config.space.S100,
      borderRadius: config.radii.R400,
    }}
    direction="Column"
  >
    <Text>{label}</Text>
    <Text>{value}</Text>
  </Box>
);

function MediaIcon({ media }: { media: BotInfoMediasInner }) {
  const handleClick = () => {
    if (media.link) {
      window.open(media.link, '_blank', 'noopener,noreferrer');
    }
  };

  const getIconSrc = () => {
    switch (media.media) {
      case BotInfoMediasInnerMediaEnum.X:
        return XIcon;
      case BotInfoMediasInnerMediaEnum.OfficialWebsite:
        return WebsiteIcon;
      default:
        return OntelloIcon;
    }
  };

  return <Icon src={getIconSrc()} size="50" style={{ cursor: 'pointer' }} onClick={handleClick} />;
}

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
      const room = getDMRoomFor(mx, agent.mx_id);
      if (room) {
        navigateRoom(room.roomId);
        return;
      }
      const result = await roomActions.createDM(mx, agent.mx_id);

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
              <Box style={{ padding: `0 ${toRem(20)} ${toRem(20)}` }} direction="Column" gap="400">
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

                <Box alignItems="Center" gap="200">
                  <Text>By {agent.owner}</Text>
                  <Box alignItems="Center" gap="200">
                    {agent.medias.map((media) => (
                      <Box
                        key={media.link}
                        style={{
                          borderRadius: '50%',
                          backgroundColor: color.Background.Container,
                          height: toRem(28),
                          width: toRem(28),
                          alignItems: 'Center',
                          justifyContent: 'Center',
                        }}
                      >
                        <MediaIcon key={media.media} media={media} />
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box alignItems="Center" justifyContent="Center" gap="400">
                  <Box
                    direction="Column"
                    alignItems="Center"
                    gap="100"
                    style={{
                      height: toRem(60),
                      width: toRem(95),
                      borderRadius: toRem(5),
                      border: `1px solid ${color.Primary.Container}`,
                      padding: `${toRem(5)} ${toRem(10)}`,
                    }}
                  >
                    <Text size="H4">{agent.users}</Text>
                    <Text size="L400">User</Text>
                  </Box>
                  <Box
                    direction="Column"
                    alignItems="Center"
                    gap="100"
                    style={{
                      height: toRem(60),
                      width: toRem(95),
                      borderRadius: toRem(5),
                      border: `1px solid ${color.Primary.Container}`,
                      padding: `${toRem(5)} ${toRem(10)}`,
                    }}
                  >
                    <Text size="H4">{agent.conversations}</Text>
                    <Text size="L400">conversations</Text>
                  </Box>
                </Box>

                <Box gap="200">
                  <Text size="T300">{agent.description}</Text>
                </Box>
                <Box gap="200" direction="Column">
                  <InfoContainer 
                    label="Registration Date: " 
                    value={timeDayMonYear(agent.create_time)} 
                  />
                  <InfoContainer 
                    label="Agent DID：" 
                    value={agent.bot_did} 
                  />
                  <InfoContainer 
                    label="Capabilities： " 
                    value={agent.capabilities} 
                  />
                  <InfoContainer 
                    label="Configuration items： " 
                    value={agent.llm} 
                  />
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
  // const llmInfo = agent.llm ? agent.llm.split(',').map((item) => item.trim()) : [];

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
              {agent.information.map((info) => (
                <Badge key={`${agent.bot_id}-${info}`}>
                  <Text size="B300">{info}</Text>
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
