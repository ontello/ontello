import React, { useState, useCallback, useEffect } from 'react';
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
import { walletApi } from '../../../../externalApis';
import { EnsData } from '../../../../externalApis/models/EnsData';
import { stopPropagation } from '../../../../utils/keyboard';
import { AvatarAndEnsData } from '../../../../components/wallet/AvatarAndEnsData';

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
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EnsData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRecipients = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);

      const response = await walletApi.walletdataEnsGet({
        query: searchQuery.trim(),
      });

      if (response.error.code === '0' && response.result) {
        // Ensure all results have required chainIcon field
        const ensDataResults: EnsData[] = response.result.map((result: any) => ({
          addr: result.addr,
          domain: result.domain,
          chainIcon: result.chainIcon || '', // Provide default empty string if undefined
        }));
        setSearchResults(ensDataResults);
      } else {
        setError('Search failed');
        setSearchResults([]);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Search error:', err);
      setError('Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchRecipients(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, searchRecipients]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
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
        style={{
          padding: config.space.S400,
          borderRadius: config.radii.R400,
          backgroundColor: color.Surface.Container,
          border: `${config.borderWidth.B300} solid ${color.Surface.ContainerLine}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={handleCardClick}
        direction="Row"
        alignItems="Center"
        justifyContent="SpaceBetween"
      >
        <Box direction="Column" gap="100">
          <Text size="T300" priority="300">
            To
          </Text>
          {value ? (
            <Box direction="Column">
              {value.domain && (
                <Text size="T400" style={{ fontWeight: '500' }}>
                  {value.domain}
                </Text>
              )}
              <Text size="T300" priority="300">
                {value.address.slice(0, 6)}...{value.address.slice(-4)}
              </Text>
            </Box>
          ) : (
            <Text size="T400" priority="400">
              Choose a recipient
            </Text>
          )}
        </Box>
        <Icon src={Icons.ChevronRight} size="100" />
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
                    style={{
                      padding: config.space.S300,
                    }}
                  >
                    <Input
                      size="400"
                      placeholder="Enter address(0x), ONT ID, or ENS"
                      value={query}
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
