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
import dayjs from 'dayjs';
import { stopPropagation } from '../../../../utils/keyboard';
import { ActivityWithChain } from '../types';
import { LabelBox } from './LabelBox';
import { AvatarAndEnsData } from '../../../../components/wallet/AvatarAndEnsData';
import { formatTxLink, formatAddress } from '../../../../utils/formatData';
import { CopyIcon } from '../../../../components/CopyIcon';

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
              gap="600"
              style={{ padding: `${config.space.S600} ${config.space.S400} ${config.space.S700}` }}
            >
              <Box direction="Column" gap="100">
                <Text size="H3">
                  {activity.txType === 3 ? '+' : '-'}
                  {activity.amount} {activity.assetSymbol}
                </Text>
                <Text size="T300" priority="300">
                  ≈ ${activity.value}
                </Text>
              </Box>

              <LabelBox label="From">
                <AvatarAndEnsData
                  ensData={activity.sendData}
                  showShortAddress
                  showCopyAddress
                  directionMode="Column"
                  alignItems="End"
                />
              </LabelBox>

              <LabelBox label="To">
                <AvatarAndEnsData
                  ensData={activity.receiveData}
                  showShortAddress
                  showCopyAddress
                  directionMode="Column"
                  alignItems="End"
                />
              </LabelBox>

              <LabelBox label="Date">
                <Text size="T300">
                  {dayjs((activity.createTime ?? 0) * 1000).format('YYYY-MM-DD HH:mm:ss')}
                </Text>
              </LabelBox>

              <LabelBox label="Network">
                <Box direction="Row" gap="100" alignItems="Center">
                  <img
                    src={activity.chain?.iconUrls?.[0]}
                    alt={activity.chain?.chainName}
                    style={{ height: '18px' }}
                  />
                  <Text size="T300">{activity.chain?.chainName}</Text>
                </Box>
              </LabelBox>

              <LabelBox label="Network fee">
                <Box direction="Column" gap="100" alignItems="End">
                  <Text size="T300">-${activity.networkData?.networkFeeCurrency}</Text>
                  <Text size="T300" priority="300">
                    {activity.networkData?.networkFee} {activity.networkData?.networkFeeToken}
                  </Text>
                </Box>
              </LabelBox>

              <LabelBox label="Transaction ID">
                <Box direction="Row" alignItems="Center">
                  <Text
                    as="a"
                    size="T300"
                    href={formatTxLink(activity.chain, activity.transferHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {formatAddress(activity.transferHash)}
                  </Text>
                  <CopyIcon text={activity.transferHash} />
                </Box>
              </LabelBox>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
