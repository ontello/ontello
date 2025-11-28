import React from 'react';
import { ReviewTransferDialog } from './review-transfer';
import { SyncOwnershipChangeDialog } from './wallet/multi-chain/SyncOwnershipChange';
import { InviteFriendsDialog } from './invite';

export function GlobalDialogsRenderer() {
  return (
    <>
      <ReviewTransferDialog />
      <SyncOwnershipChangeDialog />
      <InviteFriendsDialog />
    </>
  );
}

export default GlobalDialogsRenderer;
