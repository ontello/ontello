/* eslint-disable no-await-in-loop */
import { type MatrixClient } from 'matrix-js-sdk';
import { hashMessage, Hex, stringToBytes, toBytes, toHex, hexToBytes } from 'viem';
import { v4 as uuidv4 } from 'uuid';
import { getPasskeyCredentials } from '../extendApis';

// const RPID = 'localhost';

export function toBase64Url(input: ArrayBuffer): string {
  let base64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(input))));
  base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return base64;
}
export function fromBase64Url(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }

  return buffer.buffer;
}

export function parseDER(derBytes: Uint8Array): {
  r: Uint8Array;
  s: Uint8Array;
} {
  if (derBytes[0] !== 0x30) throw new Error('Invalid DER format: missing SEQUENCE');

  let offset = 2; // 跳过 SEQUENCE (0x30) 和总长度

  if (derBytes[offset] !== 0x02) throw new Error('Invalid DER format: missing INTEGER for r');
  const rLen = derBytes[offset + 1]; // r 的长度
  let r = derBytes.slice(offset + 2, offset + 2 + rLen);

  offset += 2 + rLen;

  if (derBytes[offset] !== 0x02) throw new Error('Invalid DER format: missing INTEGER for s');
  const sLen = derBytes[offset + 1]; // s 的长度
  let s = derBytes.slice(offset + 2, offset + 2 + sLen);

  if (r.length === 33 && r[0] === 0) {
    r = r.slice(1);
  }
  if (s.length === 33 && s[0] === 0) {
    s = s.slice(1);
  }
  return { r, s };
}
export function parsePublicKeyPoints(spkiBuffer: ArrayBuffer): {
  x: ArrayBuffer;
  y: ArrayBuffer;
  xy: ArrayBuffer;
} {
  const bytes = new Uint8Array(spkiBuffer);
  const PUBKEY_LENGTH = 64;
  const pubKeyBytes = bytes.slice(-PUBKEY_LENGTH);

  return {
    x: pubKeyBytes.slice(0, 32).buffer,
    y: pubKeyBytes.slice(32).buffer,
    xy: pubKeyBytes.buffer,
  };
}
export async function importPublicKey(publicKeyBytes: ArrayBuffer): Promise<CryptoKey> {
  const key = await crypto.subtle.importKey(
    'spki',
    publicKeyBytes,
    {
      name: 'ECDSA',
      namedCurve: 'P-256', // secp256r1
    },
    true,
    ['verify']
  );
  return key;
}

export async function recoverPublicKey(publicKeyBase64Url: string): Promise<CryptoKey> {
  const xy = fromBase64Url(publicKeyBase64Url);
  const uncompressedPubkey = new Uint8Array(65);
  uncompressedPubkey[0] = 0x04;
  uncompressedPubkey.set(new Uint8Array(xy), 1);

  const publicKey = await crypto.subtle.importKey(
    'raw',
    uncompressedPubkey,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['verify']
  );

  return publicKey;
}

async function verifySignature(
  publicKey: CryptoKey,
  signature: ArrayBuffer,
  clientDataJSON: ArrayBuffer,
  authenticatorData: ArrayBuffer
): Promise<boolean> {
  try {
    const derSig = new Uint8Array(signature);
    const { r, s } = parseDER(derSig);
    const rawSignature = new Uint8Array(r.length + s.length);
    rawSignature.set(r);
    rawSignature.set(s, r.length);

    const clientDataHash = await crypto.subtle.digest('SHA-256', clientDataJSON);
    const verifyData = new Uint8Array(authenticatorData.byteLength + clientDataHash.byteLength);
    verifyData.set(new Uint8Array(authenticatorData), 0);
    verifyData.set(new Uint8Array(clientDataHash), authenticatorData.byteLength);

    const isValid = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      publicKey,
      rawSignature.buffer,
      verifyData.buffer
    );
    return isValid;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

export const signWithPasskey = async (challenge: BufferSource): Promise<PublicKeyCredential> => {
  const publicKeyCredentialRequestOptions = {
    challenge,
    // rpId: RPID,
    timeout: 60000,
    userVerification: 'required' as const,
  };
  const credential = (await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions,
  })) as PublicKeyCredential;

  return credential;
};

const getChallenge = (name: string, prefix: string): ArrayBuffer => {
  const timestampInSeconds = Math.floor(Date.now() / 1000);
  const challenge = `${prefix} ${name}.ont.im at ${timestampInSeconds}`;
  return new TextEncoder().encode(challenge).buffer;
};
const getLoginChallenge = (name: string): ArrayBuffer => getChallenge(name, 'Login');

const getRegisterChallenge = (name: string): ArrayBuffer => getChallenge(name, 'Register');

export const createPasskey = async (name: string, challenge: ArrayBuffer) => {
  // const userIdArray = new TextEncoder().encode(name);
  const uuid = uuidv4();
  const uuidBytes = new TextEncoder().encode(uuid);
  const publicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'ONT IM',
      // id: RPID,
    },
    user: {
      id: uuidBytes,
      name,
      displayName: name,
    },
    pubKeyCredParams: [
      {
        type: 'public-key',
        alg: -7,
      },
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'required',
    },
    timeout: 60000,
  };
  const credential = (await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions as any,
  })) as PublicKeyCredential;
  return credential;
};

