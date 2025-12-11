import React, { useEffect, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import {
  Box,
  Button,
  Dialog,
  Header,
  Icon,
  IconButton,
  Icons,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Text,
} from 'folds';

import {
  useCloseGlobalDialog,
  useGlobalDialogState,
  useOpenGlobalDialog,
} from '../../state/hooks/globalDialogs';
import { GlobalDialogType } from '../../state/globalDialogs';
import { stopPropagation } from '../../utils/keyboard';
import * as css from './X402PaymentDialog.css';
import { wrapFetchWithPayment } from 'x402-fetch';
import { useAbstractAccount } from '@src/app/hooks/web3/useAbstractAccount';
import { useChainConfig } from '@src/app/hooks/web3/useChainConfig';
import { getAuthExtras } from '@src/app/state/authExtras';
import { Address, formatUnits, parseUnits } from 'viem';
import { Accept } from './types';
import { walletApi } from '@src/app/externalApis';
import { Token } from '@src/app/externalApis/models/Token';

export function X402PaymentDialog() {
  const dialogData = useGlobalDialogState(GlobalDialogType.X402Payment);
  const closeDialog = useCloseGlobalDialog(GlobalDialogType.X402Payment);
  const [isOpen, setIsOpen] = useState(false);
  const { aaAddress } = getAuthExtras();
  const [accept, setAccept] = useState<Accept | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [tokenInfo, setTokenInfo] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);
  const { availableChains } = useChainConfig();
  const { aaAccount } = useAbstractAccount(aaAddress as Address, chainId);
  const link = dialogData?.link;
  const openReceiveDialog = useOpenGlobalDialog(GlobalDialogType.Receive);

  useEffect(() => {
    setIsOpen(Boolean(dialogData));
  }, [dialogData]);

  useEffect(() => {
    if (!link || !availableChains.length) return;

    const loadData = async () => {
      setLoading(true);
      setAccept(undefined);
      setChainId(undefined);
      setTokenInfo(null);

      try {
        const response = await fetch(link, { method: 'GET' });
        const resBody = await response.json();
        const firstAccept: Accept | undefined = resBody.accepts?.[0];
        setAccept(firstAccept);
        if (!firstAccept) return;

        const networkName = firstAccept.network;
        const matchedChain = availableChains.find((chain) => chain.chainName === networkName);
        if (!matchedChain) return;
        setChainId(matchedChain.chainId);

        if (!aaAddress) return;
        try {
          const res = await walletApi.walletdataTransferBalanceGet({
            chain_id: matchedChain.chainId,
            addr: aaAddress,
            token_addr: firstAccept.asset,
          });
          setTokenInfo(res.result);
        } catch (error) {
          console.error('Failed to fetch balance', error);
        }
      } catch (error) {
        console.error('Unable to load payment accepts.', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [link, availableChains, aaAddress]);

  const handleClose = () => {
    setIsOpen(false);
    closeDialog();
  };

  const handleFundWallet = () => {
    openReceiveDialog({});
  };

  if (!dialogData) return null;

  const matchedChain = availableChains.find((chain) => chain.chainId === chainId);

  const tokenSymbol = tokenInfo?.symbol || accept?.extra?.name;
  const amount = (() => {
    if (!accept?.maxAmountRequired) return null;
    return formatUnits(BigInt(accept.maxAmountRequired), 6);
  })();
  const fiat =
    amount && tokenInfo?.currencyPrice
      ? (Number(amount) * Number(tokenInfo.currencyPrice)).toFixed(2)
      : null;
  const balance =
    tokenInfo && tokenInfo.balance
      ? (() => {
          try {
            const value = parseUnits(tokenInfo.balance, tokenInfo.decimals);
            return formatUnits(value, tokenInfo.decimals);
          } catch {
            return null;
          }
        })()
      : null;
  const hasInsufficientBalance = (() => {
    if (!amount || !tokenInfo?.balance) return false;
    try {
      const required = parseUnits(amount, tokenInfo.decimals);
      const available = parseUnits(tokenInfo.balance, tokenInfo.decimals);
      return available < required;
    } catch {
      return false;
    }
  })();

  const handlePay = async () => {
    if (!dialogData?.link) return;
    if (!chainId) return;
    if (!accept) return;
    const fetchWithPay = wrapFetchWithPayment(fetch, aaAccount, BigInt(10000000) /* TODO */);
    const response = await fetchWithPay(dialogData.link, {
      method: 'GET',
    });

    const data = await response.json();
    console.log('data', data);
  };

  return (
    <Overlay open={isOpen} backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog className={css.Dialog} variant="Surface">
            <Header className={css.Header} variant="Surface" size="500">
              <Box grow="Yes" alignItems="Center" gap="100">
                <Text size="H4">X402 Checkout</Text>
              </Box>
              <IconButton size="300" onClick={handleClose} radii="300">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>

            <Box className={css.Content}>
              <Box className={css.PriceBlock}>
                <Text size="H2" priority="500">
                  {amount ? `${amount} ${tokenSymbol}` : '—'}
                </Text>
                <Text size="T300" color="Secondary">
                  {fiat ? `${fiat} ${tokenInfo?.currency ?? 'USD'}` : '—'}
                </Text>
              </Box>

              <Box className={css.Section}>
                <Box className={css.Row}>
                  <Text size="B300" priority="500">
                    Payment For:
                  </Text>
                  <Text size="B300" className={css.CardValue}>
                    {dialogData.paymentFor || accept?.description || '—'}
                  </Text>
                </Box>
              </Box>

              <Box className={css.Section}>
                <Box className={css.Row}>
                  <Text size="B300" priority="500">
                    Available balance:
                  </Text>
                  <Text size="B300" className={css.CardValue}>
                    {balance ? `${balance} ${tokenSymbol}` : loading ? 'Checking…' : '—'}
                  </Text>
                </Box>
                <Box className={css.Row}>
                  <Text size="B300" priority="500">
                    Network :
                  </Text>
                  <Text size="B300" className={css.CardValue}>
                    {matchedChain?.chainNameView || '—'}
                  </Text>
                </Box>
              </Box>

              <Box className={css.Actions}>
                {hasInsufficientBalance && (
                  <Box gap="300">
                    <Text size="T200" style={{ color: '#e5484d' }}>
                      Insufficient balance
                    </Text>
                    <Text
                      as="button"
                      type="button"
                      size="T200"
                      style={{
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                      }}
                      onClick={handleFundWallet}
                    >
                      Fund wallet
                    </Text>
                  </Box>
                )}
                <Button
                  variant="Primary"
                  size="300"
                  fill="Solid"
                  onClick={handlePay}
                  style={{ width: '100%' }}
                  disabled={loading || !accept || !chainId || hasInsufficientBalance}
                >
                  <Text size="B300">Pay</Text>
                </Button>
              </Box>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}

export default X402PaymentDialog;
