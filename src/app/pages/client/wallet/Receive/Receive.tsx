import {
  Dialog,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Box,
  config,
  Header,
  Icon,
  IconButton,
  Icons,
  Text,
} from 'folds';
import React, { useMemo, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import { stopPropagation } from '../../../../utils/keyboard';
import { useFetchPasskeyList } from '../../../../hooks/useFetchPasskeyList';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { CopyIcon } from '../../../../components/CopyIcon';
import { ContainerColor } from '../../../../styles/ContainerColor.css';
import { QRCode } from 'react-qrcode-logo';
import { useTokensContext } from '../hooks/useTokens';
import { NetworkSelect } from '../components/NetworkSelect';
import { useChainConfig } from '../../../../hooks/web3/useChainConfig';

export function Receive({ onClose }: { onClose: () => void }) {
  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId!);
  const { tokensWithChain } = useTokensContext();
  const { availableChains } = useChainConfig();
  const [selectedNetworkChainId, setSelectedNetworkChainId] = useState<number>(
    availableChains[0]?.chainId
  );

  const supportedAssets = useMemo(
    () => tokensWithChain.filter((token) => token.chainId === selectedNetworkChainId),
    [tokensWithChain, selectedNetworkChainId]
  );

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: onClose,
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog variant="Surface">
            <Header
              style={{
                padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                borderBottomWidth: config.borderWidth.B300,
              }}
              variant="Surface"
              size="700"
            >
              <Box direction="Column" grow="Yes">
                <Text size="H3">Top up</Text>
              </Box>
              <IconButton size="300" onClick={onClose} radii="300">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>

            <Box
              direction="Column"
              gap="600"
              style={{ padding: `${config.space.S600} ${config.space.S400} ${config.space.S700}` }}
            >
              <Box alignItems="Center" justifyContent="Center">
                <QRCode
                  value="https://github.com/gcoro/react-qrcode-logo"
                  size={130}
                  logoImage={tokensWithChain[0].chain?.iconUrls?.[0]}
                  logoWidth={30}
                  logoHeight={30}
                />
              </Box>
              <Box
                direction="Row"
                gap="100"
                className={ContainerColor({ variant: 'SurfaceVariant' })}
                alignItems="Center"
                justifyContent="Center"
                style={{
                  padding: `${config.space.S200} ${config.space.S300}`,
                  borderRadius: config.radii.R400,
                }}
              >
                {/* TODO */}
                <Text size="T300" style={{ wordBreak: 'break-all' }}>
                  {passkeyData?.walletAddress || '0x0000000000000000000000000000000000000000'}
                </Text>
                <CopyIcon
                  text={passkeyData?.walletAddress || '0x0000000000000000000000000000000000000000'}
                />
              </Box>

              <Box direction="Row" gap="200" alignItems="Center" justifyContent="Start">
                <Box>
                  <Text size="T300">Network:</Text>
                </Box>
                <Box>
                  <NetworkSelect
                    selectedChainId={selectedNetworkChainId}
                    onSelect={setSelectedNetworkChainId}
                    hideAllNetwork
                  />
                </Box>
              </Box>

              <Box direction="Row" gap="200" alignItems="Center" justifyContent="Start" wrap="Wrap">
                <Box>
                  <Text size="T300">Supported assets:</Text>
                </Box>
                <Box direction="Row" gap="100" alignItems="Center" justifyContent="Start">
                  {supportedAssets.map((asset) => (
                    <img
                      key={asset.symbol}
                      src={asset.icon}
                      alt={asset.symbol}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Text size="T300">
                  Send{' '}
                  <Text
                    as="span"
                    size="T300"
                    className={ContainerColor({ variant: 'Primary' })}
                    style={{ padding: `0 ${config.space.S100}`, borderRadius: config.radii.R300 }}
                  >
                    only supported assets
                  </Text>{' '}
                  to this address. Other tokens may result in a loss of funds.
                </Text>
              </Box>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
