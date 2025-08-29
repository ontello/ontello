import { Token, Activity, ChainConfig } from '../../../../externalApis/models';
import usdtIcon from './testImgs/usdt.svg';
import bscIcon from './testImgs/bsc.svg';
import ovmIcon from './testImgs/OVM.svg';

export const mockChains: ChainConfig[] = [
  {
    chainId: 1,
    chainName: 'BSC',
    iconUrls: [bscIcon],
    blockExplorerUrls: ['https://etherscan.io'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      chainId: 1,
    } as unknown as Token,
    rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'],
    entrypointAddr: '0x0000000000000000000000000000000000000000',
    accountFactoryAddr: '0x0000000000000000000000000000000000000000',
    paymasterAddr: '0x0000000000000000000000000000000000000000',
    isMain: true,
    bundlerUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
  },
  {
    chainId: 2,
    chainName: 'OVM',
    iconUrls: [ovmIcon],
    blockExplorerUrls: ['https://etherscan.io'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      chainId: 1,
    } as unknown as Token,
    rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'],
    entrypointAddr: '0x0000000000000000000000000000000000000000',
    accountFactoryAddr: '0x0000000000000000000000000000000000000000',
    paymasterAddr: '0x0000000000000000000000000000000000000000',
    isMain: true,
    bundlerUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
  },
];

export const mockTokens: Token[] = [
  {
    name: 'USDT',
    symbol: 'USDT',
    decimals: 18,
    chainId: 1,
    icon: usdtIcon,
    balance: '100',
    currency: '12.11',
  },
  {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
    chainId: 2,
    icon: usdtIcon,
    balance: '66',
    currency: '66.11',
  },
  {
    name: 'BSC',
    symbol: 'BSC',
    decimals: 18,
    chainId: 2,
    icon: usdtIcon,
    balance: '100',
    currency: '12.11',
  },
  {
    name: 'FART',
    symbol: 'FART',
    decimals: 18,
    chainId: 1,
    icon: usdtIcon,
    balance: '100',
    currency: '12.11',
  },
  {
    name: 'FUCK',
    symbol: 'FUCK',
    decimals: 18,
    chainId: 2,
    icon: usdtIcon,
    balance: '100',
    currency: '12.11',
  },
];
