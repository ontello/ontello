import { ChainConfig } from '../externalApis/models';

// Keep the first and last few characters, and the middle part is replaced by ellipsis
export const formatAddress = (data: string, headLen = 6, tailLen = 6) => {
  if (data.length <= headLen + tailLen) return data;
  return `${data.slice(0, headLen)}...${data.slice(-tailLen)}`;
};

export const formatTxLink = (chainConfig: ChainConfig | undefined, txHash: string) => {
  if (!chainConfig) return '';
  const { blockExplorerUrls } = chainConfig;
  const blockExplorerUrl = blockExplorerUrls[0];
  return `${blockExplorerUrl}/tx/${txHash}`;
};
