import React, { useMemo } from 'react';
import { Box, Text } from 'folds';
import { AssetAndChainIcon } from '../../../../components/wallet/AssetAndChainIcon';
import { ActivityWithChain } from '../types';

export function ActivityItem({ activity }: { activity: ActivityWithChain }) {
  const sendAndReceiveText = useMemo(() => {
    if (activity.txType === 3) {
      return 'Received';
    }
    if (activity.txType === 4) {
      return 'Send';
    }
    return 'Unknown';
  }, [activity.txType]);

  const statusText = useMemo(() => {
    if (activity.status === 1) {
      return 'Confirmed';
    }
    if (activity.status === 2) {
      return 'Failed';
    }
    if (activity.status === 3) {
      return 'Pending';
    }
    return 'Unknown';
  }, [activity.status]);

  const statusColor = useMemo(() => {
    if (activity.status === 1) {
      return '#5A9A67';
    }
    if (activity.status === 2) {
      return '#EB5757';
    }
    if (activity.status === 3) {
      return '#F0B90B';
    }
    return '';
  }, [activity.status]);

  return (
    <Box justifyContent="SpaceBetween" alignItems="Center" gap="300">
      <Box gap="100" alignItems="Center">
        <AssetAndChainIcon asset={activity.assetIcon} chain={activity.chain?.iconUrls[0]} />
        <Box direction="Column">
          <Text size="H5">{sendAndReceiveText}</Text>
          <Text size="T300" style={{ color: statusColor }}>
            {statusText}
          </Text>
        </Box>
      </Box>

      <Box direction="Column" alignItems="End">
        <Text size="H6">
          {activity.txType === 3 ? '+' : '-'} ${activity.value}
        </Text>
        <Text size="T300" priority="300">
          {activity.amount} {activity.assetSymbol}
        </Text>
      </Box>
    </Box>
  );
}
