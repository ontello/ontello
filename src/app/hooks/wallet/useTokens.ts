import { useEffect, useState, useCallback, createContext, useContext, useMemo } from 'react';
import { walletApi } from '@src/app/externalApis';
import { mxidToOntid } from '@src/app/utils/ontid';
import { useFetchPasskeyList } from '../../hooks/useFetchPasskeyList';
import { Token } from '../../externalApis/models';
import { useMatrixClient } from '../../hooks/useMatrixClient';

export interface TokensContextType {
  tokens: Token[];
  getTokens: () => Promise<void>;
  totalTokensCurrency: number;
}

export const useTokens = () => {
  const [tokens, setTokens] = useState<Token[]>([]);

  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId!);
  const ontId = mxidToOntid(userId!);

  const totalTokensCurrency = useMemo(
    () => tokens.reduce((acc, token) => acc + Number(token.currency || '0'), 0),
    [tokens]
  );

  const getTokens = useCallback(async () => {
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
  }, [passkeyData?.walletAddress, ontId]);

  useEffect(() => {
    getTokens();
  }, [passkeyData?.walletAddress, getTokens]);

  return { tokens, getTokens, totalTokensCurrency };
};

export const TokensContext = createContext<TokensContextType>({
  tokens: [],
  getTokens: async () => Promise.resolve(),
  totalTokensCurrency: 0,
});

export const TokensProvider = TokensContext.Provider;

export const useTokensContext = () => {
  const context = useContext(TokensContext);
  if (!context) {
    throw new Error('useTokensContext must be used within a TokensProvider');
  }
  return context;
};
