import { useEffect, useState, useCallback, createContext, useContext, useMemo } from 'react';
import { walletApi } from '@src/app/externalApis';
import { useFetchPasskeyList } from '../../../../hooks/useFetchPasskeyList';
import { Token } from '../../../../externalApis/models';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { mockChains, mockTokens } from '../MockData';
import { TokenWithChain } from '../types';

export interface TokensContextType {
  tokensWithChain: TokenWithChain[];
  getTokens: () => Promise<void>;
  mockDataFlag: boolean;
  setMockDataFlag: (flag: boolean) => void;
}

export const useTokens = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [mockDataFlag, setMockDataFlag] = useState(true);

  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId!);

  const tokensWithChain: TokenWithChain[] = useMemo(
    () =>
      tokens.map((token) => ({
        ...token,
        chain: mockChains.find((chain) => chain.chainId === token.chainId),
      })),
    [tokens]
  );

  const getTokens = useCallback(async () => {
    console.log('getTokens');
    if (mockDataFlag) {
      setTokens(mockTokens);
      return;
    }

    if (!passkeyData?.walletAddress) {
      setTokens([]);
      return;
    }

    walletApi
      .walletdataTokensGet({
        addr: passkeyData.walletAddress,
        ont_id: '', // TODO
      })
      .then((res) => {
        setTokens(res.result);
      });
  }, [passkeyData?.walletAddress, mockDataFlag]);

  useEffect(() => {
    getTokens();
  }, [passkeyData?.walletAddress, getTokens]);

  return { tokensWithChain, getTokens, mockDataFlag, setMockDataFlag };
};

export const TokensContext = createContext<TokensContextType>({
  tokensWithChain: [],
  mockDataFlag: false,
  //   eslint-disable-next-line @typescript-eslint/no-empty-function
  setMockDataFlag: () => {},
  getTokens: async () => Promise.resolve(),
});

export const TokensProvider = TokensContext.Provider;

export const useTokensContext = () => {
  const context = useContext(TokensContext);
  if (!context) {
    throw new Error('useTokensContext must be used within a TokensProvider');
  }
  return context;
};
