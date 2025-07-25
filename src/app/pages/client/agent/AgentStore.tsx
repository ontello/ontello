import React, { useMemo, useState } from 'react';
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
  Text,
  as,
  toRem,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { Page, PageContent, PageContentCenter, PageHeader } from '../../../components/page';
import { RoomCardBase, RoomCardGrid } from '../../../components/room-card';
import { useScreenSizeContext, ScreenSize } from '../../../hooks/useScreenSize';
import { stopPropagation } from '../../../utils/keyboard';

// Mock data for agent cards - replace with actual data fetching logic
const mockAgents = [
  {
    id: 'agent1',
    name: 'Customer Support Agent',
    description: 'Helps with product inquiries and troubleshooting',
    avatarUrl: undefined,
    userCount: 12400,
    tags: ['Support', 'Troubleshooting', '24/7'],
  },
  {
    id: 'agent2',
    name: 'Tech Assistant',
    description: 'Provides technical guidance and code examples',
    avatarUrl: undefined,
    userCount: 8900,
    tags: ['Programming', 'Debugging', 'Documentation'],
  },
  {
    id: 'agent3',
    name: 'Language Tutor',
    description: 'Helps practice languages with conversation',
    avatarUrl: undefined,
    userCount: 5600,
    tags: ['Languages', 'Conversation', 'Education'],
  },
  {
    id: 'agent4',
    name: 'Fitness Coach',
    description: 'Creates workout plans and tracks progress',
    avatarUrl: undefined,
    userCount: 3400,
    tags: ['Workout', 'Nutrition', 'Progress Tracking'],
  },
  {
    id: 'agent5',
    name: 'Cooking Expert',
    description: 'Shares recipes and cooking tips',
    avatarUrl: undefined,
    userCount: 7200,
    tags: ['Recipes', 'Cuisine', 'Techniques'],
  },
  {
    id: 'agent6',
    name: 'Travel Planner',
    description: 'Suggests destinations and creates itineraries',
    avatarUrl: undefined,
    userCount: 4800,
    tags: ['Destinations', 'Itineraries', 'Local Tips'],
  },
];

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
  agent: typeof mockAgents[0];
  open: boolean;
  onClose: () => void;
}) {
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
                  <Icon size="400" src={Icons.Bulb} />
                </Avatar>
                <Box grow="Yes" direction="Column" gap="100">
                  <AgentCardName>{agent.name}</AgentCardName>
                  <Text size="T200" priority="400">
                    {agent.userCount.toLocaleString()} users
                  </Text>
                </Box>
              </Box>

              <Box direction="Column" gap="200">
                <Text size="T300">{agent.description}</Text>

                <Box direction="Column" gap="100">
                  <Text size="L400">Capabilities</Text>
                  <Box gap="100" wrap="Wrap">
                    {agent.tags.map((tag) => (
                      <Badge key={tag} variant="Secondary" fill="Soft" outlined>
                        <Text size="T200">{tag}</Text>
                      </Badge>
                    ))}
                  </Box>
                </Box>
              </Box>

              <Box gap="200">
                <Button
                  variant="Secondary"
                  fill="Soft"
                  size="300"
                  onClick={onClose}
                  style={{ flex: 1 }}
                >
                  <Text size="B300" truncate>
                    Close
                  </Text>
                </Button>
                <Button variant="Primary" fill="Solid" size="300" style={{ flex: 1 }}>
                  <Text size="B300" truncate>
                    Add to Chats
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

function AgentCard({ agent }: { agent: typeof mockAgents[0] }) {
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = () => setDetailOpen(true);
  const closeDetail = () => setDetailOpen(false);

  return (
    <>
      <RoomCardBase>
        <Box gap="200" justifyContent="SpaceBetween">
          <Box direction="Row" gap="200" alignItems="End">
            <Avatar size="500">
              <Icon size="400" src={Icons.Bulb} />
            </Avatar>
            <Box direction="Row" gap="100">
              {agent.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="Secondary" fill="Soft" outlined>
                  <Text size="T200">{tag}</Text>
                </Badge>
              ))}
            </Box>
          </Box>
        </Box>
        <Box grow="Yes" direction="Column" gap="100">
          <AgentCardName>{agent.name}</AgentCardName>
          <AgentCardDescription>{agent.description}</AgentCardDescription>
        </Box>
        <Box gap="100">
          <Icon size="50" src={Icons.User} />
          <Text size="T200">{agent.userCount.toLocaleString()} users</Text>
        </Box>
        <Button variant="Secondary" fill="Soft" size="300" onClick={openDetail}>
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
  const agents = useMemo(() => mockAgents, []);

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
                  <Text size="H4">Available Agents</Text>
                  <RoomCardGrid>
                    {agents.map((agent) => (
                      <AgentCard key={agent.id} agent={agent} />
                    ))}
                  </RoomCardGrid>
                </Box>
              </Box>
            </PageContentCenter>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
