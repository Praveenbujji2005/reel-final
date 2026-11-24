import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();

  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|brand/|thumbnails/|favicon.ico).*)',
  ],
};
