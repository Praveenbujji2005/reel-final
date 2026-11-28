import { NextResponse } from 'next/server';

const DEFAULT_SECRET = 'development_fallback_secret_key_reelxpress_2026_minimum_32_chars';

function getSecret() {
  return process.env.ADMIN_SECRET_KEY || process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || DEFAULT_SECRET;
}

async function verifySessionTokenEdge(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  try {
    const secret = getSecret();
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const base64Sig = sigB64.replace(/-/g, '+').replace(/_/g, '/');
    const padSig = base64Sig.padEnd(base64Sig.length + ((4 - (base64Sig.length % 4)) % 4), '=');
    const binarySig = atob(padSig);
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(payloadB64)
    );

    if (!isValid) return null;

    const base64Payload = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const padPayload = base64Payload.padEnd(base64Payload.length + ((4 - (base64Payload.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padPayload));

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function checkAdminAuth(request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === getSecret()) {
      return { sub: 'admin', role: 'admin', authType: 'api_secret' };
    }
    const verified = await verifySessionTokenEdge(token);
    if (verified) return verified;
  }

  const cookie = request.cookies.get('admin_session')?.value;
  if (cookie) {
    const verified = await verifySessionTokenEdge(cookie);
    if (verified) return verified;
  }

  return null;
}

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'https://reelxpress.in',
  'https://www.reelxpress.in',
  'https://reel-xpress.vercel.app',
]);

if (process.env.NEXT_PUBLIC_SITE_URL) {
  try {
    const parsed = new URL(process.env.NEXT_PUBLIC_SITE_URL);
    ALLOWED_ORIGINS.add(parsed.origin);
  } catch {}
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const origin = request.headers.get('origin');

  let corsOrigin = null;
  if (origin) {
    if (ALLOWED_ORIGINS.has(origin) || origin.endsWith('.vercel.app')) {
      corsOrigin = origin;
    } else {
      const host = request.headers.get('host');
      if (host && (origin === `http://${host}` || origin === `https://${host}`)) {
        corsOrigin = origin;
      }
    }
  }

  if (method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 });
    if (corsOrigin) {
      preflight.headers.set('Access-Control-Allow-Origin', corsOrigin);
      preflight.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      preflight.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-device-id');
      preflight.headers.set('Access-Control-Allow-Credentials', 'true');
      preflight.headers.set('Access-Control-Max-Age', '86400');
    }
    return preflight;
  }

  if (pathname.startsWith('/admin')) {
    const isPublicAdminRoute =
      pathname === '/admin/login' ||
      pathname === '/admin/forgot-password';

    if (!isPublicAdminRoute) {
      const auth = await checkAdminAuth(request);
      if (!auth) {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl, 307);
      }
    }
  }

  const isEnquiryAdminMethod =
    (pathname === '/api/enquiries' || pathname === '/api/inquiries') &&
    ['GET', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const isCreatorAdminMethod =
    (pathname === '/api/creators' || pathname === '/api/creator-queries') &&
    ['GET', 'PATCH', 'DELETE'].includes(method);

  const isCmsMutation = pathname === '/api/cms' && ['POST', 'PUT', 'DELETE'].includes(method);

  const isCmsSeed = pathname === '/api/cms/seed';

  const isUpload = pathname === '/api/upload';

  const isGoogleCalendarAdmin =
    pathname.startsWith('/api/google-calendar') &&
    pathname !== '/api/google-calendar/callback';

  if (
    isEnquiryAdminMethod ||
    isCreatorAdminMethod ||
    isCmsMutation ||
    isCmsSeed ||
    isUpload ||
    isGoogleCalendarAdmin
  ) {
    const auth = await checkAdminAuth(request);
    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access. Administrative privileges required.',
        },
        { status: 401 }
      );
    }
  }

  const response = NextResponse.next();

  if (corsOrigin) {
    response.headers.set('Access-Control-Allow-Origin', corsOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-device-id');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://connect.facebook.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' data: blob: https: res.cloudinary.com https://firebasestorage.googleapis.com;
    media-src 'self' blob: data: https://firebasestorage.googleapis.com https://res.cloudinary.com;
    connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.firebaseapp.com https://firebasestorage.googleapis.com https://api.liner.com https://api.cloudinary.com https://www.facebook.com https://connect.facebook.net;
    frame-src 'self' https://accounts.google.com https://www.google.com;
    frame-ancestors 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://accounts.google.com;
  `
    .replace(/\s{2,}/g, ' ')
    .trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|brand/|thumbnails/|assets/|favicon.ico).*)',
  ],
};
