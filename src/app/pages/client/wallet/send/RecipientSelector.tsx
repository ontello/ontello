import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Header,
  Icon,
  IconButton,
  Icons,
  Input,
  Modal,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Scroll,
  Text,
  config,
  Spinner,
  color,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { ContainerColor } from '@src/app/styles/ContainerColor.css';
import { walletApi } from '../../../../externalApis';
import { EnsData } from '../../../../externalApis/models/EnsData';
import { stopPropagation } from '../../../../utils/keyboard';
import { AvatarAndEnsData } from '../../../../components/wallet/AvatarAndEnsData';
import { useDebounce } from '../../../../hooks/useDebounce';

export interface RecipientInfo {
  address: string;
  domain?: string;
  avatar?: string;
}

interface RecipientSelectorProps {
  value: RecipientInfo | null;
  onChange: (recipient: RecipientInfo) => void;
}

export function RecipientSelector({ value, onChange }: RecipientSelectorProps) {
  // Request ID tracking to prevent race conditions
  const latestRequestRef = useRef(0);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EnsData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRecipients = useCallback(async (searchQuery: string) => {
    // Generate unique request ID to prevent race conditions
    latestRequestRef.current += 1;
    const requestId = latestRequestRef.current;
    setSearchResults([]);
    if (!searchQuery.trim()) {
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const response = await walletApi.walletdataEnsGet({
        query: searchQuery.trim(),
      });

      // Check if this is still the latest request before applying results
      if (requestId !== latestRequestRef.current) {
        return;
      }

      if (response.error.code === '0' && response.result) {
        setSearchResults(response.result);
      } else {
        setError('Search failed');
      }
    } catch (err) {
      // Only handle error if this is still the latest request
      if (requestId === latestRequestRef.current) {
        // eslint-disable-next-line no-console
        console.error('Search error:', err);
        setError('Search failed');
      }
    } finally {
      // Only update searching state if this is still the latest request
      if (requestId === latestRequestRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  const debouncedSearchRecipients = useDebounce(searchRecipients, { wait: 500 });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    debouncedSearchRecipients(newQuery);
  };

  const handleClearInput = () => {
    setQuery('');
    setSearchResults([]);
    setError(null);
  };

  const handleCardClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setQuery('');
    setSearchResults([]);
    setError(null);
    setIsOpen(false);
  };

  const handleResultClick = (result: EnsData) => {
    const recipient: RecipientInfo = {
      address: result.addr,
      domain: result.domain,
      avatar: result.chainIcon,
    };
    onChange(recipient);
    handleClose();
  };

  return (
    <>
      {/* Recipient Selection Card */}
      <Box
        className={ContainerColor({ variant: 'SurfaceVariant' })}
        style={{
          padding: config.space.S200,
          cursor: 'pointer',
          borderRadius: config.radii.R300,
        }}
        onClick={handleCardClick}
        alignItems="Center"
        gap="300"
        justifyContent="SpaceBetween"
      >
        <Box direction="Column" gap="100">
          <Text size="B500" priority="300">
            To
          </Text>
        </Box>
        <Box alignItems="Center">
          <Box grow="Yes" alignItems="Center" gap="300">
            {value ? (
              <AvatarAndEnsData
                ensData={{
                  addr: value.address,
                  domain: value.domain || '',
                  chainIcon: value.avatar || '',
                }}
                hideAddressIfHasEns
                directionMode="Row"
                showShortAddress
                alignItems="Center"
              />
            ) : (
              <Text size="T400" priority="400">
                Recipient
              </Text>
            )}
          </Box>
          <Icon src={Icons.ChevronRight} size="100" />
        </Box>
      </Box>

      {/* Recipient Selection Modal */}
      {isOpen && (
        <Overlay open backdrop={<OverlayBackdrop />}>
          <OverlayCenter>
            <FocusTrap
              focusTrapOptions={{
                initialFocus: false,
                clickOutsideDeactivates: true,
                onDeactivate: handleClose,
                escapeDeactivates: stopPropagation,
              }}
            >
              <Modal size="400" flexHeight>
                <Box direction="Column">
                  <Header
                    size="500"
                    style={{
                      padding: config.space.S200,
                      paddingLeft: config.space.S400,
                      borderBottomWidth: config.borderWidth.B300,
                    }}
                  >
                    <Box grow="Yes">
                      <Text size="H4">Pay to address</Text>
                    </Box>
                    <Box shrink="No">
                      <IconButton size="300" radii="300" onClick={handleClose}>
                        <Icon src={Icons.Cross} />
                      </IconButton>
                    </Box>
                  </Header>

                  <Box
                    direction="Column"
                    gap="300"
                    style={{
                      padding: config.space.S300,
                    }}
                  >
                    <Text>Enter address(0x), ONT ID, or ENS</Text>
                    <Input
                      size="400"
                      value={query}
                      after={
                        query && (
                          <IconButton
                            radii="300"
                            size="300"
                            variant="Background"
                            onClick={handleClearInput}
                          >
                            <Icon size="100" src={Icons.Cross} />
                          </IconButton>
                        )
                      }
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    />
                  </Box>

                  <Scroll size="300" hideTrack>
                    <Box
                      style={{
                        padding: config.space.S400,
                        paddingRight: config.space.S200,
                      }}
                      direction="Column"
                      gap="300"
                    >
                      {isSearching && (
                        <Box justifyContent="Center" alignItems="Center" gap="200">
                          <Spinner size="200" />
                          <Text size="T300">Searching...</Text>
                        </Box>
                      )}

                      {error && (
                        <Box justifyContent="Center">
                          <Text size="T300" style={{ color: color.Critical.Main }}>
                            {error}
                          </Text>
                        </Box>
                      )}

                      {!isSearching && !error && searchResults.length === 0 && query.trim() && (
                        <Box justifyContent="Center">
                          <Text size="T300" priority="300">
                            No results found
                          </Text>
                        </Box>
                      )}

                      {searchResults.map((result) => (
                        <Box
                          key={`${result.addr}-${result.domain}`}
                          style={{
                            padding: config.space.S300,
                            borderRadius: config.radii.R400,
                            cursor: 'pointer',
                            backgroundColor: color.SurfaceVariant.Container,
                          }}
                          onClick={() => handleResultClick(result)}
                        >
                          <AvatarAndEnsData
                            ensData={result}
                            hideAddressIfHasEns
                            directionMode="Row"
                            alignItems="Center"
                          />
                        </Box>
                      ))}
                    </Box>
                  </Scroll>
                </Box>
              </Modal>
            </FocusTrap>
          </OverlayCenter>
        </Overlay>
      )}
    </>
  );
}
