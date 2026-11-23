import fs from 'fs';
import path from 'path';
import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const DATA_DIR = path.join(process.cwd(), 'data');
const TOKEN_FILE = path.join(DATA_DIR, 'google_calendar_token.json');
const CONFIG_FILE = path.join(DATA_DIR, 'google_calendar_config.json');

// In-memory cache for fast serverless execution across warm Lambda invocations
let memoryConfigCache = null;
let memoryTokensCache = null;

/**
 * Safely writes a file to disk, falling back to /tmp if process.cwd() is read-only (e.g. AWS Lambda / Vercel)
 */
function safeWriteFile(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (err) {
    // If running in a read-only filesystem (EROFS on Vercel/Lambda), fallback to /tmp
    try {
      const tmpDir = path.join('/tmp', 'reelexpress_data');
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      const tmpPath = path.join(tmpDir, path.basename(filePath));
      fs.writeFileSync(tmpPath, content, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Safely reads a file from disk, checking local data directory and /tmp fallback
 */
function safeReadFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch {}
  try {
    const tmpPath = path.join('/tmp', 'reelexpress_data', path.basename(filePath));
    if (fs.existsSync(tmpPath)) {
      return fs.readFileSync(tmpPath, 'utf-8');
    }
  } catch {}
  return null;
}

/**
 * Safely removes a file from disk and /tmp fallback
 */
function safeUnlinkFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {}
  try {
    const tmpPath = path.join('/tmp', 'reelexpress_data', path.basename(filePath));
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
  } catch {}
}

/**
 * Reads Google OAuth client configuration from in-memory cache, Firestore (production/Vercel),
 * safe local disk files, or environment variables.
 */
export async function getGoogleCalendarConfig() {
  let fileConfig = {};

  // 1. Check in-memory cache
  if (memoryConfigCache?.clientId && memoryConfigCache?.clientSecret) {
    fileConfig = { ...memoryConfigCache };
  }

  // 2. Check Firestore (primary persistent storage across all Vercel serverless instances)
  if (!fileConfig.clientId && isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'cms_settings', 'google_calendar');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const d = snap.data();
        if (d?.clientId) {
          fileConfig = {
            clientId: d.clientId || '',
            clientSecret: d.clientSecret || '',
            redirectUri: d.redirectUri || '',
          };
          memoryConfigCache = { ...fileConfig };
        }
      }
    } catch (err) {
      console.warn('[GoogleCalendar] Firestore config read notice:', err.message);
    }
  }

  // 3. Check disk file (local dev data/ or /tmp fallback)
  if (!fileConfig.clientId) {
    const raw = safeReadFile(CONFIG_FILE);
    if (raw) {
      try {
        fileConfig = JSON.parse(raw);
        memoryConfigCache = { ...fileConfig };
      } catch {}
    }
  }

  // 4. Fallback to process.env
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    fileConfig.clientId ||
    '';

  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET ||
    fileConfig.clientSecret ||
    '';

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    fileConfig.redirectUri ||
    '';

  const isConfigured = Boolean(
    clientId &&
    clientId.length > 5 &&
    clientSecret &&
    clientSecret.length > 3
  );

  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured,
  };
}

/**
 * Saves Google OAuth client configuration to in-memory cache, Firestore (for Vercel),
 * and local safe disk files without throwing read-only filesystem errors.
 */
