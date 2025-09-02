import React, { useState } from 'react';
import { Box, Button, Text } from 'folds';
import { SendNavMode, TokenWithChain } from '../types';
import { Back } from '../../../../components/ontello/Back';
import { NetworkSelect } from '../components/NetworkSelect';
import { TokensList } from '../components/TokensList';
import { AllChainId } from '../const';

export function SelectAsset({
  setSendNavMode,
  setSelectedToken,
}: {
  setSendNavMode: (mode: SendNavMode) => void;
  setSelectedToken: (token: TokenWithChain) => void;
}) {
  const [selectedNetworkChainId, setSelectedNetworkChainId] = useState<number>(AllChainId);

  const handleTokenSelect = (token: TokenWithChain) => {
    setSelectedToken(token);
    setSendNavMode(SendNavMode.SendMain);
  };

  return (
    <Box direction="Column" gap="600">
      <Back onClick={() => setSendNavMode(SendNavMode.SendMain)}>
        <Text size="H5" align="Center" style={{ width: '100%' }}>
          Select asset
        </Text>
      </Back>
      <Box direction="Column" gap="300">
        <NetworkSelect
          selectedChainId={selectedNetworkChainId}
          onSelect={setSelectedNetworkChainId}
        />
        <TokensList filterChainId={selectedNetworkChainId} onSelect={handleTokenSelect} />
      </Box>
    </Box>
  );
}
