import React, { useEffect, useState } from 'react';

import ReviewTransferContent from './ReviewTransferContent';
import { useCloseGlobalDialog, useGlobalDialogState } from '../../state/hooks/globalDialogs';
import { GlobalDialogType } from '../../state/globalDialogs';

export function ReviewTransferDialog() {
  const transferData = useGlobalDialogState(GlobalDialogType.ReviewTransfer);
  const closeDialog = useCloseGlobalDialog(GlobalDialogType.ReviewTransfer);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (transferData) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [transferData]);

  // const handleClose = () => setIsOpen(false);

  const handleClose = () => {
    setIsOpen(false);
    closeDialog();
  };

  if (!transferData) return null;

  return (
    <ReviewTransferContent
      isOpen={isOpen}
      onClose={handleClose}
      // onAfterClose={handleAfterClose}
      transferData={transferData}
    />
  );
}

export default ReviewTransferDialog;
