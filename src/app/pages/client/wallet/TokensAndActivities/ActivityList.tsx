import React, { useMemo } from 'react';
import { Box, Text } from 'folds';
import dayjs from 'dayjs';
import { ActivityItem } from './ActivityItem';
import { ActivityWithChain } from '../types';

export function ActivityList({ activities }: { activities: ActivityWithChain[] }) {
  const sortedActivities = useMemo(
    () => activities.sort((a, b) => (b.createTime ?? 0) - (a.createTime ?? 0)),
    [activities]
  );

  // eslint-disable-next-line arrow-body-style
  const groupByDate = useMemo(() => {
    return sortedActivities.reduce((acc, activity) => {
      const date = dayjs((activity.createTime ?? 0) * 1000).format('MMM D, YYYY');
      acc[date] = acc[date] || [];
      acc[date].push(activity);
      return acc;
    }, {} as Record<string, ActivityWithChain[]>);
  }, [sortedActivities]);

  return (
    <Box direction="Column" gap="300" style={{ marginTop: '10px' }}>
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
    </Box>
  );
}
