import { useMatrixClient } from '@src/app/hooks/useMatrixClient';
import { useNavigate } from 'react-router-dom';
import React, { useCallback, useEffect, useState } from 'react';
import { Box, Text, Spinner } from 'folds';
import { Membership } from '@src/types/matrix/room';
import { getMxIdServer } from '@src/app/utils/matrix';
import { getWalletDirectPath } from '../../pathUtils';
import * as roomActions from '../../../../client/action/room';

const walletAgentName = 'smartwallet.agent';

export function CheckAgent() {
  const mx = useMatrixClient();
  const navigate = useNavigate();
  const [addError, setAddError] = useState<string | null>(null);
  const [addingToChat, setAddingToChat] = useState(false);
  const userId = mx.getUserId()!;
  const server = getMxIdServer(userId);
  const walletAgentId = `@${walletAgentName}:${server}`;

  const checkAgent = useCallback(async () => {
    setAddingToChat(true);
    setAddError(null);
    try {
      const rooms = mx
        .getRooms()
        .filter(
          (room) =>
            room.hasEncryptionStateEvent() &&
            room.getMyMembership() === Membership.Join &&
            room.getMembers().length <= 2
        )
        .filter((room) => room.roomId !== mx.getUserId()!)
        .filter((room) => room.getMember(walletAgentId));

      const validateRoom = rooms[0];

      if (validateRoom) {
        navigate(getWalletDirectPath(validateRoom.roomId));
        return;
      }
      const result = await roomActions.createDM(mx, walletAgentId);
      navigate(getWalletDirectPath(result.room_id));
    } catch (error: any) {
      setAddError(error.message || 'Failed to add agent to chats');
    } finally {
      setAddingToChat(false);
    }
  }, [mx, navigate, walletAgentId]);

  useEffect(() => {
    checkAgent();
  }, [checkAgent]);

  return (
    <Box
      direction="Column"
      gap="100"
      alignItems="Center"
      justifyContent="Center"
      style={{ width: '100%', height: '100%' }}
    >
      {addingToChat && <Spinner />}
      {addError && <Text>{addError}</Text>}
    </Box>
  );
}