export async function saveGoogleCalendarConfig({ clientId, clientSecret, redirectUri = '' }) {
  const config = {
    clientId: (clientId || '').trim(),
    clientSecret: (clientSecret || '').trim(),
    redirectUri: (redirectUri || '').trim(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Update in-memory cache immediately
  memoryConfigCache = { ...(memoryConfigCache || {}), ...config };

  // 2. Persist to Firestore (handles Vercel read-only filesystem flawlessly)
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'cms_settings', 'google_calendar');
      await setDoc(
        docRef,
        {
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          redirectUri: config.redirectUri,
          updatedAt: config.updatedAt,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[GoogleCalendar] Firestore config save notice:', err.message);
    }
  }

  // 3. Local disk safe write (non-blocking, never throws EROFS on Vercel)
  safeWriteFile(CONFIG_FILE, JSON.stringify(config, null, 2));

  return { success: true };
}

/**
 * Reads saved Google OAuth tokens from in-memory cache, Firestore, or local disk fallback
 */
export async function getStoredTokens() {
  // 1. In-memory cache
  if (
    memoryTokensCache &&
    memoryTokensCache.connected &&
    (memoryTokensCache.tokens?.access_token || memoryTokensCache.tokens?.refresh_token)
  ) {
    return memoryTokensCache;
  }

  // 2. Firestore persistence (works across serverless instances and cold starts on Vercel)
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'cms_settings', 'google_calendar');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const d = snap.data();
        if (d && d.connected && (d.tokens?.access_token || d.tokens?.refresh_token)) {
          const payload = {
            connected: true,
            email: d.email || 'Admin Account',
            name: d.name || '',
            tokens: d.tokens,
            connectedAt: d.connectedAt || null,
            updatedAt: d.updatedAt || null,
          };
          memoryTokensCache = payload;
          return payload;
        }
      }
    } catch (err) {
      console.warn('[GoogleCalendar] Firestore tokens read notice:', err.message);
    }
  }

  // 3. Safe read from disk /tmp
  const raw = safeReadFile(TOKEN_FILE);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (data && (data.tokens?.access_token || data.tokens?.refresh_token)) {
        memoryTokensCache = data;
        return data;
      }
    } catch {}
  }

  return null;
}

/**
 * Saves Google OAuth tokens to in-memory cache, Firestore, and local safe disk files
 */
export async function saveTokens({ tokens, email = '', name = '' }) {
  const existing = (await getStoredTokens()) || {};

  const mergedTokens = {
    ...(existing.tokens || {}),
    ...(tokens || {}),
  };

  const payload = {
    connected: true,
    email: email || existing.email || 'Admin Account',
    name: name || existing.name || '',
    tokens: mergedTokens,
    connectedAt: existing.connectedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Update in-memory cache
  memoryTokensCache = payload;

  // 2. Persist to Firestore
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'cms_settings', 'google_calendar');
      await setDoc(
        docRef,
        {
          connected: true,
          email: payload.email,
          name: payload.name,
          tokens: mergedTokens,
          connectedAt: payload.connectedAt,
          updatedAt: payload.updatedAt,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[GoogleCalendar] Firestore tokens save notice:', err.message);
    }
  }

  // 3. Local disk safe write (non-blocking)
  safeWriteFile(TOKEN_FILE, JSON.stringify(payload, null, 2));

  return payload;
}

/**
 * Clears saved Google OAuth tokens (disconnect)
 */
export async function clearTokens() {
  memoryTokensCache = null;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'cms_settings', 'google_calendar');
      await setDoc(
        docRef,
        {
          connected: false,
          tokens: null,
          email: null,
          name: null,
          disconnectedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[GoogleCalendar] Firestore disconnect notice:', err.message);
    }
  }

  safeUnlinkFile(TOKEN_FILE);
  return { success: true };
}

/**
 * Gets connection status for client (safe: never returns secrets or refresh tokens)
 */
export async function getCalendarConnectionStatus() {
  const config = await getGoogleCalendarConfig();
  const stored = await getStoredTokens();

  if (!stored || !stored.connected) {
    return {
      configured: config.isConfigured,
      hasClientId: Boolean(config.clientId),
      connected: false,
      email: null,
      name: null,
      connectedAt: null,
    };
  }

  return {
    configured: config.isConfigured,
    hasClientId: Boolean(config.clientId),
    connected: true,
    email: stored.email || null,
    name: stored.name || null,
    connectedAt: stored.connectedAt || null,
  };
}

/**
 * Generates official Google OAuth 2.0 authorization URL
 */
export async function getGoogleAuthUrl(requestOrigin = '') {
  const config = await getGoogleCalendarConfig();
  if (!config.clientId) {
    throw new Error('Google Client ID is not configured. Please add it in settings.');
  }

  const origin = requestOrigin.replace(/\/$/, '');
  const redirectUri = config.redirectUri || `${origin}/api/google-calendar/callback`;

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent', // Ensures refresh_token is returned
    include_granted_scopes: 'true',
  });

  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    redirectUri,
  };
}

/**
 * Exchanges authorization code for tokens
 */
