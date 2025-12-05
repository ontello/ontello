export interface X402PaymentDialogData {
  paymentFor: string;
  link: string;
}

export interface AcceptExtra {
  name?: string;
  version?: string;
  [key: string]: unknown;
}

export interface Accept {
  asset: string;
  description: string;
  extra?: AcceptExtra;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
  mimeType: string;
  network: string;
  payTo: string;
  resource: string;
  scheme: 'exact' | string;
}
