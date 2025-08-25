import { useMatch } from 'react-router-dom';
import { WALLET_PATH } from '@src/app/pages/paths';

export const useWalletSelected = (): boolean => {
  const walletMatch = useMatch({
    path: WALLET_PATH,
    caseSensitive: true,
    end: false,
  });

  return !!walletMatch;
};
