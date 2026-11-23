import { NextResponse } from 'next/server';
import { createGoogleCalendarEvent, parseShootDateTime } from '@/lib/googleCalendarService';
import {
  getServerEnquiryById,
  updateServerEnquiryFields,
} from '@/lib/serverEnquiriesStore';
import {
  getEnquiriesFromFirestore,
  updateEnquiryCalendarSyncInFirestore,
} from '@/lib/enquiries';

export async function POST(request) {
  try {
    const body = await request.json();
    const { enquiryId, force = false } = body;

    if (!enquiryId) {
      return NextResponse.json(
        { success: false, error: 'Enquiry ID is required.' },
        { status: 400 }
      );
    }

    // 1. Fetch complete enquiry document from server cache or Firestore
    let enquiry = getServerEnquiryById(enquiryId);

    if (!enquiry) {
      try {
        const firestoreList = await getEnquiriesFromFirestore();
        enquiry = firestoreList.find((e) => e.id === enquiryId);
      } catch (err) {
        console.warn('[SyncEvent] Firestore lookup warning:', err.message);
      }
    }

    if (!enquiry) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Enquiry not found in database.' },
        { status: 404 }
      );
    }

    // 2. Requirement 3: Missing shoot date validation
    const eventDate = enquiry.eventDate || enquiry.date;
    if (!eventDate || !String(eventDate).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_DATE',
          message:
            'Shoot Date is missing for this enquiry. Please update the enquiry with a valid event date before adding to Google Calendar.',
        },
        { status: 400 }
      );
    }

    // Validate date format
    const dateCheck = parseShootDateTime(eventDate, enquiry.eventTime, enquiry.message || enquiry.enquiryMessage);
    if (!dateCheck.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_DATE',
          message: dateCheck.error,
        },
        { status: 400 }
      );
    }

    // 3. Requirement 3: Prevent duplicate calendar events
    if (enquiry.googleCalendarEventId && enquiry.googleCalendarSyncStatus === 'synced' && !force) {
      return NextResponse.json({
        success: true,
        alreadySynced: true,
        eventId: enquiry.googleCalendarEventId,
        eventUrl: enquiry.googleCalendarEventUrl,
        message: 'This enquiry is already synced with Google Calendar.',
      });
    }

    // 4. Create event via Google Calendar API
    let calendarResult;
    try {
      calendarResult = await createGoogleCalendarEvent(enquiry);
    } catch (apiErr) {
      const errMsg = apiErr.message || String(apiErr);

      // Record failed sync status in storage
      try {
        updateServerEnquiryFields(enquiryId, {
          googleCalendarSyncStatus: 'failed',
          googleCalendarSyncError: errMsg,
        });
        await updateEnquiryCalendarSyncInFirestore(enquiryId, {
          googleCalendarSyncStatus: 'failed',
          googleCalendarSyncError: errMsg,
        });
      } catch {}

      if (errMsg === 'NOT_CONNECTED') {
        return NextResponse.json(
          {
            success: false,
            error: 'NOT_CONNECTED',
            message: 'Google Calendar is not connected. Please connect your Google account in CMS Settings.',
          },
          { status: 401 }
        );
      }

      if (errMsg === 'AUTH_EXPIRED_NO_REFRESH' || errMsg === 'TOKEN_REVOKED') {
        return NextResponse.json(
          {
            success: false,
            error: 'AUTH_EXPIRED',
            message: 'Your Google authorization has expired. Please reconnect your Google Calendar account.',
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'API_ERROR',
          message: `Google Calendar API error: ${errMsg}`,
        },
        { status: 500 }
      );
    }

    // 5. Requirement 3 & 6: Store event ID and sync status in Firestore & server store
    const syncedAt = new Date().toISOString();
    const syncData = {
      googleCalendarEventId: calendarResult.eventId,
      googleCalendarSyncStatus: 'synced',
      googleCalendarSyncedAt: syncedAt,
      googleCalendarEventUrl: calendarResult.eventUrl,
    };

    updateServerEnquiryFields(enquiryId, syncData);

    try {
      await updateEnquiryCalendarSyncInFirestore(enquiryId, syncData);
    } catch (fireErr) {
      console.warn('[SyncEvent] Firestore update warning:', fireErr.message);
    }

    return NextResponse.json({
      success: true,
      eventId: calendarResult.eventId,
      eventUrl: calendarResult.eventUrl,
      syncedAt,
      isTentativeTime: calendarResult.isTentativeTime,
      formattedDate: calendarResult.formattedDate,
      formattedTime: calendarResult.formattedTime,
      message: calendarResult.isTentativeTime
        ? `Event created in Google Calendar for ${calendarResult.formattedDate} at 10:00 AM (Tentative) with 30-min reminder.`
        : `Event created in Google Calendar for ${calendarResult.formattedDate} at ${calendarResult.formattedTime} with 30-min reminder.`,
    });
  } catch (err) {
    console.error('[SyncEvent] Server error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: err.message || 'An unexpected error occurred while syncing with Google Calendar.',
      },
      { status: 500 }
    );
  }
}
