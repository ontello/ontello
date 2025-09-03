import React from 'react';
import { Box, Text } from 'folds';

export function LabelBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box gap="700" justifyContent="SpaceBetween">
      <Box grow="No" shrink="No">
        <Text size="H6">{label}:</Text>
      </Box>
      {children}
    </Box>
  );
}
