import React, { FormEventHandler, useEffect, useMemo, useState } from 'react';
import { Box, Button, Input, Text, TextArea, Spinner } from 'folds';
import { getPasskeyCredentials } from '@src/app/extendApis';
import { useAuthServer } from '@src/app/hooks/useAuthServer';
import { useAbstractAccount } from '@src/app/hooks/web3/useAbstractAccount';
import { Address } from 'viem';
import { createClient } from 'matrix-js-sdk';
import { useAutoDiscoveryInfo } from '@src/app/hooks/useAutoDiscoveryInfo';
import { useNavigate } from 'react-router-dom';
import { getLoginPath } from '../../pathUtils';
import { FieldError } from '../FiledError';

export function RecoveryKeyForm() {
  const [form, setForm] = useState({ username: '', recoveryKey: '' });
  const server = useAuthServer();

  const serverDiscovery = useAutoDiscoveryInfo();
  const baseUrl = serverDiscovery['m.homeserver'].base_url;
  const mx = useMemo(() => createClient({ baseUrl }), [baseUrl]);

  const [address, setAddress] = useState<Address>('0x');
  const [shouldRecover, setShouldRecover] = useState(false); // 控制恢复操作
  const { recoveryAccount } = useAbstractAccount(address);
  const navigate = useNavigate();

  const [errorData, setErrorData] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (evt) => {
    evt.preventDefault();
    try {
      const aaAddress = (await getPasskeyCredentials(mx, `@${form.username}:${server}`))
        .walletAddress;
      setAddress(aaAddress);
      setShouldRecover(true);
    } catch (error) {
      setErrorData('Recovery failed, please check the username and mnemonic.');
    }
  };
  useEffect(() => {
    if (address && shouldRecover) {
      recoveryAccount(form.recoveryKey, form.username)
        .then((receipt) => {
          const loginPath = getLoginPath(server);
          navigate(loginPath);
        })
        .catch((error) => {
          setErrorData('Recovery failed, please check the username and mnemonic.');
          console.error('Recovery failed:', error);
          setShouldRecover(false);
        });
    }
  }, [address, shouldRecover, form.recoveryKey, form.username, recoveryAccount, navigate, server]);

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
          Wallet Recovery Phrase
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
      {errorData && (
        <FieldError message="Recovery failed, please check the username and mnemonic." />
      )}
      <span data-spacing-node />
      <Button
        type="submit"
        variant="Primary"
        size="500"
        disabled={!form.username || !form.recoveryKey || shouldRecover}
      >
        {shouldRecover && <Spinner />}
        {/* <Spinner /> */}
        <Text as="span" size="B500">
          Recover
        </Text>
      </Button>
    </Box>
  );
}
