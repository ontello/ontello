import { Address } from 'viem';

export interface TokenInfo {
  address?: Address;
  name: string;
  decimals: bigint;
  amount: string;
  usdValue: string;
  icon: string;
}

export interface RecipientInfo {
  address: Address;
  avatar?: string;
  ontId?: string;
  ens?: string;
}

export interface TransferData {
  token: TokenInfo;
  recipient: RecipientInfo;
  chainId: number;
  feeAddress: Address;
}

export interface ReviewTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transferData: TransferData;
}

export interface ReviewTransferContentProps extends ReviewTransferDialogProps {
  onAfterClose?: () => void;
}
