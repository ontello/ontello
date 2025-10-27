import { Address } from 'viem';

export interface TokenInfo {
  address?: Address;
  name: string;
  decimals: number;
  amount: string;
  usdValue: string;
  icon: string;
}

export interface RecipientInfo {
  addr: string;
  domain: string;
  chainIcon: string;
}
export interface FeeTokenInfo {
  address?: Address;
  name: string;
  // decimals: bigint;
  exchangeRate: string;
  price: string;
}
export interface TransferData {
  token: TokenInfo;
  recipient: RecipientInfo;
  chainId: number;
  // feeAddress: Address;
  fee: FeeTokenInfo;
}

export interface ReviewTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transferData: TransferData;
}

export interface ReviewTransferContentProps extends ReviewTransferDialogProps {
  onAfterClose?: () => void;
}
