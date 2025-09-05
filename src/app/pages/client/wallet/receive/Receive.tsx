import { Box, config, Text } from 'folds';
import React, { useMemo, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { useFetchPasskeyList } from '../../../../hooks/useFetchPasskeyList';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { CopyIcon } from '../../../../components/CopyIcon';
import { ContainerColor } from '../../../../styles/ContainerColor.css';
import { useTokensContext } from '../../../../hooks/wallet/useTokens';
import { NetworkSelect } from '../../../../components/wallet/NetworkSelect';
import { useChainConfig } from '../../../../hooks/web3/useChainConfig';
import { OntelloDialog } from '../../../../components/ontello/OntelloDialog';

export function Receive({ onClose }: { onClose: () => void }) {
  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId!);
  const { tokens } = useTokensContext();
  const { availableChains } = useChainConfig();
  const [selectedNetworkChainId, setSelectedNetworkChainId] = useState<number>(
    availableChains[0]?.chainId
  );

  const supportedAssets = useMemo(
    () => tokens.filter((token) => token.chainId === selectedNetworkChainId),
    [tokens, selectedNetworkChainId]
  );

  const selectedChain = useMemo(
    () => availableChains.find((chain) => chain.chainId === selectedNetworkChainId),
    [availableChains, selectedNetworkChainId]
  );

  return (
    <OntelloDialog onClose={onClose} title="Top up">
      <Box
        direction="Column"
        gap="600"
        style={{ padding: `${config.space.S600} ${config.space.S400} ${config.space.S700}` }}
      >
        <Box alignItems="Center" justifyContent="Center">
          <QRCode
            value={passkeyData?.walletAddress || ''}
            size={130}
            logoImage={selectedChain?.iconUrls?.[0]}
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
          <Text size="T300" style={{ wordBreak: 'break-all' }}>
            {passkeyData?.walletAddress || ''}
          </Text>
          <CopyIcon text={passkeyData?.walletAddress || ''} />
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
                key={asset.name + asset.tokenAddr}
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
    </OntelloDialog>
  );
}
