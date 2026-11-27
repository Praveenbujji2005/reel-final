import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 12;
const DEFAULT_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Returns the secret key used for signing session tokens and internal API calls.
 */
export function getAdminSecretKey() {
  const secret = process.env.ADMIN_SECRET_KEY || process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[Security] ADMIN_SECRET_KEY environment variable is required in production.');
    }
    return 'development_fallback_secret_key_reelxpress_2026_minimum_32_chars';
  }
  return secret;
}

/**
 * Hashes a plain-text password using bcrypt.
 * @param {string} password 
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Invalid password provided for hashing.');
  }
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plain password against a bcrypt hash, or securely against a plain secret in dev.
 * @param {string} password 
 * @param {string} storedHashOrPlain 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHashOrPlain) {
  if (!password || !storedHashOrPlain) return false;

  const isBcrypt = storedHashOrPlain.startsWith('$2a$') ||
                   storedHashOrPlain.startsWith('$2b$') ||
                   storedHashOrPlain.startsWith('$2y$');

  if (isBcrypt) {
    try {
      return await bcrypt.compare(password, storedHashOrPlain);
    } catch {
      return false;
    }
  }

  // If stored as plain-text (legacy), compare using timing-safe buffer comparison to prevent timing attacks
  try {
    const pBuf = Buffer.from(String(password));
    const sBuf = Buffer.from(String(storedHashOrPlain));
    if (pBuf.length !== sBuf.length) return false;
    return crypto.timingSafeEqual(pBuf, sBuf);
  } catch {
    return false;
  }
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 * Format: base64url(payload).signature
 */
export function createSessionToken(payload, expiresInSeconds = DEFAULT_SESSION_DURATION_SECONDS) {
  const secret = getAdminSecretKey();
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = {
    ...payload,
    exp,
    iat: Math.floor(Date.now() / 1000),
  };

  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 session token.
 * @param {string} token 
 * @returns {object|null}
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const secret = getAdminSecretKey();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired token
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies admin authentication from an incoming Next.js Request.
 * Supports HttpOnly cookie `admin_session` or `Authorization: Bearer <token|secret>`.
 * @param {Request} request 
 * @returns {object|null}
 */
export function getAdminAuthFromRequest(request) {
  // 1. Check Bearer Authorization Header
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    // Check if token is the master ADMIN_SECRET_KEY
    const secret = getAdminSecretKey();
    if (token === secret) {
      return { sub: 'admin', role: 'admin', authType: 'api_secret' };
    }
    // Check if it is a signed session token
    const decoded = verifySessionToken(token);
    if (decoded) {
      return { ...decoded, authType: 'bearer_token' };
    }
  }

  // 2. Check HttpOnly Cookie `admin_session`
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)admin_session=([^;]+)/);
  if (match) {
    const sessionToken = decodeURIComponent(match[1]);
    const decoded = verifySessionToken(sessionToken);
    if (decoded) {
      return { ...decoded, authType: 'session_cookie' };
    }
  }

  return null;
}

/**
 * Helper to check if request is authenticated as admin.
 * @param {Request} request 
 * @returns {boolean}
 */
export function isRequestAdmin(request) {
  return Boolean(getAdminAuthFromRequest(request));
}
