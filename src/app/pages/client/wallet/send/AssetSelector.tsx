import React, { useState } from 'react';
import {
  Box,
  Header,
  Icon,
  IconButton,
  Icons,
  Modal,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Scroll,
  Text,
  config,
  color,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { ContainerColor } from '../../../../styles/ContainerColor.css';
import { TokenWithChain } from '../../../../../types/wallet/types';
import { useTokensContext } from '../../../../hooks/wallet/useTokens';
import { TokensListUi } from '../../../../components/wallet/tokens/TokensListUi';
import { TokenItem } from '../../../../components/wallet/tokens/TokenItem';
import { stopPropagation } from '../../../../utils/keyboard';
import { NetworkSelect } from '../../../../components/wallet/NetworkSelect';
import { AllChainId } from '../../../../../types/wallet/const';

interface AssetSelectorProps {
  value: TokenWithChain | null;
  onChange: (token: TokenWithChain) => void;
}

export function AssetSelector({ value, onChange }: AssetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<number>(AllChainId);
  const { tokens } = useTokensContext();

  const filteredTokens =
    selectedChainId === AllChainId
      ? tokens
      : tokens.filter((token) => token.chainId === selectedChainId);

  const handleTokenSelect = (token: TokenWithChain) => {
    onChange(token);
    setIsOpen(false);
  };

  const handleCardClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Asset Selection Card */}
      {value && (
        <Box
          className={ContainerColor({ variant: 'SurfaceVariant' })}
          style={{
            borderRadius: config.radii.R300,
            padding: config.space.S300,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={handleCardClick}
          direction="Column"
          gap="200"
        >
          <Text size="T300" priority="300" style={{ marginLeft: config.space.S100 }}>
            Send
          </Text>
          <Box
            style={{
              height: '1px',
              backgroundColor: color.Surface.ContainerLine,
              width: '100%',
            }}
          />
          <Box direction="Row" alignItems="Center" gap="200">
            <Box grow="Yes">
              <TokenItem token={value} onSelect={null} showHoverBg={false} />
            </Box>
            <Icon src={Icons.ArrowDropRight} size="100" />
          </Box>
        </Box>
      )}

      {/* Asset Selection Modal */}
      {isOpen && (
        <Overlay open backdrop={<OverlayBackdrop />}>
          <OverlayCenter>
            <FocusTrap
              focusTrapOptions={{
                initialFocus: false,
                clickOutsideDeactivates: true,
                onDeactivate: handleClose,
                escapeDeactivates: stopPropagation,
              }}
            >
              <Modal size="400" flexHeight>
                <Box direction="Column">
                  <Header
                    size="500"
                    style={{
                      padding: config.space.S200,
                      paddingLeft: config.space.S400,
                      borderBottomWidth: config.borderWidth.B300,
                    }}
                  >
                    <Box grow="Yes">
                      <Text size="H4">Select asset</Text>
                    </Box>
                    <Box shrink="No">
                      <IconButton size="300" radii="300" onClick={handleClose}>
                        <Icon src={Icons.Cross} />
                      </IconButton>
                    </Box>
                  </Header>

                  {/* Chain Filter */}
                  <Box
                    style={{
                      padding: config.space.S400,
                      paddingBottom: config.space.S200,
                    }}
                  >
                    <NetworkSelect
                      selectedChainId={selectedChainId}
                      onSelect={setSelectedChainId}
                      hideAllNetwork={false}
                      showTotalCurrency={false}
                    />
                  </Box>
                  <Scroll size="300" hideTrack>
                    <Box
                      style={{
                        padding: config.space.S400,
                        paddingRight: config.space.S200,
                      }}
                      direction="Column"
                    >
                      <TokensListUi tokensList={filteredTokens} onSelect={handleTokenSelect} />
                    </Box>
                  </Scroll>
                </Box>
              </Modal>
            </FocusTrap>
          </OverlayCenter>
        </Overlay>
      )}
    </>
  );
}
