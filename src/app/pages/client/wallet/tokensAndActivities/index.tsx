import React, { useState } from 'react';
import { Box, Text } from 'folds';
import { NetworkSelect } from '../../../../components/wallet/NetworkSelect';
import { TokensList } from '../../../../components/wallet/tokens/TokensList';
import { ActivityList } from './ActivityList';

import { AllChainId } from '../../../../../types/wallet/const';

export function TokensAndActivities() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'activities'>('tokens');
  const [selectedNetworkChainId, setSelectedNetworkChainId] = useState<number>(AllChainId);

  return (
    <Box direction="Column" gap="300" style={{ marginTop: '6px' }}>
      <Box gap="500" alignItems="Center">
        <Text
          size="H6"
          style={{
            borderBottom: `2px solid transparent`,
            borderBottomColor: activeTab === 'tokens' ? 'currentColor' : 'transparent',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('tokens')}
        >
          Tokens
        </Text>
        <Text
          size="H6"
          style={{
            borderBottom: `2px solid transparent`,
            borderBottomColor: activeTab === 'activities' ? 'currentColor' : 'transparent',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('activities')}
        >
          Activities
        </Text>
      </Box>

      <Box style={{ position: 'relative' }}>
        <NetworkSelect
          selectedChainId={selectedNetworkChainId}
          onSelect={setSelectedNetworkChainId}
          showTotalCurrency
        />
      </Box>

      {activeTab === 'tokens' && (
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        <TokensList filterChainId={selectedNetworkChainId} onSelect={null} />
      )}

      {activeTab === 'activities' && (
        <ActivityList selectedNetworkChainId={selectedNetworkChainId} />
      )}
    </Box>
  );
}
