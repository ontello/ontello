import React, { useState, useEffect } from 'react';

import cons from '../../../client/state/cons';
import navigation from '../../../client/state/navigation';
import ReviewTransferContent from './ReviewTransferContent';
import type { TransferData } from './types';

export function ReviewTransferDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [transferData, setTransferData] = useState<TransferData | null>(null);

  useEffect(() => {
    const handleOpen = (data: TransferData) => {
      setIsOpen(true);
      setTransferData(data);
    };
    navigation.on(cons.events.navigation.REVIEW_TRANSFER_OPENED, handleOpen);
    return () => {
      navigation.removeListener(cons.events.navigation.REVIEW_TRANSFER_OPENED, handleOpen);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleAfterClose = () => {
    setTransferData(null);
  };

  return transferData ? (
    <ReviewTransferContent
      isOpen={isOpen}
      onClose={handleClose}
      onAfterClose={handleAfterClose}
      transferData={transferData}
    />
  ) : null;
}

export default ReviewTransferDialog;
