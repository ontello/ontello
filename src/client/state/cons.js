const cons = {
  version: '0.4.0',
  secretKey: {
    ACCESS_TOKEN: 'cinny_access_token',
    DEVICE_ID: 'cinny_device_id',
    USER_ID: 'cinny_user_id',
    BASE_URL: 'cinny_hs_base_url',
    PUBLIC_KEY: 'cinny_public_key',
    AA_ADDRESS: 'cinny_aa_address',
  },
  status: {
    PRE_FLIGHT: 'pre-flight',
    IN_FLIGHT: 'in-flight',
    SUCCESS: 'success',
    ERROR: 'error',
  },
  events: {
    navigation: {
      REVIEW_TRANSFER_OPENED: 'REVIEW_TRANSFER_OPENED',
    },
  },
};

Object.freeze(cons);

export default cons;
