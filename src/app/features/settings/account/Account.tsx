import React, { useState, useCallback, useEffect, useMemo, ChangeEventHandler, FormEventHandler } from 'react';
import { 
  Box, Text, IconButton, Icon, Icons, Scroll, Button, Input, Chip, Avatar, Overlay, OverlayBackdrop, OverlayCenter, Modal, Dialog, Header, Spinner, FocusTrap, config 
} from 'folds';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';
import { SettingTile } from '../../../components/setting-tile';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { UserProfile, useUserProfile } from '../../../hooks/useUserProfile';
import { getMxIdLocalPart, mxcUrlToHttp } from '../../../utils/matrix';
import { UserAvatar } from '../../../components/user-avatar';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { nameInitials } from '../../../utils/common';
import { copyToClipboard } from '../../../utils/dom';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { useFilePicker } from '../../../hooks/useFilePicker';
import { useObjectURL } from '../../../hooks/useObjectURL';
import { stopPropagation } from '../../../utils/keyboard';
import { ImageEditor } from '../../../components/image-editor';
import { ModalWide } from '../../../styles/Modal.css';
import { createUploadAtom, UploadSuccess } from '../../../state/upload';
import { CompactUploadCardRenderer } from '../../../components/upload-card';
import { useCapabilities } from '../../../hooks/useCapabilities';
import { mxidToOntid } from '../../../utils/ontid';
import { MatrixId } from './MatrixId';
import { Profile } from './Profile';
import { ContactInformation } from './ContactInfo';
import { IgnoredUserList } from './IgnoredUserList';

// Keep custom MatrixId function with Ontello ONT ID functionality
function MatrixId() {
  const mx = useMatrixClient();
  const userId = mx.getUserId()!;
  const ontId = mxidToOntid(userId);

  return (
    <>
      <Box direction="Column" gap="100">
        <Text size="L400">Matrix ID</Text>
        <SequenceCard
          className={SequenceCardStyle}
          variant="SurfaceVariant"
          direction="Column"
          gap="400"
        >
          <SettingTile
            title={userId}
            after={
              <Chip variant="Secondary" radii="Pill" onClick={() => copyToClipboard(userId)}>
                <Text size="T200">Copy</Text>
              </Chip>
            }
          />
        </SequenceCard>
      </Box>
      <Box direction="Column" gap="100">
        <Text size="L400">ONT ID</Text>
        <SequenceCard
          className={SequenceCardStyle}
          variant="SurfaceVariant"
          direction="Column"
          gap="400"
        >
          <SettingTile
            title={ontId}
            after={
              <Chip variant="Secondary" radii="Pill" onClick={() => copyToClipboard(ontId ?? '')}>
                <Text size="T200">Copy</Text>
              </Chip>
            }
          />
        </SequenceCard>
      </Box>
    </>
  );
}

type AccountProps = {
  requestClose: () => void;
};
export function Account({ requestClose }: AccountProps) {
  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Account
            </Text>
          </Box>
          <Box shrink="No">
            <IconButton onClick={requestClose} variant="Surface">
              <Icon src={Icons.Cross} />
            </IconButton>
          </Box>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <Box direction="Column" gap="700">
              <Profile />
              <MatrixId />
              <ContactInformation />
              <IgnoredUserList />
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
