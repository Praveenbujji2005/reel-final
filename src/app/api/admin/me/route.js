import { NextResponse } from 'next/server';
import { getAdminAuthFromRequest } from '@/lib/auth';

export async function GET(request) {
  const auth = getAdminAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json(
      { success: false, authenticated: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    user: {
      uid: auth.uid || 'adm_master',
      email: auth.email || process.env.ADMIN_DEFAULT_EMAIL || 'admin@reelxpress.com',
      displayName: auth.displayName || 'ReelXpress Administrator',
      role: 'admin',
    },
  });
}
