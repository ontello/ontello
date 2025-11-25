import React from 'react';
import { ReviewTransferDialog } from './review-transfer';
import { SyncOwnershipChangeDialog } from './wallet/multi-chain/SyncOwnershipChange';

export function GlobalDialogsRenderer() {
  return (
    <>
      <ReviewTransferDialog />
      <SyncOwnershipChangeDialog />
    </>
  );
}

export default GlobalDialogsRenderer;
