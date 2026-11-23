import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const TOKEN_FILE = path.join(DATA_DIR, 'google_calendar_token.json');
const CONFIG_FILE = path.join(DATA_DIR, 'google_calendar_config.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {}
  }
}

/**
 * Reads Google OAuth client configuration from env vars or local config file
 */
export function getGoogleCalendarConfig() {
  ensureDataDir();

  let fileConfig = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch {}
  }

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
 * Saves Google OAuth client configuration locally
 */
export function saveGoogleCalendarConfig({ clientId, clientSecret, redirectUri = '' }) {
  ensureDataDir();
  const config = {
    clientId: (clientId || '').trim(),
    clientSecret: (clientSecret || '').trim(),
    redirectUri: (redirectUri || '').trim(),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  return { success: true };
}

/**
 * Reads saved Google OAuth tokens
 */
export function getStoredTokens() {
  ensureDataDir();
  if (!fs.existsSync(TOKEN_FILE)) return null;
  try {
    const raw = fs.readFileSync(TOKEN_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (data && (data.tokens?.access_token || data.tokens?.refresh_token)) {
      return data;
    }
  } catch (err) {
    console.warn('[GoogleCalendar] Token read warning:', err.message);
  }
  return null;
}

/**
 * Saves Google OAuth tokens
 */
export function saveTokens({ tokens, email = '', name = '' }) {
  ensureDataDir();
  const existing = getStoredTokens() || {};

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

  fs.writeFileSync(TOKEN_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  return payload;
}

/**
 * Clears saved Google OAuth tokens (disconnect)
 */
export function clearTokens() {
  ensureDataDir();
  if (fs.existsSync(TOKEN_FILE)) {
    try {
      fs.unlinkSync(TOKEN_FILE);
    } catch {}
  }
  return { success: true };
}

/**
 * Gets connection status for client (safe: never returns secrets or refresh tokens)
 */
export function getCalendarConnectionStatus() {
  const config = getGoogleCalendarConfig();
  const stored = getStoredTokens();

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
export function getGoogleAuthUrl(requestOrigin = '') {
  const config = getGoogleCalendarConfig();
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
  const config = getGoogleCalendarConfig();
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

  // Fetch authenticated user's email profile
  let email = '';
  let name = '';
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (userRes.ok) {
      const userInfo = await userRes.json();
      email = userInfo.email || '';
      name = userInfo.name || '';
    }
  } catch (err) {
    console.warn('[GoogleCalendar] User info warning:', err.message);
  }

  const saved = saveTokens({ tokens, email, name });
  return {
    success: true,
    email: saved.email,
    name: saved.name,
    connectedAt: saved.connectedAt,
  };
}

/**
 * Returns a valid access token, automatically refreshing if expired
 */
export async function getValidAccessToken() {
  const stored = getStoredTokens();
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
  const config = getGoogleCalendarConfig();
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
      clearTokens();
      throw new Error('TOKEN_REVOKED');
    }
    throw new Error(data.error_description || data.error || 'Failed to refresh Google Calendar access token.');
  }

  const updatedTokens = {
    ...tokens,
    access_token: data.access_token,
    expiry_date: data.expires_in ? Date.now() + data.expires_in * 1000 : Date.now() + 3600 * 1000,
  };

  saveTokens({ tokens: updatedTokens, email: stored.email, name: stored.name });
  return updatedTokens.access_token;
}

/**
 * Parses shoot date & time strings into RFC3339 format for Google Calendar (IST timezone)
 */
export function parseShootDateTime(eventDateRaw = '', eventTimeRaw = '', message = '') {
  if (!eventDateRaw || !String(eventDateRaw).trim()) {
    return {
      isValid: false,
      error: 'Shoot Date is missing from this enquiry.',
    };
  }

  const rawDateStr = String(eventDateRaw).trim();
  let dateObj = null;

  // Pattern 1: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(rawDateStr)) {
    const [year, month, day] = rawDateStr.split('T')[0].split('-').map(Number);
    dateObj = { year, month, day };
  }
  // Pattern 2: DD/MM/YYYY or DD-MM-YYYY
  else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(rawDateStr)) {
    const parts = rawDateStr.split(/[/-]/).map(Number);
    dateObj = { day: parts[0], month: parts[1], year: parts[2] };
  }
  // Pattern 3: Standard Date parse
  else {
    const parsed = new Date(rawDateStr);
    if (!isNaN(parsed.getTime())) {
      dateObj = {
        year: parsed.getFullYear(),
        month: parsed.getMonth() + 1,
        day: parsed.getDate(),
      };
    }
  }

  if (!dateObj || !dateObj.year || !dateObj.month || !dateObj.day) {
    return {
      isValid: false,
      error: `Invalid shoot date format: "${rawDateStr}".`,
    };
  }

  // Format YYYY-MM-DD
  const yyyy = String(dateObj.year);
  const mm = String(dateObj.month).padStart(2, '0');
  const dd = String(dateObj.day).padStart(2, '0');
  const dateIsoString = `${yyyy}-${mm}-${dd}`;

  // Time extraction
  let isTentativeTime = true;
  let startHour = 10;
  let startMin = 0;
  let durationHours = 2;

  const combinedTimeText = `${eventTimeRaw || ''} ${message || ''}`.toLowerCase();

  // Check 12-hour AM/PM pattern: e.g. "11:30 am", "4:00 pm", "5pm", "10 am"
  const ampmMatch = combinedTimeText.match(/\b(1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*(am|pm)\b/);
  // Check 24-hour pattern: e.g. "14:30", "16:00"
  const h24Match = combinedTimeText.match(/\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/);

  if (ampmMatch) {
    isTentativeTime = false;
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPm = ampmMatch[3] === 'pm';
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
