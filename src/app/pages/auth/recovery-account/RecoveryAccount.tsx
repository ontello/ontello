import { useAuthServer } from '@src/app/hooks/useAuthServer';
import { Box, Text } from 'folds';
import React from 'react';
import { Link } from 'react-router-dom';
import { getLoginPath } from '../../pathUtils';
import { RecoveryKeyForm } from './RecoveryAccountForm';

export function RecoveryAccount() {
  const server = useAuthServer();

  return (
    <Box direction="Column" gap="500">
      <Text size="H2" priority="400">
        Reset Password
      </Text>
      <RecoveryKeyForm />
      <span data-spacing-node />

      <Text align="Center">
        <Link to={getLoginPath(server)}>To Login</Link>
      </Text>
    </Box>
  );
}
