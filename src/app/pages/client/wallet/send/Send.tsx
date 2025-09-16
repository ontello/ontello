import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Box, Button, Text, color, toRem } from 'folds';
import { Address, parseUnits, formatUnits } from 'viem';
import { openReviewTransfer } from '@src/client/action/navigation';
import { GasToken } from '@src/app/hooks/web3/types';
import { TransferData } from '@src/app/components/review-transfer';
import { PageNavContent } from '../../../../components/page';
import { WalletNavMode, TokenWithChain } from '../../../../../types/wallet/types';
import { Back } from '../../../../components/ontello/Back';
import { ContainerColor } from '../../../../styles/ContainerColor.css';
import { AssetSelector } from './AssetSelector';
import { RecipientSelector, RecipientInfo } from './RecipientSelector';
import { FeeTokenSelector } from './FeeTokenSelector';
import { AmountInput } from './AmountInput';
import { useTokensContext } from '../../../../hooks/wallet/useTokens';
import { useAbstractAccount } from '../../../../hooks/web3/useAbstractAccount';
import { walletApi } from '../../../../externalApis';

export function Send({ setWalletNavMode }: { setWalletNavMode: (mode: WalletNavMode) => void }) {
  const aaAddress = localStorage.getItem('cinny_aa_address') as Address;
  const { tokens } = useTokensContext();

  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<TokenWithChain | null>(null);
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);
  const [feeToken, setFeeToken] = useState<GasToken | null>(null);
  const [isMaxAmount, setIsMaxAmount] = useState(false);
  const [isEstimatingFee, setIsEstimatingFee] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Get abstract account hook at component level
  const abstractAccount = useAbstractAccount(
    aaAddress || ('0x0' as Address),
    selectedToken?.chainId
  );

  // Set first token as default when tokens are loaded
  useEffect(() => {
    if (tokens && tokens.length > 0 && !selectedToken) {
      setSelectedToken(tokens[0]);
    }
  }, [tokens, selectedToken]);

  useEffect(() => {
    if (selectedToken) {
      setFeeToken(null);
      setIsMaxAmount(false);
    }
  }, [selectedToken]);

  const usdValue = useMemo(() => {
    if (!amount || !selectedToken || !selectedToken.currencyPrice) return '0.00';
    const amountNum = parseFloat(amount);
    const pricePerToken = parseFloat(selectedToken.currencyPrice);
    return (amountNum * pricePerToken).toFixed(2);
  }, [amount, selectedToken]);

  const handleMaxClick = () => {
    if (selectedToken) {
      setAmount(selectedToken.balance || '0');
      setIsMaxAmount(true);
    }
  };

  // Helper function to calculate token fee from ETH fee
  const calculateTokenFeeFromEth = (
    ethFee: bigint,
    exchangeRate: string,
    tokenDecimals: number
  ): bigint => {
    const rate = parseFloat(exchangeRate);
    const ethAmount = formatUnits(ethFee, 18);
    const tokenAmount = parseFloat(ethAmount) * rate;
    return parseUnits(tokenAmount.toString(), tokenDecimals);
  };

  // Helper function to adjust amount for fee
  const adjustAmountForFee = (
    originalAmount: string,
    feeInToken: bigint,
    tokenDecimals: number
  ): string => {
    const amountBigInt = parseUnits(originalAmount, tokenDecimals);
    const adjustedBigInt = amountBigInt - feeInToken;
    // Ensure we don't go negative
    if (adjustedBigInt <= BigInt(0)) {
      return '0';
    }
    return formatUnits(adjustedBigInt, tokenDecimals);
  };

  // Helper function to calculate USD value
  const calculateUsdValue = (tokenAmount: string): string => {
    if (!selectedToken || !selectedToken.currencyPrice) return '0.00';
    const amountNum = parseFloat(tokenAmount);
    const pricePerToken = parseFloat(selectedToken.currencyPrice);
    return (amountNum * pricePerToken).toFixed(2);
  };

  const isFormValid = useMemo(() => {
    if (!amount || !selectedToken || !recipient || !feeToken) return false;

    const amountNum = parseFloat(amount);
    const maxAmount = parseFloat(selectedToken.balance || '0');

    return amountNum > 0 && amountNum <= maxAmount;
  }, [amount, selectedToken, recipient, feeToken]);

  const handlePay = async () => {
    if (!isFormValid || !selectedToken || !recipient || !feeToken || !aaAddress) return;

    let finalAmount = amount;
    let finalUsdValue = usdValue;

    // Check if token and fee token are the same and max was clicked
    if (selectedToken.tokenAddr === feeToken.token_hash && isMaxAmount) {
      try {
        setIsEstimatingFee(true);

        // Estimate fee in ETH
        const { estimatedEthFee } = await abstractAccount.estimateTransfer(
          recipient.address as Address,
          parseUnits(amount, selectedToken.decimals),
          feeToken.token_hash as Address,
          selectedToken.tokenAddr as Address
        );

        // Get exchange rate from ETH to token
        const exchangeRateResponse = await walletApi.walletdataExchangeRateGet({
          chain_id: selectedToken.chainId,
          from_token_hash: '', // native token
          to_token_hash: selectedToken.tokenAddr,
        });

        // Calculate fee in token amount
        const feeInToken = calculateTokenFeeFromEth(
          estimatedEthFee,
          exchangeRateResponse.result.exchangeRate || '0',
          selectedToken.decimals
        );

        // Adjust amount by subtracting fee
        finalAmount = adjustAmountForFee(
          amount,
          (feeInToken * BigInt(12)) / BigInt(10),
          selectedToken.decimals
        );

        // Recalculate USD value
        finalUsdValue = calculateUsdValue(finalAmount);
      } catch (error) {
        console.error(error);
      } finally {
        setIsEstimatingFee(false);
      }
    }

    const transferData: TransferData = {
      token: {
        address: (selectedToken.tokenAddr || '') as Address,
        name: selectedToken.name,
        decimals: selectedToken.decimals,
        amount: finalAmount,
        usdValue: finalUsdValue,
        icon: selectedToken.icon || '',
      },
      recipient: {
        addr: recipient.address,
        domain: recipient.domain || '',
        chainIcon: selectedToken.chain?.iconUrls[0] || '',
      },
      chainId: selectedToken.chainId,
      fee: {
        address: feeToken.token_hash as Address,
        name: feeToken.token_name,
        exchangeRate: feeToken.exchange_rate,
        price: feeToken.currency_price,
      },
    };

    openReviewTransfer(transferData);
  };

  return (
    <Box grow="Yes" direction="Column" className={ContainerColor({ variant: 'Surface' })}>
      <PageNavContent scrollRef={scrollRef}>
        <Box direction="Column" gap="400">
          <Back onClick={() => setWalletNavMode(WalletNavMode.Main)}>
            <Text size="H5" align="Center" style={{ width: '100%' }}>
              Send
            </Text>
          </Back>

          {/* Amount Input Section */}
          <Box direction="Column" gap="200">
            <Box direction="Row" alignItems="Center" gap="300">
              <Box style={{ flex: 1 }} direction="Row" alignItems="Center" gap="300">
                <AmountInput
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setIsMaxAmount(false);
                  }}
                  placeholder="0"
                  disabled={!selectedToken}
                />

                <Text
                  size="H5"
                  style={{
                    fontSize: '24px',
                  }}
                  priority="500"
                >
                  {selectedToken?.name}
                </Text>
              </Box>
              <Button
                size="300"
                onClick={handleMaxClick}
                disabled={!selectedToken}
                style={{
                  backgroundColor: 'var(--bg-surface-low)',
                }}
              >
                <Text style={{ color: color.Secondary.Main }}>Max</Text>
              </Button>
            </Box>
            <Text
              size="T300"
              priority="300"
              style={{
                fontSize: '18px',
                color: 'var(--tc-surface-low)',
                opacity: 0.6,
              }}
            >
              {usdValue} USD
            </Text>
          </Box>

          {/* Selection Areas */}
          {aaAddress && (
            <Box direction="Column" gap="300" style={{ marginTop: toRem(30) }}>
              <AssetSelector value={selectedToken} onChange={setSelectedToken} />

              <RecipientSelector value={recipient} onChange={setRecipient} />

              {selectedToken && selectedToken.chainId && (
                <FeeTokenSelector
                  value={feeToken}
                  onChange={setFeeToken}
                  chainId={selectedToken.chainId}
                />
              )}
            </Box>
          )}
        </Box>
        {/* Pay Button */}
        <Button
          size="400"
          disabled={!isFormValid || isEstimatingFee}
          onClick={handlePay}
          style={{
            marginTop: toRem(30),
            width: '100%',
          }}
        >
          {isEstimatingFee ? 'Calculating...' : 'Pay'}
        </Button>
      </PageNavContent>
    </Box>
  );
}
