const REQUEST_TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 2;
const PLACEHOLDER_EMAIL_DOMAIN = '@reelxpress-inquiry.com';

const DEFAULT_SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbwBIPLN2lEYdP2QLKKWaEdG-cUi2i0efNH8mPIvG5RJrQ9hxhWynKjYQnA50XB99p7C/exec';
const DEFAULT_SHEETS_WEBHOOK_SECRET =
  'ed4b5381a90fdc83509c134b1db5bfb37ee2542c2eb5b520d85b88319d429958';

export function isGoogleSheetsSyncEnabled() {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL || DEFAULT_SHEETS_WEBHOOK_URL;
  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET || DEFAULT_SHEETS_WEBHOOK_SECRET;
  return Boolean(url && secret);
}

function toSheetLead(enquiry) {
  const email = String(enquiry.email || '');
  return {
    id: enquiry.id,
    createdAt: enquiry.createdAt,
    customerName: enquiry.customerName,
    phone: enquiry.phone,
    email: email.endsWith(PLACEHOLDER_EMAIL_DOMAIN) ? '' : email,
    selectedService: enquiry.selectedService,
    eventDate: enquiry.eventDate,
    city: enquiry.city,
    locality: enquiry.locality,
    companyName: enquiry.companyName,
    message: enquiry.enquiryMessage || enquiry.message,
    sourcePage: enquiry.sourcePage,
  };
}

async function postOnce(url, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      redirect: 'follow',
      signal: controller.signal,
      cache: 'no-store',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      throw new Error(`Sheet webhook rejected lead (HTTP ${res.status}${data?.error ? `, ${data.error}` : ''})`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export async function sendLeadToGoogleSheet(enquiry) {
  if (!isGoogleSheetsSyncEnabled() || !enquiry?.id) return { skipped: true };

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || DEFAULT_SHEETS_WEBHOOK_URL;
  const webhookSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET || DEFAULT_SHEETS_WEBHOOK_SECRET;

  const body = JSON.stringify({
    secret: webhookSecret,
    lead: toSheetLead(enquiry),
  });

  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await postOnce(webhookUrl, body);
    } catch (err) {
      lastError = err;
      if (err?.message?.includes('unauthorized')) break;
    }
  }

  console.error(`[GoogleSheets] Failed to sync enquiry ${enquiry.id}: ${lastError?.message}`);
  return { ok: false };
}
