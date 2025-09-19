import React, { useState } from 'react';
import { Text, Icon, Icons } from 'folds';
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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(text);
    setCopied(true);
    onCopySuccess();

    setTimeout(() => {
      setCopied(false);
    }, 1000);
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
      <Icon size="Inherit" src={copied ? Icons.Check : Copy} />
    </Text>
  );
}
