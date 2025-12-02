import { TransferData } from '../components/review-transfer/types';

const ONTELLO_DOMAIN = 'ontello.app';

export type OntelloLinkType = 'transfer' | 'invite' | 'x402';

export interface OntelloLinkData {
  type: OntelloLinkType;
  data: unknown;
}

export const testOntelloLink = (href: string): boolean => {
  try {
    return new URL(href).hostname === ONTELLO_DOMAIN;
  } catch {
    return false;
  }
};

export const parseOntelloLink = (href: string): OntelloLinkData | null => {
  try {
    if (!testOntelloLink(href)) return null;

    const url = new URL(href);
    const dataParam = url.searchParams.get('data');
    if (!dataParam) return null;

    const linkData = JSON.parse(window.atob(dataParam));

    if (!linkData?.type || !linkData?.data) return null;

    return linkData;
  } catch {
    return null;
  }
};

export const createOntelloTransferLink = (transferData: TransferData): string => {
  const linkData = {
    type: 'transfer' as const,
    data: transferData,
  };

  const url = new URL(`https://${ONTELLO_DOMAIN}`);
  // Use window.btoa for browser environment
  url.searchParams.set('data', window.btoa(JSON.stringify(linkData)));

  return url.toString();
};
