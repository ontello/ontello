import { atom, type PrimitiveAtom } from 'jotai';
import type { TransferData } from '../components/review-transfer/types';
import { appJotaiStore } from './jotaiStore';

export interface SyncOwnershipDialogData {
  chainIds: number[];
  onSuccess?: () => void;
  onClose?: () => void;
}

export interface InviteFriendsDialogData {}

export enum GlobalDialogType {
  ReviewTransfer,
  SyncOwnershipChange,
  InviteFriends,
}

export interface GlobalDialogPayloads {
  [GlobalDialogType.ReviewTransfer]: TransferData;
  [GlobalDialogType.SyncOwnershipChange]: SyncOwnershipDialogData;
  [GlobalDialogType.InviteFriends]: InviteFriendsDialogData;
}

export type GlobalDialogState<T extends GlobalDialogType> = GlobalDialogPayloads[T] | undefined;

type DialogAtomMap = {
  [K in GlobalDialogType]: PrimitiveAtom<GlobalDialogState<K>>;
};

export const dialogAtoms: DialogAtomMap = {
  [GlobalDialogType.ReviewTransfer]:
    atom<GlobalDialogState<GlobalDialogType.ReviewTransfer>>(undefined),
  [GlobalDialogType.SyncOwnershipChange]:
    atom<GlobalDialogState<GlobalDialogType.SyncOwnershipChange>>(undefined),
  [GlobalDialogType.InviteFriends]:
    atom<GlobalDialogState<GlobalDialogType.InviteFriends>>(undefined),
};

export const openGlobalDialog = <T extends GlobalDialogType>(
  type: T,
  data: GlobalDialogPayloads[T]
) => {
  appJotaiStore.set(dialogAtoms[type], data);
};

export const closeGlobalDialog = <T extends GlobalDialogType>(type: T) => {
  appJotaiStore.set(dialogAtoms[type], undefined);
};
