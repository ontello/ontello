import React, { FormEventHandler, useEffect, useMemo, useState } from 'react';
import { Box, Button, Input, Text, TextArea, Spinner } from 'folds';
import { getPasskeyCredentials } from '@src/app/extendApis';
import { useAuthServer } from '@src/app/hooks/useAuthServer';
import { fromBase64Url } from '@src/app/utils/passkey';
import { useAbstractAccount } from '@src/app/hooks/web3/useAbstractAccount';
import { Address, toHex } from 'viem';
import { createClient } from 'matrix-js-sdk';
import { useAutoDiscoveryInfo } from '@src/app/hooks/useAutoDiscoveryInfo';
import { RecoverAccount } from '@src/app/components/wallet/multi-chain/RecoverAccount';
import { useNavigate } from 'react-router-dom';
import { mnemonicToAccount } from 'viem/accounts';
import { getLoginPath } from '../../pathUtils';
import { FieldError } from '../FiledError';

export function RecoveryKeyForm() {
  const [form, setForm] = useState({ username: '', recoveryKey: '' });
  const [showRecoverAccount, setShowRecoverAccount] = useState(false);
  const server = useAuthServer();

  const serverDiscovery = useAutoDiscoveryInfo();
  const baseUrl = serverDiscovery['m.homeserver'].base_url;
  const mx = useMemo(() => createClient({ baseUrl }), [baseUrl]);
  const loginPath = getLoginPath(server);

  const [address, setAddress] = useState<Address>('0x');
  // const [shouldRecover, setShouldRecover] = useState(false); // 控制恢复操作
  // const { recoveryAccount } = useAbstractAccount(address);
  const navigate = useNavigate();

  const [errorData, setErrorData] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const recoverSuccess = () => {
    setShowRecoverAccount(false);
    navigate(loginPath);
  };

  const base64ToHex = (base64: string) => toHex(new Uint8Array(fromBase64Url(base64)));

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (evt) => {
    evt.preventDefault();
    try {
      setErrorData(null);
      const passkeyCredentials = await getPasskeyCredentials(
        mx,
        `@${form.username.trim().toLowerCase()}:${server}`
      );
      const aaAddress = passkeyCredentials.walletAddress;
      setAddress(aaAddress);
      const account = mnemonicToAccount(form.recoveryKey);
      // After converting publicKey from base64Url to hex, take the last 40 characters
      // and compare with the last 40 characters of account.address. Return true if they match.
      // Note: publicKey is stored in base64Url format.
      const recoverPhraseIsMatchUsername = passkeyCredentials.credentials.some((credential) => {
        const hexPk = base64ToHex(credential.publicKey);
        const pkAddress = hexPk.slice(-40);
        return pkAddress.toLowerCase() === account.address.replace('0x', '').toLowerCase();
      });
      if (!recoverPhraseIsMatchUsername) {
        setErrorData('Recovery failed, please check the username and mnemonic~');
        return;
      }
      setShowRecoverAccount(true);
    } catch (error) {
      setErrorData('Recovery failed, please check the username and mnemonic.');
    }
  };
  // useEffect(() => {
  //   if (address && shouldRecover) {
  // recoveryAccount(form.recoveryKey, form.username)
  //   .then((receipt) => {
  //     const loginPath = getLoginPath(server);
  //     navigate(loginPath);
  //   })
  //   .catch((error) => {
  //     setErrorData('Recovery failed, please check the username and mnemonic.');
  //     console.error('Recovery failed:', error);
  //     setShouldRecover(false);
  //   });
  //   }
  // }, [address, form.recoveryKey, shouldRecover]);

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
          style={{ minHeight: 80, paddingRight: 10 }}
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
        disabled={!form.username || !form.recoveryKey}
      >
        {/* {shouldRecover && <Spinner />} */}
        <Text as="span" size="B500">
          Recover
        </Text>
      </Button>
      {showRecoverAccount && (
        <RecoverAccount
          username={form.username.trim().toLowerCase()}
          aaAddress={address}
          recoveryPhrase={form.recoveryKey}
          onSuccess={() => recoverSuccess()}
          onClose={() => setShowRecoverAccount(false)}
        />
      )}
    </Box>
  );
}
