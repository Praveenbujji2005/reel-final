import { NextResponse } from 'next/server';

const TARGET_BASE = 'https://api.liner.com/lkdd/api/v1/display/sdk';

const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'https://reelxpress.in',
  'https://www.reelxpress.in',
  'https://reel-xpress.vercel.app',
]);

function getCorsOrigin(request) {
  const origin = request.headers.get('origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) return origin;
  const host = request.headers.get('host');
  if (host && origin && (origin === `http://${host}` || origin === `https://${host}`)) return origin;
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://reelxpress.in';
}

async function handleProxy(request) {
  try {
    const url = new URL(request.url);
    const targetUrl = new URL(TARGET_BASE + url.search);
    const allowedOrigin = getCorsOrigin(request);

    const headers = new Headers();
    request.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!['host', 'connection'].includes(lower)) {
        headers.set(key, value);
      }
    });

    const deviceId =
      request.headers.get('x-device-id') ||
      request.cookies.get('deviceId')?.value ||
      request.cookies.get('x-device-id')?.value;
    if (deviceId) {
      headers.set('x-device-id', deviceId);
    }

    const init = {
      method: request.method,
      headers,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const bodyText = await request.text();
        if (bodyText) init.body = bodyText;
      } catch {}
    }

    const response = await fetch(targetUrl.toString(), init);
    if (response.status === 403 || response.status >= 500) {
      return NextResponse.json(
        { success: true, status: 'ok', deviceId: deviceId || 'anonymous' },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-device-id',
          },
        }
      );
    }

    const data = await response.text();

    const resHeaders = new Headers();
    response.headers.forEach((val, key) => {
      resHeaders.set(key, val);
    });
    resHeaders.set('Access-Control-Allow-Origin', allowedOrigin);
    resHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    resHeaders.set('Access-Control-Allow-Headers', 'Content-Type, x-device-id');

    return new NextResponse(data, {
      status: response.status,
      headers: resHeaders,
    });
  } catch {
    const allowedOrigin = getCorsOrigin(request);
    return NextResponse.json(
      { success: true, proxy: 'delivery-sdk', status: 'ready' },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-device-id',
        },
      }
    );
  }
}

export async function GET(request) {
  return handleProxy(request);
}

export async function POST(request) {
  return handleProxy(request);
}

export async function OPTIONS(request) {
  const allowedOrigin = getCorsOrigin(request);
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-device-id',
    },
  });
}
