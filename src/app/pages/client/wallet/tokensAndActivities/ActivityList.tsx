import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text } from 'folds';
import dayjs from 'dayjs';
import { ActivityItem } from './ActivityItem';
import { ActivityWithChain } from '../../../../../types/wallet/types';
import { Activity } from '../../../../externalApis/models';
import { AllChainId } from '../../../../../types/wallet/const';
import { useChainConfig } from '../../../../hooks/web3/useChainConfig';
import { useFetchPasskeyList } from '../../../../hooks/useFetchPasskeyList';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { walletApi } from '../../../../externalApis';

export function ActivityList({ selectedNetworkChainId }: { selectedNetworkChainId: number }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesPageNum, setActivitiesPageNum] = useState(1);
  const { availableChains } = useChainConfig();
  const [, setIsLoadingLatest] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [firstPageIsLoaded, setFirstPageIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const pageSize = 20;

  // Use ref to avoid dependency loop
  const isLoadingLatestRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId || '');

  const getActivities = useCallback(
    async ({
      pageNum,
      isLoadMore = false,
      isLoadLatest = false,
    }: {
      pageNum: number;
      isLoadMore?: boolean;
      isLoadLatest?: boolean;
    }) => {
      if (isLoadLatest && isLoadingLatestRef.current) return;
      if (isLoadMore && (isLoadingMoreRef.current || !hasMoreRef.current)) return;

      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
          isLoadingMoreRef.current = true;
        }
        if (isLoadLatest) {
          setIsLoadingLatest(true);
          isLoadingLatestRef.current = true;
        }

        if (!passkeyData?.walletAddress) {
          setActivities([]);
          setHasMore(false);
          hasMoreRef.current = false;
          return;
        }

        const res = await walletApi.walletdataActivityGet({
          // addr: passkeyData.walletAddress,
          addr: '0x8d47747d73be1b68f69ea4510e72cace1977d404',
          page_num: pageNum,
          page_size: pageSize,
          chain_id: selectedNetworkChainId === AllChainId ? undefined : selectedNetworkChainId,
        });

        setActivities((prevActivities) => {
          const concatActivities: Activity[] = [...prevActivities, ...res.result.records];
          const uniqueAndSortedActivities = concatActivities
            .filter(
              (activity, index, self) =>
                index === self.findIndex((t) => t.transferHash === activity.transferHash)
            )
            .sort((a, b) => (b.createTime ?? 0) - (a.createTime ?? 0));
          return uniqueAndSortedActivities;
        });

        if (isLoadMore) {
          const hasMoreData = pageNum * pageSize < res.result.total;
          setHasMore(hasMoreData);
          hasMoreRef.current = hasMoreData;
          setActivitiesPageNum(pageNum);
        } else if (isLoadLatest) {
          const hasMoreData = res.result.total > res.result.records.length;
          setHasMore(hasMoreData);
          hasMoreRef.current = hasMoreData;
        }

        setFirstPageIsLoaded(true);
      } catch (error) {
        console.error('getActivities error', error);
      } finally {
        if (isLoadMore) {
          setIsLoadingMore(false);
          isLoadingMoreRef.current = false;
        }
        if (isLoadLatest) {
          setIsLoadingLatest(false);
          isLoadingLatestRef.current = false;
        }
      }
    },
    [passkeyData?.walletAddress, selectedNetworkChainId]
  );

  useEffect(() => {
    setActivities([]);
    setActivitiesPageNum(1);
    setFirstPageIsLoaded(false);
    setHasMore(true);
    setIsLoadingMore(false);
    setIsLoadingLatest(false);
    getActivities({ pageNum: 1, isLoadLatest: true });
  }, [selectedNetworkChainId, getActivities]);

  // Function to load more data
  const loadMore = useCallback(() => {
    if (!hasMoreRef.current || isLoadingMoreRef.current || !firstPageIsLoaded) return;

    const nextPageNum = activitiesPageNum + 1;
    getActivities({ pageNum: nextPageNum, isLoadMore: true });
  }, [activitiesPageNum, getActivities, firstPageIsLoaded]);

  useEffect(() => {
    getActivities({ pageNum: 1, isLoadLatest: true });

    const interval = setInterval(() => {
      getActivities({ pageNum: 1, isLoadLatest: true });
    }, 10000);
    return () => clearInterval(interval);
  }, [getActivities]);

  // Use Intersection Observer to listen for the bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreRef.current && !isLoadingMoreRef.current) {
          // console.log('loadMore via Intersection Observer');
          loadMore();
        }
      },
      {
        root: null, // Use viewport as the root
        rootMargin: '0px 0px 100px 0px', // Trigger 100px before the bottom
        threshold: 0.1,
      }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [loadMore]);

  const activitiesWithChainForSelectedNetwork: ActivityWithChain[] = useMemo(() => {
    const activitiesWithChain = activities.map((activity) => ({
      ...activity,
      chain: availableChains.find((chain) => chain.chainId === activity.chainId),
    }));

    if (selectedNetworkChainId === AllChainId) {
      return activitiesWithChain;
    }

    return activitiesWithChain.filter((activity) => activity.chainId === selectedNetworkChainId);
  }, [activities, availableChains, selectedNetworkChainId]);

  // eslint-disable-next-line arrow-body-style
  const groupByDate = useMemo(() => {
    return activitiesWithChainForSelectedNetwork.reduce((acc, activity) => {
      const date = dayjs((activity.createTime ?? 0) * 1000).format('MMM D, YYYY');
      acc[date] = acc[date] || [];
      acc[date].push(activity);
      return acc;
    }, {} as Record<string, ActivityWithChain[]>);
  }, [activitiesWithChainForSelectedNetwork]);

  return (
    <Box
      direction="Column"
      gap="300"
      style={{
        marginTop: '10px',
      }}
      ref={containerRef}
    >
      {Object.entries(groupByDate).map(([date, subActivities]) => (
        <Box key={date} direction="Column" gap="300">
          <Text size="T300" priority="300">
            {date}
          </Text>
          {subActivities.map((activity) => (
            <ActivityItem key={activity.transferHash} activity={activity} />
          ))}
        </Box>
      ))}

      {((isLoadingMore && activities.length > 0) || !firstPageIsLoaded) && (
        <Box direction="Column" gap="200" style={{ padding: '20px', textAlign: 'center' }}>
          <Text size="T200" priority="500">
            Loading...
          </Text>
        </Box>
      )}

      {firstPageIsLoaded && activities.length === 0 && (
        <Box direction="Column" gap="200" style={{ padding: '20px', textAlign: 'center' }}>
          <Text size="T200" priority="500">
            No Data
          </Text>
        </Box>
      )}

      {!hasMore && activities.length > 0 && (
        <Box direction="Column" gap="200" style={{ padding: '20px', textAlign: 'center' }}>
          <Text size="T200" priority="500">
            No More Data
          </Text>
        </Box>
      )}

      {/* Intersection Observer trigger element */}
      {hasMore && !isLoadingMore && <div ref={loadMoreRef} style={{ height: '1px' }} />}
    </Box>
  );
}