export async function exchangeCodeForTokens(code, requestOrigin = '') {
  const config = await getGoogleCalendarConfig();
  if (!config.clientId || !config.clientSecret) {
    throw new Error('Google OAuth credentials (Client ID or Client Secret) are missing.');
  }

  const origin = requestOrigin.replace(/\/$/, '');
  const redirectUri = config.redirectUri || `${origin}/api/google-calendar/callback`;

  const tokenParams = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString(),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || 'Failed to exchange authorization code for tokens.');
  }

  const tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type || 'Bearer',
    scope: data.scope,
    expiry_date: data.expires_in ? Date.now() + data.expires_in * 1000 : null,
  };

  // Fetch admin profile email to identify account
  let email = '';
  let name = '';
  try {
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (profileRes.ok) {
      const profile = await profileRes.json();
      email = profile.email || '';
      name = profile.name || '';
    }
  } catch (err) {
    console.warn('[GoogleCalendar] Profile fetch notice:', err.message);
  }

  const saved = await saveTokens({ tokens, email, name });
  return {
    tokens,
    email,
    name,
    saved,
  };
}

/**
 * Returns a valid access token, automatically refreshing if expired
 */
export async function getValidAccessToken() {
  const stored = await getStoredTokens();
  if (!stored || !stored.tokens) {
    throw new Error('NOT_CONNECTED');
  }

  const { tokens } = stored;
  const now = Date.now();

  // If token is still valid for at least 60 seconds, reuse it
  if (tokens.access_token && tokens.expiry_date && tokens.expiry_date > now + 60 * 1000) {
    return tokens.access_token;
  }

  // If no refresh token, cannot refresh
  if (!tokens.refresh_token) {
    throw new Error('AUTH_EXPIRED_NO_REFRESH');
  }

  // Refresh the access token using Google's token endpoint
  const config = await getGoogleCalendarConfig();
  if (!config.clientId || !config.clientSecret) {
    throw new Error('Google OAuth credentials missing for token refresh.');
  }

  const refreshParams = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: tokens.refresh_token,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: refreshParams.toString(),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    console.error('[GoogleCalendar] Refresh error:', data);
    if (data.error === 'invalid_grant') {
      await clearTokens();
      throw new Error('TOKEN_REVOKED');
    }
    throw new Error(data.error_description || data.error || 'Failed to refresh Google Calendar access token.');
  }

  const updatedTokens = {
    ...tokens,
    access_token: data.access_token,
    expiry_date: data.expires_in ? Date.now() + data.expires_in * 1000 : Date.now() + 3600 * 1000,
  };

  await saveTokens({ tokens: updatedTokens, email: stored.email, name: stored.name });
  return updatedTokens.access_token;
}

/**
 * Parses shoot date & time strings into RFC3339 format for Google Calendar (IST timezone)
 */
