import { sha256, toBytes, toHex } from 'viem';
import bs58 from 'bs58';

/**
 * Turn array buffer into hex string
 * @param arr Array like value
 */
export function ab2hexstring(arr: Uint8Array): string {
  let result = '';
  const uint8Arr: Uint8Array = new Uint8Array(arr);
  for (let i = 0; i < uint8Arr.byteLength; i += 1) {
    let str = uint8Arr[i].toString(16);
    if (str.length === 0) {
      str = '00';
    } else if (str.length === 1) {
      str = `0${str}`;
    }
    result += str;
  }
  return result;
}

const hexToUint8Array = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
};

export const base58ToHex = (address: string) => {
  const decoded = bs58.decode(address);
  const hexEncoded = ab2hexstring(decoded).substr(2, 40);
  return `0x${hexEncoded}`;
};

export const hexToBase58 = (ethAddress: string) => {
  const address = ethAddress.substring(2, ethAddress.length);
  const ADDR_VERSION = '17';
  const data = ADDR_VERSION + address;
  const hash = sha256(hexToUint8Array(data));
  const hash2 = sha256(hexToUint8Array(hash.substring(2))).substring(2);
  const checksum = hash2.slice(0, 8);
  const datas = data + checksum;
  return bs58.encode(hexToUint8Array(datas));
};
