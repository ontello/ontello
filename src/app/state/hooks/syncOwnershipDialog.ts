import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import type { SyncOwnershipDialogData } from '../syncOwnershipChangeDialog';
import { syncOwnershipDialogAtom } from '../syncOwnershipChangeDialog';

export const useSyncOwnershipDialogState = () => useAtomValue(syncOwnershipDialogAtom);

export const useOpenSyncOwnershipDialog = () => {
  const setDialog = useSetAtom(syncOwnershipDialogAtom);

  return useCallback(
    (data: SyncOwnershipDialogData) => {
      setDialog(data);
    },
    [setDialog]
  );
};

export const useCloseSyncOwnershipDialog = () => {
  const setDialog = useSetAtom(syncOwnershipDialogAtom);

  return useCallback(() => {
    setDialog(undefined);
  }, [setDialog]);
};
