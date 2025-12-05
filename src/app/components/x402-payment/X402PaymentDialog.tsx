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

import { useCloseGlobalDialog, useGlobalDialogState } from '../../state/hooks/globalDialogs';
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
  const [chainLabel, setChainLabel] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<Token | null>(null);
  const [loadingAccepts, setLoadingAccepts] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [acceptsError, setAcceptsError] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const { availableChains } = useChainConfig();
  const { aaAccount } = useAbstractAccount(aaAddress as Address, chainId);
  const link = dialogData?.link;

  const normalizeNetworkName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  useEffect(() => {
    setIsOpen(Boolean(dialogData));
  }, [dialogData]);

  useEffect(() => {
    if (!link) return;

    setLoadingAccepts(true);
    setAcceptsError(null);
    setAccept(undefined);
    setChainId(undefined);
    setChainLabel(null);
    setTokenInfo(null);
    setBalanceError(null);
    setLoadingBalance(false);

    const fetchAccepts = async () => {
      try {
        const response = await fetch(link, { method: 'GET' });
        console.log('response', response);
        console.log('json');
        if (response.status !== 402) {
          setAcceptsError(`No accepts found (status ${response.status}).`);
        }
        const resbBody = await response.json();
        const firstAccept: Accept | undefined = resbBody.accepts?.[0];
        setAccept(firstAccept);
        if (!firstAccept) {
          setAcceptsError('No accepts returned from payment endpoint.');
        }
      } catch (error) {
        setAcceptsError('Unable to load payment accepts.');
      } finally {
        setLoadingAccepts(false);
      }
    };

    fetchAccepts();
  }, [dialogData?.link]);

  useEffect(() => {
    if (!accept || !availableChains.length) return;

    const networkSlug = normalizeNetworkName(accept.network);
    const matchedChain = availableChains.find((chain) => {
      const nameSlug = normalizeNetworkName(chain.chainName);
      const viewSlug = normalizeNetworkName(chain.chainNameView);
      return nameSlug === networkSlug || viewSlug === networkSlug;
    });

    if (!matchedChain) {
      setAcceptsError(`Unsupported payment network: ${accept.network}`);
      setChainId(undefined);
      setChainLabel(null);
      return;
    }

    setChainId(matchedChain.chainId);
    setChainLabel(matchedChain.chainNameView || matchedChain.chainName);
  }, [accept, availableChains]);

  useEffect(() => {
    if (!accept || !chainId || !aaAddress) return;

    const fetchBalance = async () => {
      try {
        setLoadingBalance(true);
        setBalanceError(null);

        const res = await walletApi.walletdataTransferBalanceGet({
          chain_id: chainId,
          addr: aaAddress,
          token_addr: accept.asset,
        });

        setTokenInfo(res.result);
      } catch (error) {
        console.error('Failed to fetch balance', error);
        setBalanceError('Unable to load token balance.');
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [accept, chainId, aaAddress]);

  const handleClose = () => {
    setIsOpen(false);
    closeDialog();
  };

  if (!dialogData) return null;

  const decimals = tokenInfo?.decimals ?? 18;
  const tokenSymbol = tokenInfo?.symbol || accept?.extra?.name || 'Token';
  const amountValue = (() => {
    if (!accept?.maxAmountRequired) return null;
    try {
      const micro = BigInt(accept.maxAmountRequired); // accept amount is in micro units (6 decimals)
      const pow10 = (power: number) => BigInt(10) ** BigInt(power);
      if (decimals >= 6) {
        return micro * pow10(decimals - 6);
      }
      return micro / pow10(6 - decimals);
    } catch {
      try {
        // Fallback for non-integer strings
        const microAmount = parseUnits(accept.maxAmountRequired, 6);
        const pow10 = (power: number) => BigInt(10) ** BigInt(power);
        if (decimals >= 6) {
          return microAmount * pow10(decimals - 6);
        }
        return microAmount / pow10(6 - decimals);
      } catch {
        return null;
      }
    }
  })();
  const amount = amountValue !== null ? formatUnits(amountValue, decimals) : null;
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

  const handlePay = async () => {
    if (!dialogData?.link) return;
    if (!chainId) {
      setAcceptsError('Payment network not ready. Please try again in a moment.');
      return;
    }
    if (!accept) {
      setAcceptsError('Payment details not ready.');
      return;
    }
    const fetchWithPay = wrapFetchWithPayment(fetch, aaAccount);
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
                    {balance ? `${balance} ${tokenSymbol}` : loadingBalance ? 'Checking…' : '—'}
                  </Text>
                </Box>
                <Box className={css.Row}>
                  <Text size="B300" priority="500">
                    Network :
                  </Text>
                  <Text size="B300" className={css.CardValue}>
                    {chainLabel || accept?.network || '—'}
                  </Text>
                </Box>
              </Box>

              <Box className={css.Actions}>
                <Button
                  variant="Primary"
                  size="300"
                  fill="Solid"
                  onClick={handlePay}
                  style={{ width: '100%' }}
                  disabled={
                    loadingAccepts || loadingBalance || !accept || !chainId || !!acceptsError
                  }
                >
                  <Text size="B300">Pay</Text>
                </Button>
              </Box>

              {acceptsError && (
                <Text size="T200" color="Critical">
                  {acceptsError}
                </Text>
              )}
              {balanceError && (
                <Text size="T200" color="Critical">
                  {balanceError}
                </Text>
              )}
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}

export default X402PaymentDialog;
