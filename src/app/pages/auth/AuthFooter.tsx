import React from 'react';
import { Box, Text } from 'folds';
import { APP_INFO } from '@src/app/config/appInfo';
import * as css from './styles.css';

export function AuthFooter() {
  return (
    <Box className={css.AuthFooter} justifyContent="Center" gap="400" wrap="Wrap">
      <Text as="a" size="T300" href={APP_INFO.website} target="_blank" rel="noreferrer">
        About
      </Text>
      <Text
        as="a"
        size="T300"
        href={APP_INFO.releases}
        target="_blank"
        rel="noreferrer"
      >
        v{APP_INFO.version}
      </Text>
      <Text as="a" size="T300" href={APP_INFO.twitter} target="_blank" rel="noreferrer">
        Twitter
      </Text>
      <Text as="a" size="T300" href="https://matrix.org" target="_blank" rel="noreferrer">
        Powered by Matrix
      </Text>
    </Box>
  );
}
