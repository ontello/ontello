import type { Token, ChainConfig, Activity } from '../../../externalApis/models';

export { Token, ChainConfig, Activity };

export interface TokenWithChain extends Token {
  chain?: ChainConfig;
}

export interface ActivityWithChain extends Activity {
  chain?: ChainConfig;
}

export enum WalletNavMode {
  Main = 'main',
  Send = 'send',
}

export enum SendNavMode {
  SendMain = 'sendMain',
  SendSelectAsset = 'sendSelectAsset',
  SendSelectToAddress = 'sendSelectToAddress',
}
