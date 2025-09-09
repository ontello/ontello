import React, { useState, useEffect, useRef } from 'react';
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
  Spinner,
  Text,
  config,
  color,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { Address } from 'viem';
import { useTokensContext } from '@src/app/hooks/wallet/useTokens';
import { ContainerColor } from '@src/app/styles/ContainerColor.css';
import { TokenWithChain } from '../../../../../types/wallet/types';
import { GasToken } from '../../../../hooks/web3/types';
import { useAbstractAccount } from '../../../../hooks/web3/useAbstractAccount';
import { TokensListUi } from '../../../../components/wallet/tokens/TokensListUi';
import { stopPropagation } from '../../../../utils/keyboard';

interface FeeTokenSelectorProps {
  value: GasToken | null;
  onChange: (token: GasToken | null) => void;
  chainId: number;
  aaAddress: Address;
}

export function FeeTokenSelector({ value, onChange, chainId, aaAddress }: FeeTokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [gasTokens, setGasTokens] = useState<GasToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadedRef = useRef<boolean>(false);
  const { tokens } = useTokensContext();

  const { getSupportGasTokens } = useAbstractAccount(aaAddress, chainId);

  useEffect(() => {
    if (isOpen && !loadedRef.current) {
      const loadGasTokens = async () => {
        try {
          setIsLoading(true);
          loadedRef.current = true;
          const res = await getSupportGasTokens();
          setGasTokens(res);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to load gas tokens:', err);
          setGasTokens([]);
          loadedRef.current = false;
        } finally {
          setIsLoading(false);
        }
      };

      loadGasTokens();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Filter tokens by gasToken addresses
  const gasTokenAddresses = gasTokens.map((gasToken) => gasToken.token_hash.toLowerCase());
  const convertedTokens: TokenWithChain[] = tokens.filter((token) =>
    gasTokenAddresses.includes(token.tokenAddr?.toLowerCase() || '')
  );
  const handleCardClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    loadedRef.current = false;
  };

  const handleTokenSelect = (token: TokenWithChain) => {
    const gasToken = gasTokens.find((item) => item.token_hash === token.tokenAddr);
    onChange(gasToken || null);
    handleClose();
  };

  return (
    <>
      {/* Fee Token Selection Card */}
      <Box
        className={ContainerColor({ variant: 'SurfaceVariant' })}
        style={{
          padding: config.space.S200,
          borderRadius: config.radii.R300,
          cursor: 'pointer',
        }}
        onClick={handleCardClick}
        direction="Row"
        alignItems="Center"
        justifyContent="SpaceBetween"
        gap="300"
      >
        <Text size="T300" priority="300">
          Network fee
        </Text>
        <Box grow="Yes" alignItems="Center" gap="100" justifyContent="End">
          {value && (
            <Text size="T400" style={{ fontWeight: '500' }}>
              {value.token_name}
            </Text>
          )}
          <Icon src={Icons.ArrowDropRight} size="100" />
        </Box>
      </Box>

      {/* Fee Token Selection Modal */}
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
                      <Text size="H4">Select fee token</Text>
                    </Box>
                    <Box shrink="No">
                      <IconButton size="300" radii="300" onClick={handleClose}>
                        <Icon src={Icons.Cross} />
                      </IconButton>
                    </Box>
                  </Header>
                  <Scroll size="300" hideTrack>
                    <Box
                      style={{
                        padding: config.space.S400,
                        paddingRight: config.space.S200,
                      }}
                      direction="Column"
                    >
                      {isLoading && (
                        <Box justifyContent="Center" alignItems="Center" gap="200">
                          <Spinner size="200" />
                          <Text size="T300">Loading fee tokens...</Text>
                        </Box>
                      )}

                      {!isLoading && convertedTokens.length === 0 && (
                        <Box justifyContent="Center">
                          <Text size="T300" priority="300">
                            No fee tokens available
                          </Text>
                        </Box>
                      )}

                      {!isLoading && convertedTokens.length > 0 && (
                        <TokensListUi tokensList={convertedTokens} onSelect={handleTokenSelect} />
                      )}
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
