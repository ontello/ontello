import { openGlobalDialog, GlobalDialogType } from '../state/globalDialogs';

export type OwnershipSyncResult = 'already-synced' | 'synced';

export const ensureOwnershipSynced = (chainIds: number[]): Promise<OwnershipSyncResult> => {
  if (!chainIds.length) {
    return Promise.resolve('already-synced');
  }

  return new Promise<OwnershipSyncResult>((resolve, reject) => {
    let settled = false;

    const handleSuccess = () => {
      if (settled) return;
      settled = true;
      resolve('synced');
    };

    const handleClose = () => {
      if (settled) return;
      settled = true;
      reject(new Error('sync cancelled'));
    };

    openGlobalDialog(GlobalDialogType.SyncOwnershipChange, {
      chainIds,
      onSuccess: handleSuccess,
      onClose: handleClose,
    });
  });
};
