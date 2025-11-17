import { atom } from 'jotai';
import type { TransferData } from '../components/review-transfer/types';
import { appJotaiStore } from './jotaiStore';

export const reviewTransferDialogAtom = atom<TransferData | undefined>(undefined);

export const openReviewTransferDialog = (data: TransferData) => {
  appJotaiStore.set(reviewTransferDialogAtom, data);
};

export const closeReviewTransferDialog = () => {
  appJotaiStore.set(reviewTransferDialogAtom, undefined);
};
