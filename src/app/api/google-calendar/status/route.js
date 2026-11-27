import { NextResponse } from 'next/server';
import { getCalendarConnectionStatus } from '@/lib/googleCalendarService';
import { isRequestAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    if (!isRequestAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required.' },
        { status: 401 }
      );
    }

    const status = await getCalendarConnectionStatus();
    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to get Google Calendar status.' },
      { status: 500 }
    );
  }
}
