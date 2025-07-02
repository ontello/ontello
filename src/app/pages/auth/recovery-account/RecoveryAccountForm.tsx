import React, { FormEventHandler, useState } from 'react';
import { Box, Button, Input, Text, TextArea } from 'folds';

export function RecoveryKeyForm() {
  const [form, setForm] = useState({ username: '', recoveryKey: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    // TODO: 执行恢复操作
    // form.username, form.recoveryKey
  };

  return (
    <Box as="form" onSubmit={handleSubmit} direction="Inherit" gap="400">
      <Box direction="Column" gap="100">
        <Text as="label" size="L400" priority="300">
          Username
        </Text>
        <Input
          name="username"
          value={form.username}
          onChange={handleChange}
          variant="Background"
          size="500"
          outlined
          required
        />
      </Box>
      <Box direction="Column" gap="100">
        <Text as="label" size="L400" priority="300">
          Recovery Key
        </Text>
        <TextArea
          name="recoveryKey"
          value={form.recoveryKey}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, recoveryKey: (e.target as HTMLTextAreaElement).value }))
          }
          variant="Background"
          resize="None"
          required
          outlined
          style={{ minHeight: 80 }}
        />
      </Box>
      <span data-spacing-node />
      <Button
        type="submit"
        variant="Primary"
        size="500"
        disabled={!form.username || !form.recoveryKey}
      >
        <Text as="span" size="B500">
          Recover
        </Text>
      </Button>
    </Box>
  );
}
