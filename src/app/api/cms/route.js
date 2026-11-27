import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { INITIAL_TESTIMONIALS, INITIAL_PRICING_PLANS } from '@/lib/cmsServices';
import { REEL_PORTFOLIO, FAQ_DATA } from '@/lib/data';
import { isRequestAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PUBLIC_CMS_TYPES = ['testimonials', 'reviews', 'pricing', 'faqs', 'hero', 'slides'];
const ALL_CMS_TYPES = [...PUBLIC_CMS_TYPES, 'activity'];

function getCollectionName(rawType) {
  const t = (rawType || '').toLowerCase().trim();
  if (t === 'hero' || t === 'slides') return 'cms_hero';
  if (t === 'pricing') return 'cms_pricing';
  if (t === 'testimonials' || t === 'reviews') return 'cms_testimonials';
  if (t === 'faqs') return 'cms_faqs';
  if (t === 'activity') return 'activity_logs';
  return `cms_${t}`;
}

function getDefaultItems(type) {
  const t = (type || '').toLowerCase().trim();
  if (t === 'hero' || t === 'slides') return REEL_PORTFOLIO;
  if (t === 'pricing') return INITIAL_PRICING_PLANS;
  if (t === 'testimonials' || t === 'reviews') return INITIAL_TESTIMONIALS;
  if (t === 'faqs') return FAQ_DATA;
  if (t === 'activity') return [];
  return [];
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'testimonials').toLowerCase().trim();

    if (type === 'activity' && !isRequestAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required to view activity logs.' },
        { status: 401 }
      );
    }

    if (!ALL_CMS_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported CMS type "${type}". Supported types: ${ALL_CMS_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const colName = getCollectionName(type);

    if (isFirebaseConfigured && db) {
      try {
        const isActivity = colName === 'activity_logs';
        let q;
        if (isActivity) {
          q = query(collection(db, colName), orderBy('timestamp', 'desc'));
        } else {
          q = query(collection(db, colName), orderBy('order', 'asc'));
        }

        const snap = await getDocs(q);
        if (!snap.empty) {
          const items = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((item) => !item._deleted);

          return NextResponse.json(
            { success: true, type, count: items.length, data: items, source: 'firestore' },
            {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              },
            }
          );
        }
      } catch (dbErr) {
        console.error(`[API /api/cms GET] Firestore query error for ${colName}:`, dbErr);
      }
    }

    const fallbackData = getDefaultItems(type);
    return NextResponse.json(
      { success: true, type, count: fallbackData.length, data: fallbackData, source: 'defaults' },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (err) {
    console.error('[API /api/cms GET] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch CMS content.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!isRequestAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required to modify CMS content.' },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { type, item, adminEmail } = body;

    if (!type || !item) {
      return NextResponse.json(
        { success: false, error: 'Missing type or item payload.' },
        { status: 400 }
      );
    }

    const normalizedType = type.toLowerCase().trim();
    if (!PUBLIC_CMS_TYPES.includes(normalizedType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported CMS type for save: "${type}". Allowed: ${PUBLIC_CMS_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!isFirebaseConfigured || !db) {
      console.error('[API /api/cms POST] Firebase Firestore is not configured in environment variables.');
      return NextResponse.json(
        {
          success: false,
          error: 'Firebase Firestore is not configured. Please set NEXT_PUBLIC_FIREBASE_* environment variables.',
        },
        { status: 500 }
      );
    }

    const colName = getCollectionName(normalizedType);
    const isNew = !item.id || String(item.id).startsWith('new_');
    const itemId = isNew ? `${normalizedType.slice(0, 4)}_${Date.now()}` : String(item.id);

    const payload = {
      ...item,
      id: itemId,
      _deleted: false,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail || 'admin@reelxpress.com',
    };

    try {
      await setDoc(doc(db, colName, itemId), payload, { merge: true });
    } catch (writeErr) {
      console.error(`[API /api/cms POST] Firestore setDoc failed for ${colName}/${itemId}:`, writeErr);
      return NextResponse.json(
        {
          success: false,
          error: `Firestore write failed: ${writeErr.message || writeErr}. Please verify Firestore Security Rules.`,
          code: writeErr.code || 'write_error',
        },
        { status: 500 }
      );
    }

    try {
      await addDoc(collection(db, 'activity_logs'), {
        action: isNew ? `Created ${normalizedType} item` : `Updated ${normalizedType} item`,
        details: item.title || item.name || item.question || `ID: ${itemId}`,
        adminEmail: adminEmail || 'admin@reelxpress.com',
        timestamp: new Date().toISOString(),
      });
    } catch (auditErr) {
      console.warn('[API /api/cms POST] Activity log notice:', auditErr?.message);
    }

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/');
      revalidatePath('/admin');
    } catch (revErr) {
      console.warn('[API /api/cms POST] revalidatePath notice:', revErr?.message);
    }

    return NextResponse.json({
      success: true,
      type: normalizedType,
      item: payload,
      message: `${normalizedType} saved successfully to Firestore.`,
    });
  } catch (err) {
    console.error('[API /api/cms POST] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save CMS item.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    if (!isRequestAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required to delete CMS content.' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const rawType = searchParams.get('type');
    const id = searchParams.get('id');
    const adminEmail = searchParams.get('adminEmail') || 'admin@reelxpress.com';

    if (!rawType || !id) {
      return NextResponse.json(
        { success: false, error: 'Missing type or id.' },
        { status: 400 }
      );
    }

    const type = rawType.toLowerCase().trim();
    if (!PUBLIC_CMS_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported CMS type for delete: "${rawType}". Allowed: ${PUBLIC_CMS_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!isFirebaseConfigured || !db) {
      console.error('[API /api/cms DELETE] Firebase Firestore is not configured.');
      return NextResponse.json(
        { success: false, error: 'Firebase Firestore is not configured.' },
        { status: 500 }
      );
    }

    const colName = getCollectionName(type);
    const targetId = String(id);

    try {
      await setDoc(
        doc(db, colName, targetId),
        { _deleted: true, updatedAt: new Date().toISOString(), updatedBy: adminEmail },
        { merge: true }
      );
      await deleteDoc(doc(db, colName, targetId));
    } catch (delErr) {
      console.error(`[API /api/cms DELETE] Firestore deleteDoc failed for ${colName}/${targetId}:`, delErr);
      return NextResponse.json(
        {
          success: false,
          error: `Firestore delete failed: ${delErr.message || delErr}. Please verify Firestore Security Rules.`,
          code: delErr.code || 'delete_error',
        },
        { status: 500 }
      );
    }

    try {
      await addDoc(collection(db, 'activity_logs'), {
        action: `Deleted ${type} item`,
        details: `Item ID: ${targetId}`,
        adminEmail,
        timestamp: new Date().toISOString(),
      });
    } catch (auditErr) {
      console.warn('[API /api/cms DELETE] Activity log notice:', auditErr?.message);
    }

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/');
      revalidatePath('/admin');
    } catch (revErr) {
      console.warn('[API /api/cms DELETE] revalidatePath notice:', revErr?.message);
    }

    return NextResponse.json({
      success: true,
      type,
      id: targetId,
      message: `${type} item deleted successfully from Firestore.`,
    });
  } catch (err) {
    console.error('[API /api/cms DELETE] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete CMS item.' },
      { status: 500 }
    );
  }
}
