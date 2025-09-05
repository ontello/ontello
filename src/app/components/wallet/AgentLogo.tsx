import React from 'react';
import { Box, config } from 'folds';
import { getWalletCheckAgentPath } from '@src/app/pages/pathUtils';
import { useNavigate } from 'react-router-dom';
import walletAgent from '@app/static/imgs/walletAgent.png';

export function AgentLogo() {
  const navigate = useNavigate();
  const logoClick = () => {
    navigate(getWalletCheckAgentPath());
  };

  return (
    <Box onClick={logoClick}>
      <img
        src={walletAgent}
        alt="walletAgent"
        style={{
          cursor: 'pointer',
          width: '28px',
          height: '28px',
          borderRadius: config.radii.R300,
        }}
      />
    </Box>
  );
}
