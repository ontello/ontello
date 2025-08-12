import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  Icon,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Spinner,
  Text,
  config,
  toRem,
  color,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { useQueryClient } from '@tanstack/react-query';
import { BotInfo, BotInfoMediasInner, BotInfoMediasInnerMediaEnum } from '../../../externalApis';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import * as roomActions from '../../../../client/action/room';
import { useRoomNavigate } from '../../../hooks/useRoomNavigate';
import { timeDayMonYear } from '../../../utils/time';
import { getDMRoomFor } from '@src/app/utils/matrix';
import { copyToClipboard } from '../../../utils/dom';
import { stopPropagation } from '../../../utils/keyboard';
import OntelloIcon from '@src/app/static/icons/OntelloIcon';
import WebsiteIcon from '@src/app/static/icons/WebsiteIcon';
import XIcon from '@src/app/static/icons/XIcon';
import { KnownMembership } from 'matrix-js-sdk';

interface InfoContainerProps {
  label: string;
  value: string | React.ReactNode;
  copyable?: boolean;
}

const InfoContainer: React.FC<InfoContainerProps> = ({ label, value, copyable }) => (
  <Box
    style={{
      backgroundColor: color.SurfaceVariant.Container,
      padding: config.space.S200,
      borderRadius: config.radii.R400,
    }}
    direction="Column"
    gap="100"
  >
    <Text size="H4">{label}</Text>
    <Box alignItems="Center" gap="200">
      <Text style={{ flex: 1 }}>{value}</Text>
      {copyable && (
        <Chip variant="Secondary" radii="Pill" onClick={() => copyToClipboard(String(value))}>
          <Text size="T200">Copy</Text>
        </Chip>
      )}
    </Box>
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

interface AgentDetailDialogProps {
  agent: BotInfo;
  open: boolean;
  onClose: () => void;
}

export function AgentDetailDialog({ agent, open, onClose }: AgentDetailDialogProps) {
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
        const member = room?.getMember(mx.getUserId()!);
        if (member && member.membership !== KnownMembership.Leave) {
          navigateRoom(room.roomId);
          return;
        }
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
              <Box style={{ padding: `${toRem(20)}` }} direction="Column" gap="400">
                <Box direction="Row" gap="200" alignItems="Center">
                  <img
                    src={agent.icon}
                    alt={agent.bot_name}
                    style={{
                      width: `${toRem(80)}`,
                      height: `${toRem(80)}`,
                      objectFit: 'cover',
                      borderRadius: '6px',
                    }}
                  />
                  <Box grow="Yes" direction="Column" gap="100" justifyContent="End" alignSelf="End">
                    <Text size="T500">{agent.bot_name}</Text>
                    <Text size="B300">{agent.mx_id}</Text>
                  </Box>
                </Box>

                <Box alignItems="Center" gap="200">
                  <Text>By {agent.owner}</Text>
                  <Box alignItems="Center" gap="200">
                    {agent.medias.map((media) => (
                      <MediaIcon key={media.media} media={media} />
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
                    <Text size="L400">Users</Text>
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
                    <Text size="L400">Conversations</Text>
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
                  <InfoContainer label="Agent DID：" value={agent.bot_did} copyable />
                  <InfoContainer label="Capabilities： " value={agent.capabilities} />
                  <InfoContainer label="Configuration items： " value={agent.llm} />
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
