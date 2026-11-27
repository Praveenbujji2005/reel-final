export function sanitizeString(input, maxLength = 500) {
  if (typeof input !== 'string') return '';

  let sanitized = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/(javascript|vbscript|data):/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

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

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(trimmed);
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const regex = /^\+?[0-9]{10,15}$/;
  return regex.test(cleaned);
}

export function sanitizeFileName(filename) {
  if (!filename || typeof filename !== 'string') return 'file';
  const base = filename.replace(/^.*[\\\/]/, '');
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return safe.replace(/^\.+/, 'safe_');
}
