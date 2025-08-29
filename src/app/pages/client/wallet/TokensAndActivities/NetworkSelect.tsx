import React, { MouseEventHandler, useState } from 'react';
import { as, Box, Chip, Icon, Icons, Menu, MenuItem, PopOut, RectCords, Text, config } from 'folds';
import FocusTrap from 'focus-trap-react';
import { stopPropagation } from '../../../../utils/keyboard';
import { ChainConfig } from '../../../../externalApis/models';

type NetworkSelectorProps = {
  networks: ChainConfig[];
  selected: ChainConfig;
  onSelect: (network: ChainConfig) => void;
};

const NetworkSelector = as<'div', NetworkSelectorProps>(
  ({ networks, selected, onSelect, ...props }, ref) => (
    <Menu {...props} ref={ref}>
      <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
        {networks.map((network) => (
          <MenuItem
            key={network.chainId}
            size="300"
            variant={network.chainId === selected.chainId ? 'Primary' : 'Surface'}
            radii="300"
            onClick={() => onSelect(network)}
          >
            <Text size="T300" align="Center">
              {network.chainName}
            </Text>
          </MenuItem>
        ))}
      </Box>
    </Menu>
  )
);

export function NetworkSelect({ networks, selected, onSelect }: NetworkSelectorProps) {
  const [networkCords, setNetworkCords] = useState<RectCords>();

  const handleSelectNetwork: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const rect = evt.currentTarget.getBoundingClientRect();
    setNetworkCords(rect);
  };

  const handleNetworkSelect = (network: ChainConfig) => {
    onSelect(network);
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
        <Text size="B400" align="Center" style={{ minWidth: '80px' }}>
          {selected.chainName}
        </Text>
      </Chip>
      <PopOut
        anchor={networkCords}
        offset={5}
        position="Bottom"
        align="End"
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
              selected={selected}
              onSelect={handleNetworkSelect}
            />
          </FocusTrap>
        }
      />
    </Box>
  );
}
