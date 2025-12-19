import { MatrixClient } from 'matrix-js-sdk';
import { getMxIdServer } from './matrix';

const ONTID_DOMAIN = (import.meta.env.VITE_ONTID_DOMAIN ?? '').trim().replace(/^\.+|\.+$/g, '');
const ONTID_SUFFIX = ONTID_DOMAIN ? `.${ONTID_DOMAIN}` : '';

/**
 * Convert Matrix ID (@username:server.name) to ONT ID (username.<domain>)
 * Domain comes from `VITE_ONTID_DOMAIN`.
 * @example
 * mxidToOntid("@chichi:ont.im") // returns "chichi.<domain>"
 * mxidToOntid("@alice:matrix.org") // returns "alice.<domain>"
 * mxidToOntid("invalid") // returns null
 * @param mxid Matrix ID string
 * @returns ONT ID string or null if invalid format
 */
export function mxidToOntid(mxid: string): string | null {
  if (!mxid || !ONTID_SUFFIX) return null;

  // Only allow alphanumeric characters, underscores, and hyphens in usernames
  const match = mxid.match(/^@([a-zA-Z0-9_-]+):/);
  if (!match || !match[1]) return null;
  const username = match[1];

  return `${username}${ONTID_SUFFIX}`;
}

/**
 * Convert ONT ID (username.<domain>) to Matrix ID (@username:server.name)
 * @example
 * ontidToMxid("chichi.<domain>", mx) // returns "@chichi:<mx server>"
 * ontidToMxid("alice.<domain>", mx) // returns "@alice:<mx server>"
 * ontidToMxid("invalid", mx) // returns null
 * @param ontid ONT ID string (username.<domain>)
 * @param mx Matrix client used to determine homeserver
 * @returns Matrix ID string or null if invalid format
 */
export function ontidToMxid(ontid: string, mx: MatrixClient): string | null {
  if (!ontid || !ONTID_SUFFIX) return null;

  if (!ontid.endsWith(ONTID_SUFFIX)) return null;
  const username = ontid.slice(0, -ONTID_SUFFIX.length);
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return null;

  const serverName = getMxIdServer(mx.getUserId() ?? '');
  if (!serverName) return null;

  return `@${username}:${serverName}`;
}

/**
 * Check if a string is a valid ONT ID
 * @example
 * isValidOntid("chichi.<domain>") // returns true
 * isValidOntid("alice.matrix.org") // returns false
 * isValidOntid("invalid") // returns false
 * @param ontid String to check
 * @returns boolean
 */
export function isValidOntid(ontid: string): boolean {
  if (!ontid || !ONTID_SUFFIX) return false;
  if (!ontid.endsWith(ONTID_SUFFIX)) return false;
  const username = ontid.slice(0, -ONTID_SUFFIX.length);
  return /^[a-zA-Z0-9_-]+$/.test(username);
}
