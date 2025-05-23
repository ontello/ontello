import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPasskeyCredentials, IPasskeyCredential } from '../extendApis';
import { useMatrixClient } from './useMatrixClient';


export function useFetchPasskeyList(userId: string): [IPasskeyCredential[], () => Promise<void>] {
  const mx = useMatrixClient();

  const fetchPasskeys = useCallback(async () => {
    const data = await getPasskeyCredentials(mx, userId);
    return data;
  }, [mx, userId]);

  const { data: passkeyList, refetch } = useQuery({
    queryKey: ['passkeys'],
    queryFn: fetchPasskeys,
    staleTime: 0,
    gcTime: Infinity,
    refetchOnMount: 'always',
  });

  const refreshPasskeyList = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return [passkeyList ?? [], refreshPasskeyList];
}
