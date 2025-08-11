import React, { useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Icon,
  Icons,
  Scroll,
  Spinner,
  Text,
  as,
  toRem,
} from 'folds';
import { useQuery } from '@tanstack/react-query';
import { Page, PageContent, PageContentCenter, PageHeader } from '../../../components/page';
import { RoomCardBase, RoomCardGrid } from '../../../components/room-card';
import { BotInfo, api } from '../../../externalApis';
import { AgentDetailDialog } from './AgentDetailDialog';

const AgentCardName = as<'h6'>(({ ...props }, ref) => (
  <Text as="h6" size="H6" truncate {...props} ref={ref} />
));

const AgentCardDescription = as<'p'>(({ ...props }, ref) => (
  <Text as="p" size="T200" priority="400" {...props} ref={ref} />
));

function AgentCard({ agent }: { agent: BotInfo }) {
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = () => setDetailOpen(true);
  const closeDetail = () => setDetailOpen(false);

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
          <Text size="T200">{agent.users?.toLocaleString() ?? 0} Users</Text>
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

const StoreHeader = () => (
  <PageHeader>
    <Box grow="Yes" justifyContent="Center" alignItems="Center" gap="200">
      <Text size="H3" truncate>
        Agent Store
      </Text>
    </Box>
  </PageHeader>
);

export function AgentStore() {
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
        <StoreHeader />
        <Box grow="Yes" alignItems="Center" justifyContent="Center">
          <Spinner size="600" />
        </Box>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <StoreHeader />
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
      <StoreHeader />
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
