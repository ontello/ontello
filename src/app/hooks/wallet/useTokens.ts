import { useEffect, useState, useCallback, createContext, useContext, useMemo } from 'react';
import { walletApi } from '@src/app/externalApis';
import { mxidToOntid } from '@src/app/utils/ontid';
import { Token } from '../../externalApis/models';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { getAuthExtras } from '../../state/authExtras';

export interface TokensContextType {
  tokens: Token[];
  // getTokens: () => Promise<void>;
  totalTokensCurrency: number;
  getToken: (addr: string) => Token | undefined;
}

export const useTokens = () => {
  const [tokens, setTokens] = useState<Token[]>([]);

  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const ontId = mxidToOntid(userId!);

  const totalTokensCurrency = useMemo(
    () => tokens.reduce((acc, token) => acc + Number(token.currency || '0'), 0),
    [tokens]
  );

  const getToken = useCallback(
    (addr: string) =>
      tokens.find((token) => token.tokenAddr?.toLowerCase() === addr?.toLowerCase()),
    [tokens]
  );

  const getTokens = useCallback(async () => {
    const { aaAddress } = getAuthExtras();
    if (!aaAddress) {
      setTokens([]);
      return;
    }

    walletApi
      .walletdataTokensGet({
        addr: aaAddress,
        ont_id: ontId!,
      })
      .then((res) => {
        setTokens(res.result);
      });
  }, [ontId]);

  useEffect(() => {
    getTokens();
    const interval = setInterval(() => {
      getTokens();
    }, 5000);
    return () => clearInterval(interval);
  }, [getTokens]);

  return { tokens, getTokens, totalTokensCurrency, getToken };
};

export const TokensContext = createContext<TokensContextType>({
  tokens: [],
  // getTokens: async () => Promise.resolve(),
  totalTokensCurrency: 0,
  getToken: () => undefined,
});

export const TokensProvider = TokensContext.Provider;

export const useTokensContext = () => {
  const context = useContext(TokensContext);
  if (!context) {
    throw new Error('useTokensContext must be used within a TokensProvider');
  }
  return context;
};
