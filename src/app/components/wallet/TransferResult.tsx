import React, { useMemo } from 'react';
import { Box, Text, Button, config } from 'folds';
import { OntelloDialog } from '../ontello/OntelloDialog';

export enum TransferResultEnum {
  Submitted = 'Submitted',
  Success = 'Success',
  Failed = 'Failed',
}

export function TransferResult({
  type,
  onClose,
  viewActivity,
}: {
  type: TransferResultEnum;
  onClose: () => void;
  viewActivity: () => void;
}) {
  const emoji = useMemo(() => {
    if (type === TransferResultEnum.Submitted) {
      return '✅';
    }
    if (type === TransferResultEnum.Success) {
      return '🎉';
    }
    return '😢';
  }, [type]);

  const title = useMemo(() => {
    if (type === TransferResultEnum.Submitted) {
      return 'Transfer has been submitted';
    }
    if (type === TransferResultEnum.Success) {
      return 'Transfer successful';
    }
    return 'Transfer unsuccessful';
  }, [type]);

  return (
    <OntelloDialog onClose={onClose} title={type}>
      <Box
        direction="Column"
        alignItems="Center"
        gap="700"
        style={{ padding: `${config.space.S600} ${config.space.S600}` }}
      >
        <Text size="H1">{emoji}</Text>
        <Text size="H4">{title}</Text>
        <Button size="400" onClick={viewActivity} style={{ width: '100%' }}>
          View Activity
        </Button>
      </Box>
    </OntelloDialog>
  );
}
