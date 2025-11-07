import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import type { TransferData } from '../../components/review-transfer/types';
import { reviewTransferDialogAtom } from '../reviewTransferDialog';

export const useReviewTransferDialogState = () => useAtomValue(reviewTransferDialogAtom);

export const useOpenReviewTransferDialog = () => {
  const setDialog = useSetAtom(reviewTransferDialogAtom);

  return useCallback(
    (data: TransferData) => {
      setDialog(data);
    },
    [setDialog]
  );
};

export const useCloseReviewTransferDialog = () => {
  const setDialog = useSetAtom(reviewTransferDialogAtom);

  return useCallback(() => {
    setDialog(undefined);
  }, [setDialog]);
};
