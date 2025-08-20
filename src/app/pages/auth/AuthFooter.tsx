import React from 'react';
import { Box, Text } from 'folds';
import cons from '@src/client/state/cons';
import * as css from './styles.css';

export function AuthFooter() {
  return (
    <Box className={css.AuthFooter} justifyContent="Center" gap="400" wrap="Wrap">
      <Text as="a" size="T300" href="https://ontello.app" target="_blank" rel="noreferrer">
        About
      </Text>
      <Text
        as="a"
        size="T300"
        href="https://github.com/ontello/ontello/releases"
        target="_blank"
        rel="noreferrer"
      >
        v{cons.version}
      </Text>
      <Text as="a" size="T300" href="https://twitter.com/ontello" target="_blank" rel="noreferrer">
        Twitter
      </Text>
      <Text as="a" size="T300" href="https://matrix.org" target="_blank" rel="noreferrer">
        Powered by Matrix
      </Text>
    </Box>
  );
}
