import React, { useState } from 'react';
import { Box, Text, Button, Checkbox, config, color } from 'folds';
import { ContainerColor } from '@src/app/styles/ContainerColor.css';

export function RecoveryPhraseStep1({ phrase, onNext }: { phrase: string; onNext: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <Box
      direction="Column"
      gap="600"
      style={{ padding: `${config.space.S600} ${config.space.S400} ${config.space.S700}` }}
    >
      <Box
        direction="Row"
        gap="200"
        alignItems="Center"
        justifyContent="Center"
        style={{ width: '100%' }}
      >
        <Text
          size="T300"
          className={ContainerColor({ variant: 'Primary' })}
          style={{
            width: '24px',
            height: '24px',
            textAlign: 'center',
            lineHeight: '24px',
            borderRadius: '50%',
          }}
        >
          1
        </Text>
      </Box>

      <Box>
        <Text size="T300">Create recovery phrase, save it in a safe place.</Text>
      </Box>

      <Box
        direction="Column"
        gap="200"
        style={{
          padding: config.space.S400,
          borderRadius: config.radii.R400,
          border: `1px solid ${color.SurfaceVariant.ContainerLine}`,
        }}
      >
        <Text size="H6">{phrase}</Text>
      </Box>

      <Box direction="Row" gap="400" alignItems="Center">
        {/* @ts-expect-error - folds Checkbox component uses different prop names */}
        <Checkbox checked={checked} onChange={() => setChecked(!checked)} size="50" />
        <Text size="T300">I&apos;ve saved this phrase in a safe place.</Text>
      </Box>
      <Button onClick={onNext} disabled={!checked}>
        Add
      </Button>
    </Box>
  );
}
