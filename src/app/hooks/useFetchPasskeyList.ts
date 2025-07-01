import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPasskeyCredentials, IPasskeyCredential } from '../extendApis';
import { useMatrixClient } from './useMatrixClient';

export function useFetchPasskeyList(
  userId: string
): [IPasskeyCredential | undefined, () => Promise<void>] {
  const mx = useMatrixClient();

  const fetchPasskeys = useCallback(async () => {
    const data = await getPasskeyCredentials(mx, userId);
    return data;
  }, [mx, userId]);

  const { data, refetch } = useQuery({
    queryKey: ['passkeys', userId],
    queryFn: fetchPasskeys,
    staleTime: 0,
    gcTime: Infinity,
    refetchOnMount: 'always',
  });

  const refreshPasskeyList = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // return [data ?? { credentials: [], walletAddress: '0x' }, refreshPasskeyList];
  return [data, refreshPasskeyList];
}
