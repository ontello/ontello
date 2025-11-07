import React, { useEffect, useState } from 'react';

import ReviewTransferContent from './ReviewTransferContent';
import {
  useReviewTransferDialogState,
  useCloseReviewTransferDialog,
} from '../../state/hooks/reviewTransferDialog';

export function ReviewTransferDialog() {
  const transferData = useReviewTransferDialogState();
  const closeDialog = useCloseReviewTransferDialog();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (transferData) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [transferData]);

  const handleClose = () => setIsOpen(false);

  const handleAfterClose = () => {
    setIsOpen(false);
    closeDialog();
  };

  if (!transferData) return null;

  return (
    <ReviewTransferContent
      isOpen={isOpen}
      onClose={handleClose}
      onAfterClose={handleAfterClose}
      transferData={transferData}
    />
  );
}

export default ReviewTransferDialog;
