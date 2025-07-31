import { useEffect, useMemo, useState } from 'react';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { api } from '../../../externalApis';

const isAgentRoom = (roomId: string, agentRoomIds: Set<string>) => agentRoomIds.has(roomId);

export const useAgentRooms = () => {
  const mx = useMatrixClient();
  const [agentRoomIds, setAgentRoomIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const fetchAgentRooms = async () => {
    try {
      setLoading(true);
      const response = await api.userRoomsGet();

      if (response.result) {
        setAgentRoomIds(new Set(response.result));
      }
    } catch (error) {
      console.error('Failed to fetch agent rooms:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAgentRooms();
  }, []);

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
