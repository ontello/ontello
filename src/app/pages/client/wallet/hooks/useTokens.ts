import { useEffect, useState, useCallback, createContext, useContext, useMemo } from 'react';
import { walletApi } from '@src/app/externalApis';
import { mxidToOntid } from '@src/app/utils/ontid';
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
  totalTokensCurrency: number;
}

export const useTokens = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [mockDataFlag, setMockDataFlag] = useState(false);

  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId!);
  const ontId = mxidToOntid(userId!);

  const tokensWithChain: TokenWithChain[] = useMemo(
    () =>
      tokens.map((token) => ({
        ...token,
        chain: mockChains.find((chain) => chain.chainId === token.chainId),
      })),
    [tokens]
  );

  const totalTokensCurrency = useMemo(
    () => tokens.reduce((acc, token) => acc + Number(token.currency || '0'), 0),
    [tokens]
  );

  const getTokens = useCallback(async () => {
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
        ont_id: ontId!,
      })
      .then((res) => {
        setTokens(res.result);
      });
  }, [passkeyData?.walletAddress, mockDataFlag, ontId]);

  useEffect(() => {
    getTokens();
  }, [passkeyData?.walletAddress, getTokens]);

  return { tokensWithChain, getTokens, mockDataFlag, setMockDataFlag, totalTokensCurrency };
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
