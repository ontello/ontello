import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'folds';
import { NetworkSelect } from './NetworkSelect';
import { TokensList } from './TokensList';
import { ActivityList } from './ActivityList';
import { useFetchPasskeyList } from '../../../../hooks/useFetchPasskeyList';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { walletApi } from '../../../../externalApis';
import { Token, Activity, ChainConfig } from '../../../../externalApis/models';
import { TokenWithChain } from '../types';
import { mockChains, mockTokens } from './MockData';

export function TokensAndActivities() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'activities'>('tokens');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokensForSelectedNetwork, setTokensForSelectedNetwork] = useState<TokenWithChain[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesPageNum, setActivitiesPageNum] = useState(0);
  const [activitiesPageTotal, setActivitiesPageTotal] = useState(0);
  const [mockDataFlag, setMockDataFlag] = useState(true);

  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId!);

  const AllChainId = 100010011111;

  const allChains: ChainConfig[] = useMemo(
    () => [
      {
        chainId: AllChainId,
        chainName: 'All Networks',
        iconUrls: [],
        blockExplorerUrls: [],
      } as unknown as ChainConfig,
      ...mockChains,
    ],
    []
  );

  const [selectedNetwork, setSelectedNetwork] = useState<ChainConfig>(allChains[0]);

  const tokensWithChain: TokenWithChain[] = useMemo(
    () =>
      tokens.map((token) => ({
        ...token,
        chain: allChains.find((chain) => chain.chainId === token.chainId),
      })),
    [tokens, allChains]
  );

  useEffect(() => {
    if (selectedNetwork.chainId === AllChainId) {
      setTokensForSelectedNetwork(tokensWithChain);
    } else {
      setTokensForSelectedNetwork(
        tokensWithChain.filter((token) => token.chainId === selectedNetwork.chainId)
      );
    }
  }, [selectedNetwork, tokensWithChain]);

  useEffect(() => {
    if (mockDataFlag) {
      setTokens(mockTokens);
      setActivities([]);
      return;
    }

    if (activeTab === 'tokens') {
      if (!passkeyData?.walletAddress) return;
      walletApi
        .walletdataTokensGet({
          addr: passkeyData.walletAddress,
          ont_id: '', // TODO
        })
        .then((res) => {
          setTokens(res.result);
        });
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

  const handleNetworkSelect = (network: ChainConfig) => {
    setSelectedNetwork(network);
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
          networks={allChains}
          selected={selectedNetwork}
          onSelect={handleNetworkSelect}
        />
      </Box>

      {activeTab === 'tokens' && <TokensList tokens={tokensForSelectedNetwork} />}

      {activeTab === 'activities' && <ActivityList />}
    </Box>
  );
}
