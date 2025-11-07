import React, { FormEventHandler, MouseEventHandler, useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  Header,
  Icon,
  IconButton,
  Icons,
  Input,
  Menu,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  PopOut,
  RectCords,
  Spinner,
  Text,
  config,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { Link } from 'react-router-dom';
import { createClient, MatrixError } from 'matrix-js-sdk';
import { getPasskeyCredentials } from '@src/app/extendApis';
import { useAutoDiscoveryInfo } from '../../../hooks/useAutoDiscoveryInfo';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { useAuthServer } from '../../../hooks/useAuthServer';
import { CustomLoginResponse, LoginError, login, useLoginComplete } from './loginUtil';
import { FieldError } from '../FiledError';
import { getRecoveryAccountPath } from '../../pathUtils';
import { stopPropagation } from '../../../utils/keyboard';
import { loginWithPasskey } from '../../../utils/passkey';

function UsernameHint({ server }: { server: string }) {
  const [anchor, setAnchor] = useState<RectCords>();

  const handleOpenMenu: MouseEventHandler<HTMLElement> = (evt) => {
    setAnchor(evt.currentTarget.getBoundingClientRect());
  };
  return (
    <PopOut
      anchor={anchor}
      position="Top"
      align="End"
      content={
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: () => setAnchor(undefined),
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Menu>
            <Header size="300" style={{ padding: `0 ${config.space.S200}` }}>
              <Text size="L400">Hint</Text>
            </Header>
            <Box
              style={{ padding: config.space.S200, paddingTop: 0 }}
              direction="Column"
              tabIndex={0}
              gap="100"
            >
              <Text size="T300">
                <Text as="span" size="Inherit" priority="300">
                  Username:
                </Text>{' '}
                user123
              </Text>
              {/* <Text size="T300">
                <Text as="span" size="Inherit" priority="300">
                  Matrix ID:
                </Text>
                {` @user123:${server}`}
              </Text>
              <Text size="T300">
                <Text as="span" size="Inherit" priority="300">
                  Email:
                </Text>
                {` johndoe@${server}`}
              </Text> */}
            </Box>
          </Menu>
        </FocusTrap>
      }
    >
      <IconButton
        tabIndex={-1}
        onClick={handleOpenMenu}
        type="button"
        variant="Background"
        size="300"
        radii="300"
        aria-pressed={!!anchor}
      >
        <Icon style={{ opacity: config.opacity.P300 }} size="100" src={Icons.Info} />
      </IconButton>
    </PopOut>
  );
}

type PasswordLoginFormProps = {
  defaultUsername?: string;
  defaultEmail?: string;
};
export function PasswordLoginForm({ defaultUsername, defaultEmail }: PasswordLoginFormProps) {
  const server = useAuthServer();

  const serverDiscovery = useAutoDiscoveryInfo();
  const baseUrl = serverDiscovery['m.homeserver'].base_url;
  const mx = useMemo(() => createClient({ baseUrl }), [baseUrl]);

  const [loginState, startLogin] = useAsyncCallback<
    CustomLoginResponse,
    MatrixError,
    Parameters<typeof login>
  >(useCallback(login, []));

  useLoginComplete(loginState.status === AsyncStatus.Success ? loginState.data : undefined);

  const [passkeyState, startPasskeyLogin] = useAsyncCallback<
    { password: string; publicKey: string },
    Error,
    Parameters<typeof loginWithPasskey>
  >(useCallback(loginWithPasskey, []));

  const handleUsernameLogin = async (
    username: string,
    password: string,
    publicKey: string,
    aaAddress: string
  ) => {
    await startLogin(
      baseUrl,
      {
        type: 'm.login.password',
        identifier: {
          type: 'm.id.user',
          user: username,
        },
        password,
        initial_device_display_name: 'Ontello Web',
      },
      publicKey,
      aaAddress
    );
  };

  // const handleMxIdLogin = async (mxId: string, password: string) => {
  //   const mxIdServer = getMxIdServer(mxId);
  //   const mxIdUsername = getMxIdLocalPart(mxId);
  //   if (!mxIdServer || !mxIdUsername) return;

  //   const getBaseUrl = factoryGetBaseUrl(clientConfig, mxIdServer);

  //   startLogin(getBaseUrl, {
  //     type: 'm.login.password',
  //     identifier: {
  //       type: 'm.id.user',
  //       user: mxIdUsername,
  //     },
  //     password,
  //     initial_device_display_name: 'Ontello Web',
  //   });
  // };
  // const handleEmailLogin = (email: string, password: string) => {
  //   startLogin(baseUrl, {
  //     type: 'm.login.password',
  //     identifier: {
  //       type: 'm.id.thirdparty',
  //       medium: 'email',
  //       address: email,
  //     },
  //     password,
  //     initial_device_display_name: 'Ontello Web',
  //   });
  // };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (evt) => {
    evt.preventDefault();
    const { usernameInput } = evt.target as HTMLFormElement & {
      usernameInput: HTMLInputElement;
      // passwordInput: HTMLInputElement;
    };

    const username = usernameInput.value.trim();
    // const password = passwordInput.value;
    if (!username) {
      usernameInput.focus();
      return;
    }
    // if (!password) {
    //   passwordInput.focus();
    //   return;
    // }
    let password: string;
    let publicKey: string;

    try {
      const res = await startPasskeyLogin(username, mx, server);
      password = res.password;
      publicKey = res.publicKey;
    } catch (error) {
      return;
    }

    // if (isUserId(username)) {
    //   handleMxIdLogin(username, password);
    //   return;
    // }
    // if (EMAIL_REGEX.test(username)) {
    //   handleEmailLogin(username, password);
    //   return;
    // }
    const aaAddress = (await getPasskeyCredentials(mx, `@${username}:${server}`)).walletAddress;
    await handleUsernameLogin(username, password, publicKey, aaAddress);
  };

  return (
    <Box as="form" onSubmit={handleSubmit} direction="Inherit" gap="400">
      <Box direction="Column" gap="100">
        <Text as="label" size="L400" priority="300">
          Username
        </Text>
        <Input
          defaultValue={defaultUsername ?? defaultEmail}
          style={{ paddingRight: config.space.S300 }}
          name="usernameInput"
          variant="Background"
          size="500"
          required
          outlined
          after={<UsernameHint server={server} />}
        />
        {loginState.status === AsyncStatus.Error && (
          <>
            {loginState.error.errcode === LoginError.ServerNotAllowed && (
              <FieldError message="Login with custom server not allowed by your client instance." />
            )}
            {loginState.error.errcode === LoginError.InvalidServer && (
              <FieldError message="Failed to find your Matrix ID server." />
            )}
          </>
        )}
      </Box>
      <Box direction="Column" gap="100">
        {/* <Text as="label" size="L400" priority="300">
          Password
        </Text>
         <PasswordInput name="passwordInput" variant="Background" size="500" outlined required /> */}
        <Box alignItems="Start" justifyContent="SpaceBetween" gap="200">
          {loginState.status === AsyncStatus.Error && (
            <>
              {loginState.error.errcode === LoginError.Forbidden && (
                <FieldError message="Invalid Username or Password." />
              )}
              {loginState.error.errcode === LoginError.UserDeactivated && (
                <FieldError message="This account has been deactivated." />
              )}
              {loginState.error.errcode === LoginError.InvalidRequest && (
                <FieldError message="Failed to login. Part of your request data is invalid." />
              )}
              {loginState.error.errcode === LoginError.RateLimited && (
                <FieldError message="Failed to login. Your login request has been rate-limited by server, Please try after some time." />
              )}
              {loginState.error.errcode === LoginError.Unknown && (
                <FieldError message="Failed to login. Unknown reason." />
              )}
            </>
          )}
          <Box grow="Yes" shrink="No" justifyContent="End">
            <Text as="span" size="T200" priority="400" align="Right">
              {/* <Link to={getResetPasswordPath(server)}>Forget Password?</Link> */}
              <Link to={getRecoveryAccountPath(server)}>Recovery Account</Link>
            </Text>
          </Box>
        </Box>
      </Box>
      <Button type="submit" variant="Primary" size="500">
        <Text as="span" size="B500">
          Login
        </Text>
      </Button>
      {passkeyState.status === AsyncStatus.Error && (
        <FieldError message={passkeyState.error.message} />
      )}

      <Overlay
        open={
          loginState.status === AsyncStatus.Loading || loginState.status === AsyncStatus.Success
        }
        backdrop={<OverlayBackdrop />}
      >
        <OverlayCenter>
          <Spinner variant="Secondary" size="600" />
        </OverlayCenter>
      </Overlay>
    </Box>
  );
}
