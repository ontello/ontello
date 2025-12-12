import { MatrixClient } from 'matrix-js-sdk';
import { getMxIdServer } from './matrix';

/**
 * Convert Matrix ID (@username:server.name) to ONT ID (username.server.name)
 * @example
 * mxidToOntid("@chichi:ont.im") // returns "chichi.ont.im"
 * mxidToOntid("@alice:matrix.org") // returns "alice.matrix.org"
 * mxidToOntid("invalid") // returns null
 * @param mxid Matrix ID string
 * @returns ONT ID string or null if invalid format
 */
export function mxidToOntid(mxid: string): string | null {
  if (!mxid) return null;

  // Only allow alphanumeric characters, underscores, and hyphens in usernames
  const regex = /^@([a-zA-Z0-9_-]+):(.+)$/;
  const match = mxid.match(regex);

  if (!match || !match[1] || !match[2]) return null;
  const [, username, serverName] = match;

  return `${username}.${'ont.im'}`;
}

/**
 * Convert ONT ID (username.server.name) to Matrix ID (@username:server.name)
 * @example
 * ontidToMxid("chichi.ont.im", mx) // returns "@chichi:<mx server>"
 * ontidToMxid("alice.ont.im", mx) // returns "@alice:<mx server>"
 * ontidToMxid("invalid", mx) // returns null
 * @param ontid ONT ID string (username.ont.im)
 * @param mx Matrix client used to determine homeserver
 * @returns Matrix ID string or null if invalid format
 */
export function ontidToMxid(ontid: string, mx: MatrixClient): string | null {
  if (!ontid) return null;

  // Extract username from <username>.ont.im
  const usernameMatch = ontid.match(/^([a-zA-Z0-9_-]+)\.ont\.im$/);
  if (!usernameMatch || !usernameMatch[1]) return null;

  const serverName = getMxIdServer(mx.getUserId() ?? '');
  if (!serverName) return null;

  return `@${usernameMatch[1]}:${serverName}`;
}

/**
 * Check if a string is a valid ONT ID
 * @example
 * isValidOntid("chichi.ont.im") // returns true
 * isValidOntid("alice.matrix.org") // returns true
 * isValidOntid("invalid") // returns false
 * @param ontid String to check
 * @returns boolean
 */
export function isValidOntid(ontid: string): boolean {
  if (!ontid) return false;
  return /^[a-zA-Z0-9_-]+\.ont\.im$/.test(ontid);
}
