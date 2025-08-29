import { Token, ChainConfig } from '../../../externalApis/models';

export interface TokenWithChain extends Token {
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
