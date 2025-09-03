import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text } from 'folds';
import dayjs from 'dayjs';
import { ActivityItem } from './ActivityItem';
import { ActivityWithChain } from '../types';
import { Activity } from '../../../../externalApis/models';
import { mockActivities } from '../MockData';
import { AllChainId } from '../const';
import { useChainConfig } from '../../../../hooks/web3/useChainConfig';
import { useFetchPasskeyList } from '../../../../hooks/useFetchPasskeyList';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { walletApi } from '../../../../externalApis';

export function ActivityList({ selectedNetworkChainId }: { selectedNetworkChainId: number }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesPageNum, setActivitiesPageNum] = useState(0);
  const [, setActivitiesPageTotal] = useState(0);
  const [mockDataFlag] = useState(true);
  const { availableChains } = useChainConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId || '');

  const getActivities = useCallback(
    async ({
      pageNum,
      pageSize,
      isLoadMore = false,
    }: {
      pageNum: number;
      pageSize: number;
      isLoadMore?: boolean;
    }) => {
      if (isLoading || (isLoadMore && isLoadingMore)) return;

      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        // console.log('getActivities', { pageNum, pageSize, isLoadMore });

        if (mockDataFlag) {
          if (isLoadMore) {
            // 模拟加载更多数据
            setActivities((prev) => [...prev, ...mockActivities.slice(0, 5)]);
          } else {
            setActivities(mockActivities);
          }
          setHasMore(mockActivities.length > 0);
          return;
        }

        if (!passkeyData?.walletAddress) {
          setActivities([]);
          setActivitiesPageTotal(0);
          setHasMore(false);
          return;
        }

        const res = await walletApi.walletdataActivityGet({
          addr: passkeyData.walletAddress,
          page_num: pageNum,
          page_size: pageSize,
        });

        if (isLoadMore) {
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
        } else {
          setActivities(res.result.records);
        }

        setActivitiesPageTotal(res.result.total);
        setHasMore(res.result.records.length === pageSize);
        setActivitiesPageNum(pageNum);
      } catch (error) {
        // console.error(error);
      } finally {
        if (isLoadMore) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [passkeyData?.walletAddress, mockDataFlag]
  );

  // 加载更多数据的函数
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    const nextPageNum = activitiesPageNum + 1;
    getActivities({ pageNum: nextPageNum, pageSize: 10, isLoadMore: true });
  }, [hasMore, isLoadingMore, activitiesPageNum, getActivities]);

  useEffect(() => {
    getActivities({ pageNum: 0, pageSize: 10 });

    const interval = setInterval(() => {
      getActivities({ pageNum: 0, pageSize: 10 });
    }, 5000);
    return () => clearInterval(interval);
  }, [getActivities]);

  // 使用 Intersection Observer 监听触底
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          console.log('loadMore via Intersection Observer');
          loadMore();
        }
      },
      {
        root: null, // 使用 viewport 作为根
        rootMargin: '100px', // 提前100px触发
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
  }, [hasMore, isLoadingMore, loadMore]);

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

      {/* 加载更多状态 */}
      {isLoadingMore && (
        <Box direction="Column" gap="200" style={{ padding: '20px', textAlign: 'center' }}>
          <Text size="T200" priority="500">
            Loading...
          </Text>
        </Box>
      )}

      {/* 没有更多数据 */}
      {!hasMore && activities.length > 0 && (
        <Box direction="Column" gap="200" style={{ padding: '20px', textAlign: 'center' }}>
          <Text size="T200" priority="500">
            No More Data
          </Text>
        </Box>
      )}

      {/* Intersection Observer 触发元素 */}
      {hasMore && !isLoadingMore && <div ref={loadMoreRef} style={{ height: '1px' }} />}
    </Box>
  );
}
