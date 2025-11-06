import React, { useState } from 'react';
import { Text, Icon, Icons } from 'folds';
import Copy from '../static/icons/Copy';
import { copyIcon } from './CopyIcon.css';
import { copyToClipboard } from '../utils/dom';

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
      className={copyIcon}
      style={{
        display,
        fontSize: size,
      }}
      onClick={handleCopy}
    >
      <Icon size="Inherit" src={copied ? Icons.Check : Copy} />
    </Text>
  );
}
