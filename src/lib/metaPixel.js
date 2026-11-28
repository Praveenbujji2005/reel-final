export const META_PIXEL_ID = '1614601306658299';

const TRACKED_PATHS = new Set(['/', '/contact']);

function isTrackedPage() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return TRACKED_PATHS.has(path);
}

function newEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadMetaPixel() {
  if (typeof window === 'undefined' || window.fbq) return;

  const fbq = function () {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, arguments);
    } else {
      fbq.queue.push(arguments);
    }
  };
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  fbq.disablePushState = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  fbq('set', 'autoConfig', false, META_PIXEL_ID);
  fbq('init', META_PIXEL_ID);
}

export function trackMetaEvent(eventName, params, eventId) {
  if (!isTrackedPage() || typeof window.fbq !== 'function') return;
  if (eventId) {
    window.fbq('track', eventName, params || {}, { eventID: eventId });
  } else {
    window.fbq('track', eventName, params || {});
  }
}

export function trackEnquiryConversion({ source, service } = {}) {
  const id = newEventId();
  const details = {
    content_name: service || 'Enquiry',
    content_category: source || 'website_form',
  };
  trackMetaEvent('Lead', details, `lead-${id}`);
  trackMetaEvent('Purchase', { ...details, value: 1, currency: 'INR' }, `purchase-${id}`);
}
