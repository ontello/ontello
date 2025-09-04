import { useMatrixClient } from '@src/app/hooks/useMatrixClient';
import { getDMRoomFor } from '@src/app/utils/matrix';
import { KnownMembership } from 'matrix-js-sdk';
import { useNavigate } from 'react-router-dom';
import React, { useCallback, useEffect, useState } from 'react';
import { Box, Text, Spinner } from 'folds';
import { WALLET_PATH } from '../../paths';
import * as roomActions from '../../../../client/action/room';

const walletAgentId = '@smartwallet.agent:ont.network';

export function CheckAgent() {
  const mx = useMatrixClient();
  const navigate = useNavigate();
  const [addError, setAddError] = useState<string | null>(null);
  const [addingToChat, setAddingToChat] = useState(false);

  const checkAgent = useCallback(async () => {
    setAddingToChat(true);
    setAddError(null);
    try {
      const rooms = mx
        .getRooms()
        .filter((room) => room.hasEncryptionStateEvent() && room.getMembers().length <= 2)
        .filter((room) => room.getMember(walletAgentId));

      const validateRoom = rooms.find((room) => {
        const member = room?.getMember(mx.getUserId()!);
        if (member && member.membership !== KnownMembership.Leave) {
          return true;
        }
        return false;
      });

      if (validateRoom) {
        navigate(`${WALLET_PATH}/direct/${validateRoom.roomId}`);
        return;
      }
      const result = await roomActions.createDM(mx, walletAgentId);
      navigate(`${WALLET_PATH}/direct/${result.room_id}`);
    } catch (error: any) {
      setAddError(error.message || 'Failed to add agent to chats');
    } finally {
      setAddingToChat(false);
    }
  }, [mx, navigate]);

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
