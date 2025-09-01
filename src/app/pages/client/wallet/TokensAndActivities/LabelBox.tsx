import React from 'react';
import { Box, Text } from 'folds';

export function LabelBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box gap="100" justifyContent="SpaceBetween">
      <Box grow="No" shrink="No">
        <Text size="H5">{label}:</Text>
      </Box>
      {children}
    </Box>
  );
}
