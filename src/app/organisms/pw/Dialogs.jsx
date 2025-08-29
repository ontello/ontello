import React from 'react';

import ProfileViewer from '../profile-viewer/ProfileViewer';
import SpaceAddExisting from '../../molecules/space-add-existing/SpaceAddExisting';
import Search from '../search/Search';
import CreateRoom from '../create-room/CreateRoom';
import JoinAlias from '../join-alias/JoinAlias';

import ReusableDialog from '../../molecules/dialog/ReusableDialog';
import { ReviewTransferDialog } from '../../components/review-transfer';

function Dialogs() {
  return (
    <>
      <ProfileViewer />
      <CreateRoom />
      <JoinAlias />
      <SpaceAddExisting />
      <Search />

      <ReusableDialog />
      <ReviewTransferDialog />
    </>
  );
}

export default Dialogs;
