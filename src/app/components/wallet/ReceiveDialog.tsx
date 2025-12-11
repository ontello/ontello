import React, { useEffect, useState } from 'react';
import { Receive } from '@src/app/pages/client/wallet/receive/Receive';
import { useCloseGlobalDialog, useGlobalDialogState } from '@src/app/state/hooks/globalDialogs';
import { GlobalDialogType } from '@src/app/state/globalDialogs';

export function ReceiveDialog() {
  const dialogData = useGlobalDialogState(GlobalDialogType.Receive);
  const closeDialog = useCloseGlobalDialog(GlobalDialogType.Receive);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(Boolean(dialogData));
  }, [dialogData]);

  if (!dialogData || !isOpen) {
    return null;
  }

  return <Receive onClose={closeDialog} />;
}

export default ReceiveDialog;
