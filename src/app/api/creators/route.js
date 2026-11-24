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

    const body = await request.json();

    if (body.website_trap || body.bot_honey) {
      return NextResponse.json({
        success: true,
        message: 'Creator application received.',
      });
    }

    const validation = validateCreatorQueryData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errors.join(' '),
        },
        { status: 400 }
      );
    }

    const fullName = (body.fullName || body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const mobileNumber = (body.mobileNumber || body.phone || '').trim();
    const cityArea = (body.cityArea || body.city || 'Bengaluru').trim();
    const instagramLink = (body.instagramLink || body.instagram || '').trim();
    const phoneModel = (body.phoneModel || body.device || '').trim();
    const reason = (body.reason || body.message || '').trim() || 'No reason provided.';
    const sourcePage = body.sourcePage || '/creators';
    const createdAt = new Date().toISOString();

    const payload = {
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

    let firestoreResult = null;
    try {
      firestoreResult = await createCreatorQuery(payload);
    } catch (fireErr) {
      console.warn('[API /api/creators] Firestore write notice:', fireErr.message);
    }

    const serverSaved = saveServerCreatorQuery({
      ...payload,
      id: firestoreResult?.id || `creator_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cloudSynced: Boolean(firestoreResult?.cloudSynced || firestoreResult?.id),
    });

    return NextResponse.json({
      success: true,
      message: 'Creator application submitted successfully!',
      creatorQuery: serverSaved,
    });
  } catch (err) {
    console.error('[API /api/creators POST] Unhandled error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to submit creator application.' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = (searchParams.get('status') || 'all').toLowerCase();
    const searchQuery = (searchParams.get('search') || '').toLowerCase().trim();

    let cloudItems = [];
    try {
      cloudItems = await getCreatorQueriesFromFirestore();
    } catch (err) {
      console.warn('[API /api/creators GET] Firestore read notice:', err.message);
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
    console.error('[API /api/creators GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve creator applications.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status, adminEmail } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing creator query ID or status.' },
        { status: 400 }
      );
    }

    try {
      await updateCreatorQueryStatusInFirestore(id, status, adminEmail);
    } catch (fireErr) {
      console.warn('[API /api/creators PATCH] Firestore notice:', fireErr.message);
    }

    const updated = updateServerCreatorQueryStatus(id, status, adminEmail);

    return NextResponse.json({
      success: true,
      message: `Creator application status updated to ${status}.`,
      item: updated || { id, status },
    });
  } catch (err) {
    console.error('[API /api/creators PATCH] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update status.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const adminEmail = searchParams.get('adminEmail') || 'admin@reelxpress.com';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing creator query ID parameter.' },
        { status: 400 }
      );
    }

    try {
      await deleteCreatorQueryFromFirestore(id, adminEmail);
    } catch (fireErr) {
      console.warn('[API /api/creators DELETE] Firestore notice:', fireErr.message);
    }

    deleteServerCreatorQuery(id);

    return NextResponse.json({
      success: true,
      id,
      message: 'Creator application deleted successfully.',
    });
  } catch (err) {
    console.error('[API /api/creators DELETE] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete creator application.' },
      { status: 500 }
    );
  }
}
