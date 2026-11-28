import { NextResponse, after } from 'next/server';
import {
  createEnquiry,
  getEnquiriesFromFirestore,
  updateEnquiryStatusInFirestore,
  deleteEnquiryFromFirestore,
  validateEnquiryData,
  normalizeEnquiry,
} from '@/lib/enquiries';
import {
  readServerEnquiries,
  writeServerEnquiries,
  saveServerEnquiry,
  updateServerEnquiryStatus,
  deleteServerEnquiry,
} from '@/lib/serverEnquiriesStore';
import { isRequestAdmin } from '@/lib/auth';
import { sanitizeString, validateEmail, validatePhone } from '@/lib/sanitize';
import { sendLeadToGoogleSheet } from '@/lib/googleSheetsLeads';

const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxRequests = 6;

  const records = rateLimitMap.get(ip) || [];
  const validRecords = records.filter((timestamp) => now - timestamp < windowMs);

  if (validRecords.length >= maxRequests) {
    return true;
  }

  validRecords.push(now);
  rateLimitMap.set(ip, validRecords);
  return false;
}

export async function POST(request) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous_ip';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many enquiries submitted. Please wait 5 minutes before submitting again.',
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));

    if (body.website_trap || body.bot_honey) {
      return NextResponse.json({
        success: true,
        message: 'Enquiry received successfully.',
      });
    }

    const customerName = sanitizeString(body.customerName || body.fullName || body.name || '', 100);
    const email = sanitizeString(body.email || '', 120).toLowerCase();
    const phone = sanitizeString(body.phone || body.mobile || '', 30);
    const companyName = sanitizeString(body.companyName || body.company || '', 120);
    const selectedService = sanitizeString(body.selectedService || body.serviceType || body.type || 'General Shoot', 120);
    const enquiryMessage = sanitizeString(body.enquiryMessage || body.message || body.notes || '', 1500);
    const city = sanitizeString(body.city || 'Bengaluru', 60);
    const locality = sanitizeString(body.locality || body.area || '', 100);
    const eventDate = sanitizeString(body.eventDate || body.date || '', 30);
    const sourcePage = sanitizeString(body.sourcePage || body.source || 'Website Booking Form', 100);
    const createdAt = new Date().toISOString();

    const sanitizedPayload = {
      customerName,
      fullName: customerName,
      email,
      phone,
      companyName,
      selectedService,
      serviceType: selectedService,
      enquiryMessage,
      message: enquiryMessage,
      city,
      locality,
      eventDate,
      status: 'New',
      sourcePage,
      createdAt,
    };

    const validation = validateEnquiryData(sanitizedPayload);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errors.join(' '),
        },
        { status: 400 }
      );
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    let savedEnquiry = null;
    let cloudSynced = false;

    try {
      savedEnquiry = await createEnquiry(sanitizedPayload);
      cloudSynced = true;
    } catch (firestoreErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[API /api/enquiries] Cloud Firestore notice:', firestoreErr.message);
      }
    }

    const serverRecord = saveServerEnquiry({
      ...(savedEnquiry || sanitizedPayload),
      cloudSynced,
    });

    const responseEnquiry = savedEnquiry || serverRecord;

    after(() => sendLeadToGoogleSheet({ ...sanitizedPayload, ...responseEnquiry }));

    return NextResponse.json(
      {
        success: true,
        message:
          'Your shoot slot has been locked! Our Bengaluru coordinator will connect via WhatsApp / Call within minutes.',
        enquiry: {
          id: responseEnquiry.id,
          customerName: responseEnquiry.customerName,
          selectedService: responseEnquiry.selectedService,
          createdAt: responseEnquiry.createdAt,
        },
        cloudSynced,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /api/enquiries] Submission error:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: 'An error occurred while processing your enquiry. Please try again.',
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    if (!isRequestAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = sanitizeString(searchParams.get('search') || '', 100);
    const status = sanitizeString(searchParams.get('status') || 'all', 30);
    const sortBy = sanitizeString(searchParams.get('sortBy') || 'newest', 20);

    let firestoreList = [];
    let firestoreError = null;
    try {
      firestoreList = await getEnquiriesFromFirestore({ search: '', status: 'all', sortBy: 'newest' });
    } catch (err) {
      firestoreError = err.message;
    }

    const serverList = readServerEnquiries().map((item) => normalizeEnquiry(item.id, item));

    const map = new Map();
    for (const item of firestoreList) {
      map.set(item.id, { ...item, cloudSynced: true });
    }
    for (const item of serverList) {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    }

    let combined = Array.from(map.values());

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      combined = combined.filter(
        (inq) =>
          (inq.customerName && inq.customerName.toLowerCase().includes(term)) ||
          (inq.fullName && inq.fullName.toLowerCase().includes(term)) ||
          (inq.email && inq.email.toLowerCase().includes(term)) ||
          (inq.phone && inq.phone.toLowerCase().includes(term)) ||
          (inq.companyName && inq.companyName.toLowerCase().includes(term)) ||
          (inq.selectedService && inq.selectedService.toLowerCase().includes(term)) ||
          (inq.city && inq.city.toLowerCase().includes(term)) ||
          (inq.enquiryMessage && inq.enquiryMessage.toLowerCase().includes(term))
      );
    }

    if (status !== 'all') {
      const target = status.toLowerCase();
      combined = combined.filter((inq) => (inq.status || '').toLowerCase() === target);
    }

    combined.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return sortBy === 'oldest' ? timeA - timeB : timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      enquiries: combined,
      inquiries: combined,
      firestoreError,
    });
  } catch (error) {
    console.error('[API /api/enquiries] Fetch error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve enquiries.' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    if (!isRequestAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required.' },
        { status: 401 }
      );
    }

    const list = readServerEnquiries();
    const unsynced = list.filter((item) => !item.cloudSynced);
    let syncedCount = 0;
    const errors = [];

    for (const item of unsynced) {
      try {
        await createEnquiry(item);
        item.cloudSynced = true;
        syncedCount++;
      } catch (err) {
        errors.push({ id: item.id, error: err.message });
      }
    }

    writeServerEnquiries(list);

    return NextResponse.json({
      success: true,
      syncedCount,
      totalUnsynced: unsynced.length,
      errors,
    });
  } catch (err) {
    console.error('[API /api/enquiries] Sync error:', err.message);
    return NextResponse.json({ success: false, error: 'Enquiry synchronization failed.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    if (!isRequestAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const id = sanitizeString(body.id || '', 100);
    const status = sanitizeString(body.status || '', 50);
    const adminEmail = sanitizeString(body.adminEmail || 'admin@reelxpress.com', 120);

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing enquiry ID or status.' },
        { status: 400 }
      );
    }

    updateServerEnquiryStatus(id, status, adminEmail);

    try {
      await updateEnquiryStatusInFirestore(id, status, adminEmail);
    } catch {}

    return NextResponse.json({ success: true, id, status });
  } catch (error) {
    console.error('[API /api/enquiries] Update error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to update enquiry status.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    if (!isRequestAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = sanitizeString(searchParams.get('id') || '', 100);
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing enquiry ID.' },
        { status: 400 }
      );
    }

    deleteServerEnquiry(id);

    try {
      await deleteEnquiryFromFirestore(id);
    } catch {}

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[API /api/enquiries] Delete error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to delete enquiry.' },
      { status: 500 }
    );
  }
}
