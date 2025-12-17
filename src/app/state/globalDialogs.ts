import { atom, type PrimitiveAtom } from 'jotai';
import type { TransferData } from '../components/review-transfer/types';
import type { SyncOwnershipDialogData } from '../components/wallet/multi-chain/SyncOwnershipChange';
import type { X402PaymentDialogData } from '../components/x402-payment/types';
import { appJotaiStore } from './jotaiStore';

export enum GlobalDialogType {
  ReviewTransfer,
  SyncOwnershipChange,
  InviteFriends,
  X402Payment,
  Receive,
}

export interface GlobalDialogPayloads {
  [GlobalDialogType.ReviewTransfer]: TransferData;
  [GlobalDialogType.SyncOwnershipChange]: SyncOwnershipDialogData;
  [GlobalDialogType.InviteFriends]: {};
  [GlobalDialogType.X402Payment]: X402PaymentDialogData;
  [GlobalDialogType.Receive]: { chainId?: number };
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
  [GlobalDialogType.X402Payment]:
    atom<GlobalDialogState<GlobalDialogType.X402Payment>>(undefined),
  [GlobalDialogType.Receive]: atom<GlobalDialogState<GlobalDialogType.Receive>>(undefined),
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
