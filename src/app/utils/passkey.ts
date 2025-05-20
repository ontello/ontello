/* eslint-disable no-await-in-loop */
import { type MatrixClient } from "matrix-js-sdk";

export function hexToArrayBuffer(hex: string): ArrayBuffer {
  const buffer = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    buffer[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return buffer.buffer;
}

export function toBase64Url(input: ArrayBuffer): string {
  let base64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(input))))
  base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return base64;
}
export function parsePublicKeyPoints(spkiBuffer: ArrayBuffer): { x: ArrayBuffer; y: ArrayBuffer, xy: ArrayBuffer } {
  const bytes = new Uint8Array(spkiBuffer);
  const PUBKEY_LENGTH = 64;
  const pubKeyBytes = bytes.slice(-PUBKEY_LENGTH);

  return {
    x: pubKeyBytes.slice(0, 32).buffer,
    y: pubKeyBytes.slice(32).buffer,
    xy: pubKeyBytes.buffer,
  };
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
  if (derBytes[0] !== 0x30) throw new Error("Invalid DER format: missing SEQUENCE");

  let offset = 2; // 跳过 SEQUENCE (0x30) 和总长度

  if (derBytes[offset] !== 0x02) throw new Error("Invalid DER format: missing INTEGER for r");
  const rLen = derBytes[offset + 1]; // r 的长度
  let r = derBytes.slice(offset + 2, offset + 2 + rLen);

  offset += 2 + rLen;

  if (derBytes[offset] !== 0x02) throw new Error("Invalid DER format: missing INTEGER for s");
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

async function recoverPublicKey(publicKeyBase64Url: string): Promise<CryptoKey> {
  const xy = fromBase64Url(publicKeyBase64Url);
  const uncompressedPubkey = new Uint8Array(65);
  uncompressedPubkey[0] = 0x04;
  uncompressedPubkey.set(new Uint8Array(xy), 1);

  const publicKey = await crypto.subtle.importKey(
    "raw",
    uncompressedPubkey,
    {
      name: "ECDSA",
      namedCurve: "P-256"
    },
    true,
    ["verify"]
  );

  return publicKey;
}

async function verifySignature(publicKey: CryptoKey, signature: ArrayBuffer, clientDataJSON: ArrayBuffer, authenticatorData: ArrayBuffer): Promise<boolean> {
  try {
    const derSig = new Uint8Array(signature);
    const { r, s } = parseDER(derSig);
    const rawSignature = new Uint8Array(r.length + s.length);
    rawSignature.set(r);
    rawSignature.set(s, r.length);

    const clientDataHash = await crypto.subtle.digest("SHA-256", clientDataJSON);
    const verifyData = new Uint8Array(authenticatorData.byteLength + clientDataHash.byteLength);
    verifyData.set(new Uint8Array(authenticatorData), 0);
    verifyData.set(new Uint8Array(clientDataHash), authenticatorData.byteLength);

    const isValid = await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      publicKey,
      rawSignature.buffer,
      verifyData.buffer,
    );
    return isValid
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

const genChallenge = (user: string, prefix: string): ArrayBuffer => {
  const timestampInSeconds = Math.floor(Date.now() / 1000);
  const challenge = `${prefix} ${user}.ont.im at ${timestampInSeconds}`
  return (new TextEncoder).encode(challenge).buffer
}
const genLoginChallenge = (username: string): ArrayBuffer => genChallenge(username, "Login")

const genRegisterChallenge = (user: string): ArrayBuffer => genChallenge(user, "Register")


export const registerWithPasskey = async (name: string): Promise<string> => {
  try {

    const userIdArray = new TextEncoder().encode(name);

    const publicKeyCredentialCreationOptions = {
      challenge: genRegisterChallenge(name),
      // TODO
      rp: {
        name: "Name",
        id: "localhost",
      },
      user: {
        id: userIdArray,
        name,
        displayName: name,
      },
      pubKeyCredParams: [
        {
          type: "public-key",
          alg: -7,
        },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "required",
      },
      timeout: 60000,
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions as any,
    })) as PublicKeyCredential;
    console.log('credential', credential);
    const response = credential.response as AuthenticatorAttestationResponse;

    // const publicKey = response.getPublicKey();
    // if (!publicKey) {
    //   throw new Error("Failed to get public key");
    // }
    // const { xy } = parsePublicKeyPoints(publicKey);
    // const publicKeyBase64Url = toBase64Url(xy);
    // console.log('publicKeyBase64Url', publicKeyBase64Url);

    const password = JSON.stringify(
      {
        attestation: {
          type: credential.type,
          rawId: toBase64Url(credential.rawId),
          id: credential.id,
          response: {
            attestationObject: toBase64Url(response.attestationObject),
            clientDataJSON: toBase64Url(response.clientDataJSON),
          }
        }
      }
    )
    return password;
  } catch (error) {
    throw new Error("Failed to register passkey");
  }
};
export const loginWithPasskey = async (name: string, cl: MatrixClient, serverName: string): Promise<string> => {
  try {
    const publicKeyCredentialRequestOptions = {
      challenge: genLoginChallenge(name),
      rpId: "localhost",
      timeout: 60000,
      userVerification: "required",
    };

    const credential = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions as any,
    })) as PublicKeyCredential;

    const response = credential.response as AuthenticatorAssertionResponse;
    const addedPublicks = await cl.getPasskeyCredentials(`@${name}:${serverName}`);

    let choseCredential = null
    // eslint-disable-next-line no-restricted-syntax
    for (const addedPublick of addedPublicks) {
      const pk = await recoverPublicKey(addedPublick.publicKey);
      const res = await verifySignature(pk, response.signature, response.clientDataJSON, response.authenticatorData);

      if (res) {
        choseCredential = addedPublick;
        break;
      }
    }
    if (!choseCredential) {
      console.log('err');
      throw new Error("Failed to verify passkey");
    }

    const password = JSON.stringify(
      {
        publicKey: choseCredential.publicKey,
        assertion: {
          type: credential.type,
          rawId: toBase64Url(credential.rawId),
          id: credential.id,
          response: {
            authenticatorData: toBase64Url(response.authenticatorData),
            clientDataJSON: toBase64Url(response.clientDataJSON),
            signature: toBase64Url(response.signature),
          }
        }
      }
    )
    return password;
  } catch (error: any) {
    // console.error(error)
    throw new Error("Failed to login passkey");
    // throw new Error(error.message);
  }
}