export const registerWithPasskey = async (
  name: string
): Promise<{
  password: string;
  publicKeyBase64Url: string;
  x: ArrayBuffer;
  y: ArrayBuffer;
  xy: ArrayBuffer;
}> => {
  try {
    const credential = await createPasskey(name, getRegisterChallenge(name));
    const response = credential.response as AuthenticatorAttestationResponse;

    const publicKey = response.getPublicKey();
    if (!publicKey) {
      throw new Error('Failed to get public key');
    }
    const { x, y, xy } = parsePublicKeyPoints(publicKey);
    const publicKeyBase64Url = toBase64Url(xy);
    // console.log('publicKeyBase64Url', publicKeyBase64Url);

    const password = JSON.stringify({
      attestation: {
        type: credential.type,
        rawId: toBase64Url(credential.rawId),
        id: credential.id,
        response: {
          attestationObject: toBase64Url(response.attestationObject),
          clientDataJSON: toBase64Url(response.clientDataJSON),
        },
      },
    });
    return { password, publicKeyBase64Url, x, y, xy };
  } catch (error) {
    console.error(error);
    throw new Error('Failed to register passkey');
  }
};
export const loginWithPasskey = async (
  name: string,
  cl: MatrixClient,
  server: string
): Promise<{
  password: string;
  publicKey: string;
}> => {
  try {
    const credential = await signWithPasskey(getLoginChallenge(name));
    const response = credential.response as AuthenticatorAssertionResponse;

    const addedPublicks = (await getPasskeyCredentials(cl, `@${name}:${server}`)).credentials;

    let choseCredential = null;
    // eslint-disable-next-line no-restricted-syntax
    for (const addedPublick of addedPublicks) {
      try {
        const pk = await recoverPublicKey(addedPublick.publicKey);
        const res = await verifySignature(
          pk,
          response.signature,
          response.clientDataJSON,
          response.authenticatorData
        );
        if (res) {
          choseCredential = addedPublick;
          break;
        }
      } catch (error) {
        console.error(error);
      }
    }
    if (!choseCredential) {
      throw new Error('Publick not found');
    }

    const password = JSON.stringify({
      publicKey: choseCredential.publicKey,
      assertion: {
        type: credential.type,
        rawId: toBase64Url(credential.rawId),
        id: credential.id,
        response: {
          authenticatorData: toBase64Url(response.authenticatorData),
          clientDataJSON: toBase64Url(response.clientDataJSON),
          signature: toBase64Url(response.signature),
        },
      },
    });
    return { password, publicKey: choseCredential.publicKey };
  } catch (error: any) {
    console.error(error);
    throw new Error('Failed to login passkey');
  }
};

export interface WebAuthnSignature {
  authenticatorData: ArrayBuffer;
  clientDataJSON: ArrayBuffer;
  challengeIndex: number;
  typeIndex: number;
  r: Uint8Array;
  s: Uint8Array;
}

export const signMessageWithPasskey = async (message: Hex): Promise<WebAuthnSignature> => {
  try {
    // const prefix = '\x19Ethereum Signed Message:\n';
    // const messageBytes = toBytes(message);
    // const prefixBytes = stringToBytes(prefix);
    // const messageBytesLength = messageBytes.length.toString();
    // const messageBytesLengthBytes = stringToBytes(messageBytesLength);
    // const prefixedMessageBytes = new Uint8Array(
    //   prefixBytes.length + messageBytesLengthBytes.length + messageBytes.length
    // );
    // prefixedMessageBytes.set(prefixBytes);
    // prefixedMessageBytes.set(messageBytesLengthBytes, prefixBytes.length);
    // prefixedMessageBytes.set(messageBytes, prefixBytes.length + messageBytesLengthBytes.length);

    // const prefixedMessageHash = keccak256(prefixedMessageBytes);
    // console.log('message', message);
    const prefixedMessageHash = hashMessage({ raw: message });
    console.log('prefixedMessageHash', prefixedMessageHash);

    const challenge = hexToBytes(prefixedMessageHash);
    // const challenge = hexToArrayBuffer(prefixedMessageHash);
    // const challenge = hexToUint8Array(prefixedMessageHash);

    console.log('challenge', challenge);
    console.log('challengeBase64Url', toBase64Url(challenge));

    const { response } = await signWithPasskey(challenge);
    const { signature, authenticatorData, clientDataJSON } =
      response as AuthenticatorAssertionResponse;

    const derSig = new Uint8Array(signature);
    const { r, s } = parseDER(derSig);

    const clientDataString = new TextDecoder().decode(clientDataJSON);
    console.log('signature', signature);
    console.log('clientDataJSON', clientDataJSON);
    console.log('clientDataString', clientDataString);
    console.log('authenticatorData', authenticatorData);
    console.log('authenticatorDataHex', toHex(new Uint8Array(authenticatorData)));

    // const isValid = await verifySignature(
    //   await recoverPublicKey(
    //     'Pjc5MyHMH95_GoRBaioxQXORRmGncGRaOJq3NqhcpxtAkpfibfmTnpfYUpx-38G9VwfAhO9LwFKE2H087q7UJQ'
    //   ),
    //   signature,
    //   clientDataJSON,
    //   authenticatorData
    // );
    // console.log('isValid', isValid);

    return {
      authenticatorData,
      clientDataJSON,
      challengeIndex: clientDataString.indexOf('"challenge"'),
      typeIndex: clientDataString.indexOf('"type"'),
      r,
      s,
    };
  } catch (error) {
    console.error('signMessageWithPasskey failed:', error);
    throw error;
  }
};
