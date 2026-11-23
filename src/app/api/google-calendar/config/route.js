import { NextResponse } from 'next/server';
import { getGoogleCalendarConfig, saveGoogleCalendarConfig } from '@/lib/googleCalendarService';

export async function GET() {
  try {
    const config = getGoogleCalendarConfig();
    return NextResponse.json({
      success: true,
      isConfigured: config.isConfigured,
      hasClientId: Boolean(config.clientId),
      clientIdPreview: config.clientId ? `${config.clientId.substring(0, 12)}...` : '',
      redirectUri: config.redirectUri,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { clientId, clientSecret, redirectUri } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: 'Both Client ID and Client Secret are required.' },
        { status: 400 }
      );
    }

    saveGoogleCalendarConfig({ clientId, clientSecret, redirectUri });

    return NextResponse.json({
      success: true,
      message: 'Google OAuth configuration saved successfully.',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save configuration.' },
      { status: 500 }
    );
  }
}
