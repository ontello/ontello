import React from 'react';
import { ReviewTransferDialog } from './review-transfer';
import { SyncOwnershipChangeDialog } from './wallet/multi-chain/SyncOwnershipChange';
import { InviteFriendsDialog } from './invite';
import { X402PaymentDialog } from './x402-payment';
import { ReceiveDialog } from './wallet/ReceiveDialog';

export function GlobalDialogsRenderer() {
  return (
    <>
      <ReviewTransferDialog />
      <SyncOwnershipChangeDialog />
      <InviteFriendsDialog />
      <X402PaymentDialog />
      <ReceiveDialog />
    </>
  );
}

export default GlobalDialogsRenderer;
