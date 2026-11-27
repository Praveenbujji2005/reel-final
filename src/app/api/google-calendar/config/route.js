import { NextResponse } from 'next/server';
import { getGoogleCalendarConfig, saveGoogleCalendarConfig } from '@/lib/googleCalendarService';
import { isRequestAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    if (!isRequestAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required.' },
        { status: 401 }
      );
    }

    const config = await getGoogleCalendarConfig();
    return NextResponse.json({
      success: true,
      isConfigured: config.isConfigured,
      hasClientId: Boolean(config.clientId),
      clientIdPreview: config.clientId ? `${config.clientId.substring(0, 12)}...` : '',
      redirectUri: config.redirectUri,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve configuration.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!isRequestAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { clientId, clientSecret, redirectUri } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: 'Both Client ID and Client Secret are required.' },
        { status: 400 }
      );
    }

    await saveGoogleCalendarConfig({ clientId, clientSecret, redirectUri });

    return NextResponse.json({
      success: true,
      message: 'Google OAuth configuration saved successfully.',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to save configuration.' },
      { status: 500 }
    );
  }
}
