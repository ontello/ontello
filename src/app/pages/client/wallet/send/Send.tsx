import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Box, Button, Text, color, toRem } from 'folds';
import { Address } from 'viem';
import { openReviewTransfer } from '@src/client/action/navigation';
import { PageNavContent } from '../../../../components/page';
import { WalletNavMode, TokenWithChain } from '../../../../../types/wallet/types';
import { Back } from '../../../../components/ontello/Back';
import { ContainerColor } from '../../../../styles/ContainerColor.css';
import { AssetSelector } from './AssetSelector';
import { RecipientSelector, RecipientInfo } from './RecipientSelector';
import { FeeTokenSelector } from './FeeTokenSelector';
import { AmountInput } from './AmountInput';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { useFetchPasskeyList } from '../../../../hooks/useFetchPasskeyList';
import { useTokensContext } from '../../../../hooks/wallet/useTokens';

export function Send({ setWalletNavMode }: { setWalletNavMode: (mode: WalletNavMode) => void }) {
  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId || '');
  const aaAddress = passkeyData?.walletAddress;
  const { tokens } = useTokensContext();

  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<TokenWithChain | null>(null);
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);
  const [feeToken, setFeeToken] = useState<TokenWithChain | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Set first token as default when tokens are loaded
  useEffect(() => {
    if (tokens && tokens.length > 0 && !selectedToken) {
      setSelectedToken(tokens[0]);
    }
  }, [tokens, selectedToken]);

  useEffect(() => {
    if (selectedToken) {
      setFeeToken(null);
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
    }
  };

  const isFormValid = useMemo(() => {
    if (!amount || !selectedToken || !recipient || !feeToken) return false;

    const amountNum = parseFloat(amount);
    const maxAmount = parseFloat(selectedToken.balance || '0');

    return amountNum > 0 && amountNum <= maxAmount;
  }, [amount, selectedToken, recipient, feeToken]);

  const handlePay = () => {
    if (!isFormValid || !selectedToken || !recipient || !feeToken) return;

    const transferData = {
      token: {
        address: (selectedToken.tokenAddr || '') as Address,
        name: selectedToken.name,
        decimals: selectedToken.decimals,
        amount,
        usdValue,
        icon: selectedToken.icon || '',
      },
      recipient: {
        addr: recipient.address,
        domain: recipient.domain || '',
        chainIcon: selectedToken.chain?.iconUrls[0],
      },
      chainId: selectedToken.chainId,
      feeAddress: feeToken.tokenAddr as Address,
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
                  onChange={(e) => setAmount(e.target.value)}
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
            <Box direction="Column" gap="300">
              <AssetSelector value={selectedToken} onChange={setSelectedToken} />

              <RecipientSelector value={recipient} onChange={setRecipient} />

              {selectedToken && selectedToken.chainId && (
                <FeeTokenSelector
                  value={feeToken}
                  onChange={setFeeToken}
                  chainId={selectedToken.chainId}
                  aaAddress={aaAddress}
                />
              )}
            </Box>
          )}
        </Box>
        {/* Pay Button */}
        <Button
          size="500"
          disabled={!isFormValid}
          onClick={handlePay}
          style={{
            marginTop: toRem(30),
            width: '100%',
          }}
        >
          Pay
        </Button>
      </PageNavContent>
    </Box>
  );
}
