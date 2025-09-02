import React from 'react';
import { Text, Icon } from 'folds';
import Copy from '../static/icons/Copy';
import { copyToClipboard } from '../../util/common';

export function CopyIcon({
  text,
  onCopySuccess = () => {
    console.log('Copy success');
  },
  size = '14px',
  display = 'inline-block',
}: {
  text: string;
  onCopySuccess?: () => void;
  size?: string;
  display?: string;
}) {
  const handleCopy = () => {
    copyToClipboard(text);
    onCopySuccess();
  };

  return (
    <Text
      as="span"
      style={{
        cursor: 'pointer',
        display,
        fontSize: size,
        marginLeft: '4px',
      }}
      onClick={handleCopy}
    >
      <Icon size="Inherit" src={Copy} />
    </Text>
  );
}
