import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Box, Button, Text, Input, Icon, Icons, color } from 'folds';
import { Address } from 'viem';
import { openReviewTransfer } from '@src/client/action/navigation';
import { PageNavContent } from '../../../../components/page';
import { WalletNavMode, TokenWithChain } from '../../../../../types/wallet/types';
import { Back } from '../../../../components/ontello/Back';
import { ContainerColor } from '../../../../styles/ContainerColor.css';
import { AssetSelector } from './AssetSelector';
import { RecipientSelector, RecipientInfo } from './RecipientSelector';
import { FeeTokenSelector } from './FeeTokenSelector';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import { useFetchPasskeyList } from '../../../../hooks/useFetchPasskeyList';

export function Send({ setWalletNavMode }: { setWalletNavMode: (mode: WalletNavMode) => void }) {
  const mx = useMatrixClient();
  const userId = mx.getUserId();
  const [passkeyData] = useFetchPasskeyList(userId || '');
  const aaAddress = passkeyData?.walletAddress;

  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<TokenWithChain | null>(null);
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);
  const [feeToken, setFeeToken] = useState<TokenWithChain | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedToken && feeToken) {
      setFeeToken(null);
    }
  }, [selectedToken?.chainId]);

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
        decimals: BigInt(selectedToken.decimals),
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
          <Box
            direction="Column"
            gap="200"
            style={{
              padding: '24px 20px',
              borderRadius: '16px',
              backgroundColor: color.Surface.Container,
              border: `1px solid ${color.Surface.ContainerLine}`,
            }}
          >
            <Box direction="Row" alignItems="Center" gap="200">
              <Box grow="Yes">
                <Input
                  size="500"
                  type="number"
                  value={amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                  placeholder="0"
                  style={{
                    fontSize: '48px',
                    fontWeight: '300',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: 'transparent',
                    outline: 'none',
                  }}
                />
              </Box>
              <Text size="H3" style={{ minWidth: 'fit-content' }} priority="300">
                {selectedToken?.symbol || 'USDC'}
              </Text>
              <Button
                size="300"
                onClick={handleMaxClick}
                disabled={!selectedToken}
                style={{ minWidth: 'fit-content' }}
              >
                Max
              </Button>
            </Box>
            <Text size="T300" priority="300">
              ${usdValue} USD
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

          {/* Pay Button */}
          <Button
            size="500"
            disabled={!isFormValid}
            onClick={handlePay}
            style={{
              marginTop: '32px',
              width: '100%',
              height: '56px',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            {isFormValid ? 'Pay' : 'Complete form to pay'}
          </Button>
        </Box>
      </PageNavContent>
    </Box>
  );
}
