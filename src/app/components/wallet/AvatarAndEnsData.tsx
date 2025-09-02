import React from 'react';
import { Box, Text } from 'folds';
import { EnsData } from '@src/app/externalApis/models/EnsData';
import { AvatarForAddress } from '@src/app/components/wallet/AvatarForAddress';
import { formatAddress } from '../../utils/formatData';
import { ContainerColor } from '../../styles/ContainerColor.css';
import { CopyIcon } from '../CopyIcon';

export function AvatarAndEnsData({
  ensData,
  hideAddressIfHasEns = false,
  directionMode = 'Row',
  showShortAddress = false,
  showCopyAddress = false,
  alignItems = 'Start',
  justifyContent = 'Start',
}: {
  ensData: EnsData;
  hideAddressIfHasEns?: boolean;
  directionMode?: 'Row' | 'Column';
  showShortAddress?: boolean;
  showCopyAddress?: boolean;
  alignItems?: 'Start' | 'Center' | 'End';
  justifyContent?: 'Start' | 'Center' | 'End';
}) {
  const hideAddress = ensData.domain && hideAddressIfHasEns;
  const showAddress = !hideAddress;

  const rowModeComponent = (
    <Box direction="Row" gap="100" alignItems={alignItems} justifyContent={justifyContent}>
      <Box shrink="No" grow="No">
        <AvatarForAddress address={ensData.addr} />
      </Box>
      <Box direction="Column" gap="100" grow="Yes" style={{ wordBreak: 'break-all' }}>
        {ensData.domain && (
          <Box
            className={ContainerColor({ variant: 'Primary' })}
            style={{ borderRadius: '3px', padding: '2px 4px', width: 'fit-content' }}
          >
            <Text size="T300">{ensData.domain}</Text>
          </Box>
        )}

        {showAddress && (
          <Text as="div">
            <Text as="span" size="T300">
              {showShortAddress ? formatAddress(ensData.addr) : ensData.addr}
            </Text>
            {showCopyAddress && <CopyIcon text={ensData.addr} />}
          </Text>
        )}
      </Box>
    </Box>
  );

  const columnModeComponent = (
    <Box direction="Column" gap="100" alignItems={alignItems} justifyContent={justifyContent}>
      <Box direction="Row" gap="100">
        <Box shrink="No" grow="No">
          <AvatarForAddress address={ensData.addr} />
        </Box>
        <Box direction="Column" gap="100" grow="Yes" style={{ wordBreak: 'break-all' }}>
          {ensData.domain && (
            <Box
              className={ContainerColor({ variant: 'Primary' })}
              style={{ borderRadius: '3px', padding: '2px 4px', width: 'fit-content' }}
            >
              <Text size="T300">{ensData.domain}</Text>
            </Box>
          )}

          {showAddress && !ensData.domain && (
            <Text as="div">
              <Text as="span" size="T300">
                {showShortAddress ? formatAddress(ensData.addr) : ensData.addr}
              </Text>
              {showCopyAddress && <CopyIcon text={ensData.addr} />}
            </Text>
          )}
        </Box>
      </Box>
      {showAddress && ensData.domain && (
        <Text as="div" style={{ wordBreak: 'break-all' }}>
          <Text as="span" size="T300">
            {showShortAddress ? formatAddress(ensData.addr) : ensData.addr}
          </Text>
          {showCopyAddress && <CopyIcon text={ensData.addr} />}
        </Text>
      )}
    </Box>
  );

  switch (directionMode) {
    case 'Row':
      return rowModeComponent;
    case 'Column':
      return columnModeComponent;
    default:
      return rowModeComponent;
  }
}
