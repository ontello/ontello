import React from 'react';
import { ReviewTransferDialog } from './review-transfer';
import { SyncOwnershipChangeDialog } from './wallet/multi-chain/SyncOwnershipChange';
import { InviteFriendsDialog } from './invite';
import { X402PaymentDialog } from './x402-payment';
import { Receive } from '../pages/client/wallet/receive/Receive';

export function GlobalDialogsRenderer() {
  return (
    <>
      <ReviewTransferDialog />
      <SyncOwnershipChangeDialog />
      <InviteFriendsDialog />
      <X402PaymentDialog />
      <Receive />
    </>
  );
}

export default GlobalDialogsRenderer;
