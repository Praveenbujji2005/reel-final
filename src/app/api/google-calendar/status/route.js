import { NextResponse } from 'next/server';
import { getCalendarConnectionStatus } from '@/lib/googleCalendarService';

export async function GET() {
  try {
    const status = await getCalendarConnectionStatus();
    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to get Google Calendar status.' },
      { status: 500 }
    );
  }
}
