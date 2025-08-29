import React from 'react';
import { Box } from 'folds';
import { ActivityItem } from './ActivityItem';

export function ActivityList() {
  return (
    <Box direction="Column" gap="300">
      <ActivityItem />
      <ActivityItem />
      <ActivityItem />
    </Box>
  );
}
