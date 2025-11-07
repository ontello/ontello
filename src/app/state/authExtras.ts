export const AUTH_EXTRA_KEYS = {
  PUBLIC_KEY: 'cinny_public_key',
  AA_ADDRESS: 'cinny_aa_address',
} as const;

type AuthExtras = {
  publicKey?: string;
  aaAddress?: string;
};

export const setAuthExtras = ({ publicKey, aaAddress }: AuthExtras) => {
  if (typeof publicKey === 'string') {
    localStorage.setItem(AUTH_EXTRA_KEYS.PUBLIC_KEY, publicKey);
  } else {
    localStorage.removeItem(AUTH_EXTRA_KEYS.PUBLIC_KEY);
  }

  if (typeof aaAddress === 'string') {
    localStorage.setItem(AUTH_EXTRA_KEYS.AA_ADDRESS, aaAddress);
  } else {
    localStorage.removeItem(AUTH_EXTRA_KEYS.AA_ADDRESS);
  }
};

export const getAuthExtras = () => ({
  publicKey: localStorage.getItem(AUTH_EXTRA_KEYS.PUBLIC_KEY),
  aaAddress: localStorage.getItem(AUTH_EXTRA_KEYS.AA_ADDRESS),
});

export const clearAuthExtras = () => {
  localStorage.removeItem(AUTH_EXTRA_KEYS.PUBLIC_KEY);
  localStorage.removeItem(AUTH_EXTRA_KEYS.AA_ADDRESS);
};

// export { AUTH_EXTRA_KEYS };
