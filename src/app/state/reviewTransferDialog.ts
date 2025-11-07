import { atom, getDefaultStore } from 'jotai';
import type { TransferData } from '../components/review-transfer/types';

export const reviewTransferDialogAtom = atom<TransferData | undefined>(undefined);

const defaultStore = getDefaultStore();

export const openReviewTransferDialog = (data: TransferData) => {
  defaultStore.set(reviewTransferDialogAtom, data);
};

export const closeReviewTransferDialog = () => {
  defaultStore.set(reviewTransferDialogAtom, undefined);
};
