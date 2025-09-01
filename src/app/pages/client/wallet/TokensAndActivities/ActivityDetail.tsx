import {
  Dialog,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Box,
  config,
  Header,
  Icon,
  IconButton,
  Icons,
  Text,
} from 'folds';
import React from 'react';
import FocusTrap from 'focus-trap-react';
import { ContainerColor } from '@src/app/styles/ContainerColor.css';
import { stopPropagation } from '../../../../utils/keyboard';
import { ActivityWithChain } from '../types';
import { LabelBox } from './LabelBox';
import { AvatarAndEnsData } from '../../../../components/wallet/AvatarAndEnsData';

export function ActivityDetail({
  activity,
  sendAndReceiveText,
  statusText,
  statusColor,
  onClose,
}: {
  activity: ActivityWithChain;
  sendAndReceiveText: string;
  statusText: string;
  statusColor: string;
  onClose: () => void;
}) {
  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: onClose,
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog variant="Surface">
            <Header
              style={{
                padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                borderBottomWidth: config.borderWidth.B300,
              }}
              variant="Surface"
              size="700"
            >
              <Box direction="Column" grow="Yes">
                <Text size="H3">{sendAndReceiveText}</Text>
                <Box>
                  <Text
                    size="T300"
                    className={ContainerColor({ variant: 'SurfaceVariant' })}
                    style={{ color: statusColor, padding: '0 4px', borderRadius: '4px' }}
                  >
                    {statusText}
                  </Text>
                </Box>
              </Box>
              <IconButton size="300" onClick={onClose} radii="300">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>
            <Box
              direction="Column"
              gap="500"
              style={{ padding: `${config.space.S500} ${config.space.S400}` }}
            >
              <Box direction="Column" gap="100">
                <Text size="H3">
                  {activity.txType === 3 ? '+ ' : '- '}
                  {activity.amount} {activity.assetSymbol}
                </Text>
                <Text size="T300" priority="300">
                  ≈ ${activity.value}
                </Text>
              </Box>
              <LabelBox label="From">
                <AvatarAndEnsData ensData={activity.sendData} />
              </LabelBox>
              <LabelBox label="To">
                <AvatarAndEnsData ensData={activity.receiveData} />
              </LabelBox>
              <LabelBox label="Date">
                <Text size="T300" priority="300">
                  {activity.createTime}
                </Text>
              </LabelBox>
              <LabelBox label="Network">
                <Text size="T300" priority="300">
                  {activity.chain?.chainName}
                </Text>
              </LabelBox>
              <LabelBox label="Network Fee">
                <Text size="T300" priority="300">
                  {activity.networkData?.networkFee} {activity.networkData?.networkFeeToken}
                </Text>
              </LabelBox>
              <LabelBox label="Transaction Hash">
                <Text size="T300" priority="300">
                  {activity.transferHash}
                </Text>
              </LabelBox>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
