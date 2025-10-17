import { Box, config, Text } from 'folds';
import React, { useMemo, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { ChainConfig, Token } from '@src/app/externalApis';
import { CopyIcon } from '../CopyIcon';
import { ContainerColor } from '../../styles/ContainerColor.css';
import { NetworkSelectUi } from './NetworkSelectUi';
import { OntelloDialog } from '../ontello/OntelloDialog';

export interface ReceiveChainInfo extends ChainConfig {
  address: string;
  supportedAssets: Token[];
  description?: string;
}

export interface ReceiveUiState {
  selectedNetworkChainId: number;
}

export interface ReceiveUiProps {
  onClose: () => void;
  chainsWithOtherInfo: ReceiveChainInfo[];
}

export function ReceiveUi({ onClose, chainsWithOtherInfo }: ReceiveUiProps) {
  const [selectedNetworkChainId, setSelectedNetworkChainId] = useState<number>(
    chainsWithOtherInfo[0]?.chainId
  );

  const selectedChain = useMemo(
    () => chainsWithOtherInfo.find((chain) => chain.chainId === selectedNetworkChainId),
    [chainsWithOtherInfo, selectedNetworkChainId]
  );

  return (
    <OntelloDialog onClose={onClose} title="Top up">
      <Box
        direction="Column"
        gap="600"
        style={{ padding: `${config.space.S600} ${config.space.S400} ${config.space.S700}` }}
      >
        <Box alignItems="Center" justifyContent="Center">
          {selectedChain && (
            <QRCode
              value={selectedChain?.address || ''}
              size={130}
              logoImage={selectedChain?.iconUrls?.[0]}
              logoWidth={30}
              logoHeight={30}
            />
          )}
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
            {selectedChain?.address || ''}
          </Text>
          <CopyIcon text={selectedChain?.address || ''} />
        </Box>

        {selectedChain?.description && (
          <Box>
            <Text size="T300">{selectedChain.description}</Text>
          </Box>
        )}

        <Box direction="Row" gap="200" alignItems="Center" justifyContent="Start">
          <Box>
            <Text size="T300">Network:</Text>
          </Box>
          <Box>
            <NetworkSelectUi
              selectedChainId={selectedNetworkChainId}
              onSelect={setSelectedNetworkChainId}
              networks={chainsWithOtherInfo}
            />
          </Box>
        </Box>

        <Box direction="Row" gap="200" alignItems="Center" justifyContent="Start" wrap="Wrap">
          <Box>
            <Text size="T300">Supported assets:</Text>
          </Box>
          <Box direction="Row" gap="100" alignItems="Center" justifyContent="Start">
            {selectedChain?.supportedAssets.map((asset) => (
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
