/**
 * Input sanitization and validation utilities for ReelXpress
 */

/**
 * Strips HTML tags, script injection patterns, null bytes, and trims whitespace.
 * @param {string} input 
 * @param {number} maxLength 
 * @returns {string}
 */
export function sanitizeString(input, maxLength = 500) {
  if (typeof input !== 'string') return '';

  let sanitized = input
    // Remove null bytes and control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Strip HTML/XML tags
    .replace(/<[^>]*>/g, '')
    // Strip common script/event injection keywords
    .replace(/(javascript|vbscript|data):/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Escapes special HTML characters to prevent XSS.
 * @param {string} str 
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates an email address against RFC 5322 simplified pattern.
 * @param {string} email 
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(trimmed);
}

/**
 * Validates a mobile/phone number (10 to 15 digits with optional '+' prefix).
 * @param {string} phone 
 * @returns {boolean}
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const regex = /^\+?[0-9]{10,15}$/;
  return regex.test(cleaned);
}

/**
 * Sanitizes a file name to prevent path traversal and shell injection.
 * @param {string} filename 
 * @returns {string}
 */
export function sanitizeFileName(filename) {
  if (!filename || typeof filename !== 'string') return 'file';
  // Strip paths (../, ..\, etc.)
  const base = filename.replace(/^.*[\\\/]/, '');
  // Keep only alphanumeric, hyphens, dots, underscores
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Avoid leading dots (.htaccess, .env)
  return safe.replace(/^\.+/, 'safe_');
}
