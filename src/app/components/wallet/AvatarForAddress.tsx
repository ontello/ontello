import React from 'react';
import makeBlockie from 'ethereum-blockies-base64';
import { Box } from 'folds';

export function AvatarForAddress({ address, size = '20px' }: { address: string; size?: string }) {
  return (
    <Box>
      <img
        src={makeBlockie(address)}
        alt="Avatar"
        style={{ width: size, height: size, borderRadius: '4px' }}
      />
    </Box>
  );
}
