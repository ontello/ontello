import type { Token, ChainConfig, Activity } from '../../app/externalApis/models';

export { Token, ChainConfig, Activity };

export interface TokenWithChain extends Token {
  chain?: ChainConfig;
}

export interface ActivityWithChain extends Activity {
  chain?: ChainConfig;
}

export interface ChainConfigWithTotalCurrency extends ChainConfig {
  totalCurrency?: string;
}

export enum WalletNavMode {
  Main = 'main',
  Send = 'send',
}
