import { atom } from 'jotai';
import { appJotaiStore } from './jotaiStore';

export interface SyncOwnershipDialogData {
  chainIds: number[];
  onSuccess?: () => void;
  onClose?: () => void;
}

export const syncOwnershipDialogAtom = atom<SyncOwnershipDialogData | undefined>(undefined);

export const openSyncOwnershipDialog = (data: SyncOwnershipDialogData) => {
  appJotaiStore.set(syncOwnershipDialogAtom, data);
};

export const closeSyncOwnershipDialog = () => {
  appJotaiStore.set(syncOwnershipDialogAtom, undefined);
};
