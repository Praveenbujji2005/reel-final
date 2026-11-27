import { NextResponse } from 'next/server';

export async function POST(request) {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
  });

  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
