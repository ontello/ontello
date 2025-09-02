import React, { MouseEventHandler, useMemo, useState } from 'react';
import { as, Box, Chip, Icon, Icons, Menu, MenuItem, PopOut, RectCords, Text, config } from 'folds';
import FocusTrap from 'focus-trap-react';
import { stopPropagation } from '../../../../utils/keyboard';
import { ChainConfig } from '../../../../externalApis/models';
import { useChainConfig } from '../../../../hooks/web3/useChainConfig';
import { AllChainId } from '../const';

type NetworkSelectorProps = {
  selectedChainId: number;
  onSelect: (chainId: number) => void;
};

const NetworkSelector = as<'div', NetworkSelectorProps & { networks: ChainConfig[] }>(
  ({ networks, selectedChainId, onSelect, ...props }, ref) => (
    <Menu {...props} ref={ref}>
      <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
        {networks.map((network) => (
          <MenuItem
            key={network.chainId}
            size="300"
            variant={network.chainId === selectedChainId ? 'Primary' : 'Surface'}
            radii="300"
            onClick={() => onSelect(network.chainId)}
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

export function NetworkSelect({ selectedChainId, onSelect }: NetworkSelectorProps) {
  const [networkCords, setNetworkCords] = useState<RectCords>();
  const { availableChains } = useChainConfig();

  const allChains: ChainConfig[] = useMemo(
    () => [
      {
        chainId: AllChainId,
        chainName: 'All Networks',
        iconUrls: [],
        blockExplorerUrls: [],
      } as unknown as ChainConfig,
      ...availableChains,
    ],
    [availableChains]
  );

  const selected = useMemo(
    () => allChains.find((network) => network.chainId === selectedChainId),
    [allChains, selectedChainId]
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
        <Text size="B400" align="Center" style={{ minWidth: '80px' }}>
          {selected?.chainName}
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
              networks={allChains}
              selectedChainId={selectedChainId}
              onSelect={handleNetworkSelect}
            />
          </FocusTrap>
        }
      />
    </Box>
  );
}
