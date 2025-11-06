import { emitReviewTransferOpened } from '../state/navigation';

export function openReviewTransfer(transferData) {
  emitReviewTransferOpened(transferData);
}
