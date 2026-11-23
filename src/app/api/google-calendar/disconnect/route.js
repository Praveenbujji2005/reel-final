import { NextResponse } from 'next/server';
import { clearTokens } from '@/lib/googleCalendarService';

export async function POST() {
  try {
    await clearTokens();
    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected successfully.',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to disconnect Google Calendar.' },
      { status: 500 }
    );
  }
}
