import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { api } from '../../../externalApis';
import { useInterval } from '../../../hooks/useInterval';

const isAgentRoom = (roomId: string, agentRoomIds: Set<string>) => agentRoomIds.has(roomId);

export const useAgentRooms = () => {
  const mx = useMatrixClient();
  const [agentRoomIds, setAgentRoomIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAgentRooms = useCallback(async (isInitialFetch = false) => {
    try {
      if (isInitialFetch) {
        setLoading(true);
      }
      const response = await api.userRoomsGet();

      if (response.result) {
        setAgentRoomIds(new Set(response.result));
      }
    } catch (error) {
      console.error('Failed to fetch agent rooms:', error);
    } finally {
      if (isInitialFetch) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchAgentRooms(true);
  }, [fetchAgentRooms]);

  useInterval(fetchAgentRooms, 3000);

  const agentRooms = useMemo(() => {
    if (loading) return [];

    const allRooms = mx.getRooms();
    const agentRoomList: string[] = [];

    allRooms.forEach((room) => {
      const { roomId } = room;

      if (isAgentRoom(roomId, agentRoomIds)) {
        agentRoomList.push(roomId);
      }
    });

    return agentRoomList;
  }, [mx, agentRoomIds, loading]);

  return agentRooms;
};
