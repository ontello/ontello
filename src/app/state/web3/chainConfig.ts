import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { ChainConfig } from '../../externalApis';

export interface ChainConfigResponse {
  chains: ChainConfig[];
  lastUpdated: number;
}

export const chainConfigAtom = atomWithStorage<ChainConfigResponse | null>(
  'ontello-chain-config',
  null
);

export const isLoadingChainConfigAtom = atom<boolean>(false);

export const chainConfigErrorAtom = atom<string | null>(null);

export const availableChainsAtom = atom((get) => {
  const config = get(chainConfigAtom);
  return config?.chains || [];
});

