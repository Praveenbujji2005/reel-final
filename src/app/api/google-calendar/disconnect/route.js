import { NextResponse } from 'next/server';
import { clearTokens } from '@/lib/googleCalendarService';
import { isRequestAdmin } from '@/lib/auth';

export async function POST(request) {
  try {
    if (!isRequestAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required.' },
        { status: 401 }
      );
    }

    await clearTokens();
    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected successfully.',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect Google Calendar.' },
      { status: 500 }
    );
  }
}
