import { NextResponse } from 'next/server';
import {
  createCreatorQuery,
  getCreatorQueriesFromFirestore,
  updateCreatorQueryStatusInFirestore,
  deleteCreatorQueryFromFirestore,
  validateCreatorQueryData,
} from '@/lib/creatorQueries';
import {
  readServerCreatorQueries,
  saveServerCreatorQuery,
  updateServerCreatorQueryStatus,
  deleteServerCreatorQuery,
} from '@/lib/serverCreatorQueriesStore';
import { isRequestAdmin } from '@/lib/auth';
import { sanitizeString, validateEmail, validatePhone } from '@/lib/sanitize';

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
          error: 'Too many applications submitted. Please wait 5 minutes before submitting again.',
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Honeypot spam defense
    if (body.website_trap || body.bot_honey) {
      return NextResponse.json({
        success: true,
        message: 'Creator application received.',
      });
    }

    // Input sanitization
    const fullName = sanitizeString(body.fullName || body.name || '', 100);
    const email = sanitizeString(body.email || '', 120).toLowerCase();
    const mobileNumber = sanitizeString(body.mobileNumber || body.phone || '', 30);
    const cityArea = sanitizeString(body.cityArea || body.city || 'Bengaluru', 80);
    const instagramLink = sanitizeString(body.instagramLink || body.instagram || '', 200);
    const phoneModel = sanitizeString(body.phoneModel || body.device || '', 100);
    const reason = sanitizeString(body.reason || body.message || 'No reason provided.', 1500);
    const sourcePage = sanitizeString(body.sourcePage || '/creators', 100);
    const createdAt = new Date().toISOString();

    const sanitizedPayload = {
      fullName,
      name: fullName,
      email,
      mobileNumber,
      phone: mobileNumber,
      cityArea,
      city: cityArea,
      instagramLink,
      portfolio: instagramLink,
      phoneModel,
      device: phoneModel,
      reason,
      message: reason,
      status: 'New',
      sourcePage,
      createdAt,
    };

    const validation = validateCreatorQueryData(sanitizedPayload);
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
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (mobileNumber && !validatePhone(mobileNumber)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    let firestoreResult = null;
    try {
      firestoreResult = await createCreatorQuery(sanitizedPayload);
    } catch (fireErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[API /api/creators] Firestore write notice:', fireErr.message);
      }
    }

    const serverSaved = saveServerCreatorQuery({
      ...sanitizedPayload,
      id: firestoreResult?.id || `creator_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cloudSynced: Boolean(firestoreResult?.cloudSynced || firestoreResult?.id),
    });

    return NextResponse.json({
      success: true,
      message: 'Creator application submitted successfully!',
      creatorQuery: {
        id: serverSaved.id,
        fullName: serverSaved.fullName,
        cityArea: serverSaved.cityArea,
        createdAt: serverSaved.createdAt,
      },
    });
  } catch (err) {
    console.error('[API /api/creators POST] Unhandled error:', err.message);
    return NextResponse.json(
      { success: false, error: 'Failed to submit creator application.' },
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
    const statusFilter = sanitizeString(searchParams.get('status') || 'all', 30).toLowerCase();
    const searchQuery = sanitizeString(searchParams.get('search') || '', 100).toLowerCase().trim();

    let cloudItems = [];
    try {
      cloudItems = await getCreatorQueriesFromFirestore();
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[API /api/creators GET] Firestore read notice:', err.message);
      }
    }

    const localItems = readServerCreatorQueries();

    const itemMap = new Map();
    for (const item of localItems) {
      if (item && item.id) itemMap.set(item.id, item);
    }
    for (const item of cloudItems) {
      if (item && item.id) itemMap.set(item.id, item);
    }

    let allItems = Array.from(itemMap.values());

    allItems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (statusFilter !== 'all') {
      allItems = allItems.filter(
        (q) => (q.status || 'new').toLowerCase() === statusFilter
      );
    }

    if (searchQuery) {
      allItems = allItems.filter((q) => {
        const name = (q.fullName || q.name || '').toLowerCase();
        const email = (q.email || '').toLowerCase();
        const phone = (q.mobileNumber || q.phone || '').toLowerCase();
        const city = (q.cityArea || q.city || '').toLowerCase();
        const device = (q.phoneModel || q.device || '').toLowerCase();
        const insta = (q.instagramLink || '').toLowerCase();
        return (
          name.includes(searchQuery) ||
          email.includes(searchQuery) ||
          phone.includes(searchQuery) ||
          city.includes(searchQuery) ||
          device.includes(searchQuery) ||
          insta.includes(searchQuery)
        );
      });
    }

    return NextResponse.json({
      success: true,
      count: allItems.length,
      creatorQueries: allItems,
    });
  } catch (err) {
    console.error('[API /api/creators GET] Error:', err.message);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve creator applications.' },
      { status: 500 }
    );
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
        { success: false, error: 'Missing creator query ID or status.' },
        { status: 400 }
      );
    }

    try {
      await updateCreatorQueryStatusInFirestore(id, status, adminEmail);
    } catch {}

    const updated = updateServerCreatorQueryStatus(id, status, adminEmail);

    return NextResponse.json({
      success: true,
      message: `Creator application status updated to ${status}.`,
      item: updated || { id, status },
    });
  } catch (err) {
    console.error('[API /api/creators PATCH] Error:', err.message);
    return NextResponse.json(
      { success: false, error: 'Failed to update status.' },
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
    const adminEmail = sanitizeString(searchParams.get('adminEmail') || 'admin@reelxpress.com', 120);

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing creator query ID parameter.' },
        { status: 400 }
      );
    }

    try {
      await deleteCreatorQueryFromFirestore(id, adminEmail);
    } catch {}

    deleteServerCreatorQuery(id);

    return NextResponse.json({
      success: true,
      id,
      message: 'Creator application deleted successfully.',
    });
  } catch (err) {
    console.error('[API /api/creators DELETE] Error:', err.message);
    return NextResponse.json(
      { success: false, error: 'Failed to delete creator application.' },
      { status: 500 }
    );
  }
}
