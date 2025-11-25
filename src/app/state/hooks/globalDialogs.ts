import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import type { GlobalDialogType, GlobalDialogPayloads } from '../globalDialogs';
import { dialogAtoms } from '../globalDialogs';

export const useGlobalDialogState = <T extends GlobalDialogType>(type: T) =>
  useAtomValue(dialogAtoms[type]);

export const useOpenGlobalDialog = <T extends GlobalDialogType>(type: T) => {
  const setDialog = useSetAtom(dialogAtoms[type]);

  return useCallback(
    (data: GlobalDialogPayloads[T]) => {
      setDialog(data);
    },
    [setDialog, type]
  );
};

export const useCloseGlobalDialog = <T extends GlobalDialogType>(type: T) => {
  const setDialog = useSetAtom(dialogAtoms[type]);

  return useCallback(() => {
    setDialog(undefined);
  }, [setDialog, type]);
};