export function parseShootDateTime(eventDateRaw = '', eventTimeRaw = '', message = '') {
  if (!eventDateRaw || !String(eventDateRaw).trim()) {
    return {
      isValid: false,
      error: 'Shoot date is required to create a Google Calendar event.',
    };
  }

  const rawDateStr = String(eventDateRaw).trim();
  let dateIsoString = null;

  // Format 1: YYYY-MM-DD
  const ymdMatch = rawDateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    dateIsoString = `${y}-${m}-${d}`;
  }

  // Format 2: DD/MM/YYYY or DD-MM-YYYY
  if (!dateIsoString) {
    const dmyMatch = rawDateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0');
      const m = dmyMatch[2].padStart(2, '0');
      const y = dmyMatch[3];
      dateIsoString = `${y}-${m}-${d}`;
    }
  }

  // Format 3: JavaScript Date parsable string
  if (!dateIsoString) {
    const parsed = new Date(rawDateStr);
    if (!isNaN(parsed.getTime())) {
      dateIsoString = parsed.toISOString().split('T')[0];
    }
  }

  if (!dateIsoString) {
    return {
      isValid: false,
      error: `Could not parse shoot date "${eventDateRaw}". Please use YYYY-MM-DD format.`,
    };
  }

  // Parse time or fallback to 10:00 AM tentatively
  let startHour = 10;
  let startMin = 0;
  let durationHours = 3;
  let isTentativeTime = true;

  const rawTimeCandidate = String(eventTimeRaw || '').trim() || String(message || '');
  const ampmMatch = rawTimeCandidate.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  const h24Match = String(eventTimeRaw || '').trim().match(/^(\d{1,2}):(\d{2})$/);

  if (ampmMatch) {
    isTentativeTime = false;
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPm = ampmMatch[3].toLowerCase() === 'pm';
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
    startHour = hour;
    startMin = minute;
  } else if (h24Match) {
    isTentativeTime = false;
    startHour = parseInt(h24Match[1], 10);
    startMin = parseInt(h24Match[2], 10);
  }

  const endHour = (startHour + durationHours) % 24;
  const endMin = startMin;

  const startHourStr = String(startHour).padStart(2, '0');
  const startMinStr = String(startMin).padStart(2, '0');
  const endHourStr = String(endHour).padStart(2, '0');
  const endMinStr = String(endMin).padStart(2, '0');

  // RFC3339 strings with IST offset (+05:30)
  const startDateTime = `${dateIsoString}T${startHourStr}:${startMinStr}:00+05:30`;
  const endDateTime = `${dateIsoString}T${endHourStr}:${endMinStr}:00+05:30`;

  const formattedDate = new Date(`${dateIsoString}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const formattedTime = isTentativeTime
    ? '10:00 AM IST (Tentative)'
    : `${startHour % 12 || 12}:${String(startMin).padStart(2, '0')} ${startHour >= 12 ? 'PM' : 'AM'} IST`;

  return {
    isValid: true,
    dateIsoString,
    startDateTime,
    endDateTime,
    isTentativeTime,
    formattedDate,
    formattedTime,
  };
}

/**
 * Creates an event in Google Calendar using the official Calendar v3 REST API
 */
export async function createGoogleCalendarEvent(enquiry) {
  const customerName = (enquiry.customerName || enquiry.fullName || enquiry.name || 'Client').trim();
  const selectedService = (enquiry.selectedService || enquiry.serviceType || enquiry.type || 'Shoot').trim();
  const phone = (enquiry.phone || 'Not provided').trim();
  const email = (enquiry.email || 'Not provided').trim();
  const city = (enquiry.city || 'Bengaluru').trim();
  const sourcePage = (enquiry.sourcePage || enquiry.source || 'Website').trim();
  const message = (enquiry.enquiryMessage || enquiry.message || enquiry.notes || 'None').trim();
  const enquiryId = enquiry.id || 'N/A';

  // 1. Date & Time Validation
  const dateTimeResult = parseShootDateTime(
    enquiry.eventDate || enquiry.date,
    enquiry.eventTime || enquiry.time,
    message
  );

  if (!dateTimeResult.isValid) {
    throw new Error(dateTimeResult.error);
  }

  // 2. Obtain a valid access token
  const accessToken = await getValidAccessToken();

  // 3. Build Google Calendar Event Payload
  const eventTitle = `${customerName} - ${selectedService}${
    dateTimeResult.isTentativeTime ? ' (Tentative Time)' : ''
  }`;

  const eventDescription = [
    `📅 REELXPRESS SHOOT BOOKING`,
    `----------------------------------------`,
    `👤 Customer: ${customerName}`,
    `📞 Phone / WhatsApp: ${phone}`,
    `✉️ Email: ${email}`,
    `🎬 Service / Package: ${selectedService}`,
    `📍 Location: ${city}, India`,
    `🌐 Enquiry Source: ${sourcePage}`,
    `⏰ Shoot Time: ${dateTimeResult.formattedTime}`,
    `----------------------------------------`,
    `💬 Client Message / Notes:`,
    `${message}`,
    `----------------------------------------`,
    `🆔 Enquiry ID: ${enquiryId}`,
    `✨ Scheduled automatically via reelXpress CMS`,
  ].join('\n');

  const eventLocation = `${city}, India`;

  const calendarPayload = {
    summary: eventTitle,
    description: eventDescription,
    location: eventLocation,
    start: {
      dateTime: dateTimeResult.startDateTime,
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: dateTimeResult.endDateTime,
      timeZone: 'Asia/Kolkata',
    },
    // Requirement 2: 30 minutes before reminder
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'email', minutes: 30 },
      ],
    },
    colorId: '9', // Blueberry / Google Blue accent in Google Calendar
  };

  // 4. Call official Google Calendar v3 API
  const calendarApiUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const response = await fetch(calendarApiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(calendarPayload),
  });

  const resData = await response.json();

  if (!response.ok || resData.error) {
    const errorMsg =
      resData.error?.message ||
      resData.error_description ||
      'Failed to create event in Google Calendar.';
    throw new Error(errorMsg);
  }

  return {
    success: true,
    eventId: resData.id,
    eventUrl: resData.htmlLink || `https://calendar.google.com/calendar/r/eventedit/${resData.id}`,
    summary: resData.summary,
    start: resData.start?.dateTime,
    isTentativeTime: dateTimeResult.isTentativeTime,
    formattedDate: dateTimeResult.formattedDate,
    formattedTime: dateTimeResult.formattedTime,
  };
}
