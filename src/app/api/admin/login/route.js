import { NextResponse } from 'next/server';
import { verifyPassword, createSessionToken } from '@/lib/auth';
import { sanitizeString, validateEmail } from '@/lib/sanitize';

const loginAttempts = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 5;

  const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now, lockedUntil: null };

  if (record.lockedUntil && now < record.lockedUntil) {
    return { limited: true, minutesLeft: Math.ceil((record.lockedUntil - now) / 60000) };
  }

  if (now - record.firstAttempt > windowMs) {
    loginAttempts.delete(ip);
    return { limited: false };
  }

  return { limited: false };
}

function recordFailure(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 5;
  const lockoutMs = 15 * 60 * 1000;

  const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now, lockedUntil: null };
  record.count += 1;

  if (record.count >= maxAttempts) {
    record.lockedUntil = now + lockoutMs;
  }

  loginAttempts.set(ip, record);
}

function clearFailures(ip) {
  loginAttempts.delete(ip);
}

export async function POST(request) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous_ip';

    const rateCheck = isRateLimited(ip);
    if (rateCheck.limited) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Please wait ${rateCheck.minutesLeft} minutes before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = sanitizeString(body.email || '', 120).toLowerCase();
    const password = String(body.password || '').trim();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const adminEmail = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@reelxpress.com').toLowerCase().trim();
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const adminDefaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'ReelXpress@Admin2026!';

    const isEmailMatch = email === adminEmail;
    let isPasswordMatch = false;

    if (isEmailMatch) {
      if (adminPasswordHash) {
        isPasswordMatch = await verifyPassword(password, adminPasswordHash);
      }
      if (!isPasswordMatch && adminDefaultPassword) {
        isPasswordMatch = await verifyPassword(password, adminDefaultPassword);
      }
    }

    if (!isEmailMatch || !isPasswordMatch) {
      recordFailure(ip);
      return NextResponse.json(
        { success: false, error: 'Invalid administrator credentials.' },
        { status: 401 }
      );
    }

    clearFailures(ip);

    const user = {
      uid: 'adm_master',
      email: adminEmail,
      displayName: 'ReelXpress Administrator',
      role: 'admin',
    };

    const sessionDuration = 60 * 60 * 24 * 7; // 7 days
    const token = createSessionToken(user, sessionDuration);

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      user,
    });

    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: sessionDuration,
    });

    return response;
  } catch (error) {
    console.error('[Admin Login API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}
