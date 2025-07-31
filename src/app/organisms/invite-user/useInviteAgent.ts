import { useState, useCallback } from 'react';
import { api, BotInfo } from '../../externalApis';

export const useInviteAgent = () => {
  const [isSearchAgent, setIsSearchAgent] = useState(false);

  const searchAgent: (keyword: string) => Promise<BotInfo[]> = useCallback(
    async (keyword: string) => {
      const response = await api.botsGet({
        page_no: 1,
        page_size: 20,
        keyword,
      });
      console.log(response);
      if (response.error.code == '0' && response.result.bots) {
        return response.result.bots;
      } else if (response.error.code || response.error.message) {
        throw new Error(response.error.code + ': ' + response.error.message);
      } else {
        throw new Error('Something went wrong!');
      }
    },
    []
  );

  return {
    isSearchAgent,
    setIsSearchAgent,
    searchAgent,
  };
};
