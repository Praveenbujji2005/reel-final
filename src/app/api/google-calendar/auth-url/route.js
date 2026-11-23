import { NextResponse } from 'next/server';
import { getGoogleAuthUrl, getGoogleCalendarConfig } from '@/lib/googleCalendarService';

export async function GET(request) {
  try {
    const config = await getGoogleCalendarConfig();
    if (!config.clientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'CONFIG_REQUIRED',
          message: 'Google OAuth Client ID is not configured. Please configure it in settings.',
        },
        { status: 400 }
      );
    }

    const { origin } = new URL(request.url);
    const { url, redirectUri } = await getGoogleAuthUrl(origin);

    return NextResponse.json({
      success: true,
      url,
      redirectUri,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate Google Auth URL.' },
      { status: 500 }
    );
  }
}
