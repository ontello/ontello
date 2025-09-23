import React, { MouseEventHandler, useMemo, useState } from 'react';
import { as, Box, Chip, Icon, Icons, Menu, MenuItem, PopOut, RectCords, Text, config } from 'folds';
import FocusTrap from 'focus-trap-react';
import { stopPropagation } from '../../utils/keyboard';
import { useChainConfig } from '../../hooks/web3/useChainConfig';
import { AllChainId } from '../../../types/wallet/const';
import { useTokensContext } from '../../hooks/wallet/useTokens';
import { ChainConfigWithTotalCurrency } from '../../../types/wallet/types';

type NetworkSelectorProps = {
  selectedChainId: number;
  onSelect: (chainId: number) => void;
  hideAllNetwork?: boolean;
  showTotalCurrency?: boolean;
};

const NetworkSelector = as<
  'div',
  NetworkSelectorProps & { networks: ChainConfigWithTotalCurrency[] }
>(({ networks, selectedChainId, onSelect, showTotalCurrency, ...props }, ref) => (
  <Menu {...props} ref={ref}>
    <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
      {networks.map((network) => (
        <MenuItem
          key={network.chainId}
          size={showTotalCurrency ? '400' : '300'}
          variant={network.chainId === selectedChainId ? 'Primary' : 'Surface'}
          radii="300"
          onClick={() => onSelect(network.chainId)}
        >
          <Box direction="Row" gap="100" alignItems="Center" style={{ minWidth: '80px' }}>
            {network.iconUrls[0] && (
              <img
                src={network.iconUrls[0]}
                alt={network.chainNameView}
                style={{ width: '18px', height: '18px', borderRadius: '50%', overflow: 'hidden' }}
              />
            )}
            <Box direction="Column" gap="100" alignItems="Start">
              <Text size="T300" align="Left" style={{ lineHeight: '14px', height: '14px' }}>
                {network.chainNameView}
              </Text>
              {network.totalCurrency && (
                <Text size="T200" align="Left" style={{ lineHeight: '12px', height: '12px' }}>
                  ${network.totalCurrency}
                </Text>
              )}
            </Box>
          </Box>
        </MenuItem>
      ))}
    </Box>
  </Menu>
));

export function NetworkSelect({
  selectedChainId,
  onSelect,
  hideAllNetwork = false,
  showTotalCurrency = false,
}: NetworkSelectorProps) {
  const [networkCords, setNetworkCords] = useState<RectCords>();
  const { availableChains } = useChainConfig();
  const { tokens } = useTokensContext();

  const allChainsWithTotalCurrency: ChainConfigWithTotalCurrency[] = useMemo(
    () => [
      ...(hideAllNetwork
        ? []
        : [
            {
              chainId: AllChainId,
              chainName: 'All Networks',
              chainNameView: 'All Networks',
              iconUrls: [],
              blockExplorerUrls: [],
            } as unknown as ChainConfigWithTotalCurrency,
          ]),
      ...availableChains
        .map((chain) => ({
          ...chain,
          totalCurrency: showTotalCurrency
            ? tokens
                .filter((token) => token.chainId === chain.chainId)
                .reduce((acc, token) => acc + Number(token.currency || 0), 0)
                .toFixed(2)
            : undefined,
        }))
        .sort((a, b) => Number(b.totalCurrency || 0) - Number(a.totalCurrency || 0)),
    ],
    [availableChains, hideAllNetwork, tokens, showTotalCurrency]
  );

  const selected = useMemo(
    () => allChainsWithTotalCurrency.find((network) => network.chainId === selectedChainId),
    [allChainsWithTotalCurrency, selectedChainId]
  );

  const handleSelectNetwork: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const rect = evt.currentTarget.getBoundingClientRect();
    setNetworkCords(rect);
  };

  const handleNetworkSelect = (chainId: number) => {
    onSelect(chainId);
    setNetworkCords(undefined);
  };

  return (
    <Box>
      <Chip
        variant="SurfaceVariant"
        outlined={false}
        radii="Pill"
        after={<Icon size="200" src={Icons.ChevronBottom} />}
        onClick={handleSelectNetwork}
        style={{ position: 'relative' }}
      >
        <Box
          direction="Row"
          gap="100"
          alignItems="Center"
          justifyContent="Start"
          style={{ minWidth: '80px' }}
        >
          {selected?.iconUrls[0] && (
            <img
              src={selected.iconUrls[0]}
              alt={selected.chainNameView}
              style={{ width: '18px', height: '18px', borderRadius: '50%', overflow: 'hidden' }}
            />
          )}
          <Text size="B400" align="Center">
            {selected?.chainNameView}
          </Text>
        </Box>
      </Chip>
      <PopOut
        anchor={networkCords}
        offset={5}
        position="Bottom"
        align="Start"
        content={
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              onDeactivate: () => setNetworkCords(undefined),
              clickOutsideDeactivates: true,
              isKeyForward: (evt: KeyboardEvent) =>
                evt.key === 'ArrowDown' || evt.key === 'ArrowRight',
              isKeyBackward: (evt: KeyboardEvent) =>
                evt.key === 'ArrowUp' || evt.key === 'ArrowLeft',
              escapeDeactivates: stopPropagation,
            }}
          >
            <NetworkSelector
              networks={allChainsWithTotalCurrency}
              selectedChainId={selectedChainId}
              onSelect={handleNetworkSelect}
              showTotalCurrency={showTotalCurrency}
            />
          </FocusTrap>
        }
      />
    </Box>
  );
}
