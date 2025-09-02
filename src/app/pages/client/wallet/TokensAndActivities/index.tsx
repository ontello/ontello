import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'folds';
import { NetworkSelect } from '../components/NetworkSelect';
import { TokensList } from '../components/TokensList';
import { ActivityList } from './ActivityList';
import { useFetchPasskeyList } from '../../../../hooks/useFetchPasskeyList';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { walletApi } from '../../../../externalApis';
import { Activity } from '../../../../externalApis/models';
import { ActivityWithChain } from '../types';
import { mockActivities } from '../MockData';
import { AllChainId } from '../const';
import { useChainConfig } from '../../../../hooks/web3/useChainConfig';

export function TokensAndActivities() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'activities'>('tokens');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesForSelectedNetwork, setActivitiesForSelectedNetwork] = useState<
    ActivityWithChain[]
  >([]);
  const [activitiesPageNum, setActivitiesPageNum] = useState(0);
  const [activitiesPageTotal, setActivitiesPageTotal] = useState(0);
  const [mockDataFlag, setMockDataFlag] = useState(true);

  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId!);

  const [selectedNetworkChainId, setSelectedNetworkChainId] = useState<number>(AllChainId);
  const { availableChains } = useChainConfig();
  const activitiesWithChain: ActivityWithChain[] = useMemo(
    () =>
      activities.map((activity) => ({
        ...activity,
        chain: availableChains.find((chain) => chain.chainId === activity.chainId),
      })),
    [activities, availableChains]
  );

  useEffect(() => {
    if (selectedNetworkChainId === AllChainId) {
      setActivitiesForSelectedNetwork(activitiesWithChain);
    } else {
      setActivitiesForSelectedNetwork(
        activitiesWithChain.filter((activity) => activity.chainId === selectedNetworkChainId)
      );
    }
  }, [selectedNetworkChainId, activitiesWithChain]);

  useEffect(() => {
    if (mockDataFlag) {
      setActivities(mockActivities);
      return;
    }

    if (activeTab === 'tokens') {
      // TODO
    } else {
      if (!passkeyData?.walletAddress) return;
      walletApi
        .walletdataActivityGet({
          addr: passkeyData.walletAddress,
          page_num: activitiesPageNum,
          page_size: 10,
        })
        .then((res) => {
          setActivities(res.result.records);
          setActivitiesPageTotal(res.result.total);
        });
    }
  }, [activeTab, activitiesPageNum, passkeyData?.walletAddress, mockDataFlag]);

  const handleNetworkSelect = (networkChainId: number) => {
    setSelectedNetworkChainId(networkChainId);
  };

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
          onSelect={handleNetworkSelect}
          showTotalCurrency
        />
      </Box>

      {activeTab === 'tokens' && (
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        <TokensList filterChainId={selectedNetworkChainId} onSelect={() => {}} />
      )}

      {activeTab === 'activities' && <ActivityList activities={activitiesForSelectedNetwork} />}
    </Box>
  );
}
