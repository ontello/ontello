import React, { MouseEventHandler, useMemo, useState } from 'react';
import { as, Box, Chip, Icon, Icons, Menu, MenuItem, PopOut, RectCords, Text, config } from 'folds';
import FocusTrap from 'focus-trap-react';
import { stopPropagation } from '../../utils/keyboard';
import { ChainConfigWithTotalCurrency } from '../../../types/wallet/types';

export type NetworkSelectorProps = {
  selectedChainId: number;
  onSelect: (chainId: number) => void;
  showTotalCurrency?: boolean;
  networks: ChainConfigWithTotalCurrency[];
};

const NetworkSelector = as<'div', NetworkSelectorProps>(
  ({ networks, selectedChainId, onSelect, showTotalCurrency, ...props }, ref) => (
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
  )
);

export function NetworkSelectUi({
  selectedChainId,
  onSelect,
  showTotalCurrency = false,
  networks,
}: NetworkSelectorProps) {
  const [networkCords, setNetworkCords] = useState<RectCords>();

  const selected = useMemo(
    () => networks.find((network) => network.chainId === selectedChainId),
    [networks, selectedChainId]
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
              networks={networks}
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
