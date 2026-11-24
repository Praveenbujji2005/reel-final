import { db, isFirebaseConfigured, firebaseConfig } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';

export const ENQUIRIES_COLLECTION = 'enquiries';

export function validateEnquiryData(data) {
  const errors = [];
  const customerName = (data.customerName || data.fullName || data.name || '').trim();
  const email = (data.email || '').trim();
  const phone = (data.phone || '').trim();
  const selectedService = (data.selectedService || data.serviceType || data.type || data.subject || '').trim();

  if (!customerName || customerName.length < 2) {
    errors.push('Customer name must be at least 2 characters long.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Please enter a valid email address.');
  }

  const digitsOnly = phone.replace(/\D/g, '');
  if (!phone || digitsOnly.length < 10) {
    errors.push('Please enter a valid 10-digit phone number.');
  }

  if (!selectedService) {
    errors.push('Please select a service or shoot type.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function normalizeEnquiry(id, raw = {}) {
  const customerName = raw.customerName || raw.fullName || raw.name || 'Anonymous Client';
  const email = raw.email || 'No email provided';
  const phone = raw.phone || 'No phone provided';
  const companyName = raw.companyName || raw.company || '';
  const selectedService = raw.selectedService || raw.serviceType || raw.type || 'General Shoot';
  const enquiryMessage = raw.enquiryMessage || raw.message || raw.notes || 'No message provided.';
  const city = raw.city || 'Bengaluru';
  const locality = raw.locality || raw.area || '';
  const eventDate = raw.eventDate || raw.date || '';
  const status = raw.status || 'New';
  const sourcePage = raw.sourcePage || raw.source || 'Website Booking Form';
  const createdAt = raw.createdAt || new Date().toISOString();

  let timestampDate = null;
  if (raw.timestamp?.toDate && typeof raw.timestamp.toDate === 'function') {
    try {
      const d = raw.timestamp.toDate();
      if (!isNaN(d.getTime())) timestampDate = d;
    } catch {}
  } else if (raw.timestamp instanceof Date && !isNaN(raw.timestamp.getTime())) {
    timestampDate = raw.timestamp;
  } else if (raw.timestamp && typeof raw.timestamp === 'object' && raw.timestamp.seconds) {
    const d = new Date(raw.timestamp.seconds * 1000);
    if (!isNaN(d.getTime())) timestampDate = d;
  } else if (typeof raw.timestamp === 'string' || typeof raw.timestamp === 'number') {
    const d = new Date(raw.timestamp);
    if (!isNaN(d.getTime())) timestampDate = d;
  }

  if (!timestampDate || isNaN(timestampDate.getTime())) {
    const d = raw.createdAt ? new Date(raw.createdAt) : new Date();
    timestampDate = !isNaN(d.getTime()) ? d : new Date();
  }

  const formattedDate = timestampDate.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = timestampDate.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const googleCalendarEventId = raw.googleCalendarEventId || null;
  const googleCalendarSyncStatus = raw.googleCalendarSyncStatus || (raw.googleCalendarEventId ? 'synced' : 'not_synced');
  const googleCalendarSyncedAt = raw.googleCalendarSyncedAt || null;
  const googleCalendarEventUrl = raw.googleCalendarEventUrl || null;

  return {
    id,
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
    status,
    sourcePage,
    source: sourcePage,
    createdAt,
    timestamp: raw.timestamp || null,
    timestampDate,
    formattedDate,
    formattedTime,
    googleCalendarEventId,
    googleCalendarSyncStatus,
    googleCalendarSyncedAt,
    googleCalendarEventUrl,
  };
}

export function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined || val === null) continue;
    if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      fields[key] = Number.isInteger(val)
        ? { integerValue: String(val) }
        : { doubleValue: val };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map((v) => ({ stringValue: String(v) })),
        },
      };
    }
  }
  return { fields };
}

export function parseFirestoreDoc(doc) {
  if (!doc) return null;
  const fields = doc.fields || {};
  const data = { id: doc.name?.split('/').pop() || '' };
  for (const [key, val] of Object.entries(fields)) {
    if ('stringValue' in val) data[key] = val.stringValue;
    else if ('integerValue' in val) data[key] = Number(val.integerValue);
    else if ('doubleValue' in val) data[key] = Number(val.doubleValue);
    else if ('booleanValue' in val) data[key] = val.booleanValue;
    else if ('timestampValue' in val) data[key] = val.timestampValue;
    else if ('arrayValue' in val) {
      data[key] = (val.arrayValue?.values || []).map((v) => v.stringValue || v);
    }
  }
  return normalizeEnquiry(data.id, data);
}

function withTimeout(promise, ms = 4000, label = 'Firestore operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function createEnquiry(enquiryData) {
  const validation = validateEnquiryData(enquiryData);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(' '));
  }

  const customerName = (enquiryData.customerName || enquiryData.fullName || enquiryData.name || '').trim();
  const email = (enquiryData.email || '').trim().toLowerCase();
  const phone = (enquiryData.phone || '').trim();
  const companyName = (enquiryData.companyName || enquiryData.company || '').trim();
  const selectedService = (enquiryData.selectedService || enquiryData.serviceType || enquiryData.type || 'General Shoot').trim();
  const enquiryMessage = (enquiryData.enquiryMessage || enquiryData.message || enquiryData.notes || '').trim() || 'No message provided.';
  const city = (enquiryData.city || 'Bengaluru').trim();
  const locality = (enquiryData.locality || enquiryData.area || '').trim();
  const eventDate = enquiryData.eventDate || enquiryData.date || '';
  const sourcePage = enquiryData.sourcePage || enquiryData.source || 'Booking Section';
  const createdAt = new Date().toISOString();

  const docPayload = {
    customerName,
    fullName: customerName,
    email,
    phone,
    companyName: companyName || '',
    selectedService,
    serviceType: selectedService,
    enquiryMessage,
    message: enquiryMessage,
    city,
    locality,
    eventDate,
    status: 'New',
    sourcePage,
    source: sourcePage,
    createdAt,
  };

  let savedDocId = null;
  let lastError = null;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig?.apiKey;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig?.projectId;

  if (apiKey && projectId) {
    try {
      const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${ENQUIRIES_COLLECTION}?key=${apiKey}`;
      const restRes = await fetch(restUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toFirestoreFields(docPayload)),
      });

      if (restRes.ok) {
        const docData = await restRes.json();
        savedDocId = docData.name?.split('/').pop();
        console.log(`[Firestore] Successfully created enquiry document via REST API: ${savedDocId}`);
      } else {
        const errJson = await restRes.json().catch(() => ({}));
        const status = restRes.status;
        const msg = errJson?.error?.message || '';

        if (status === 404 && msg.includes('database (default) does not exist')) {
          throw new Error(
            `Cloud Firestore database is not created yet in project "${projectId}". Please visit https://console.firebase.google.com/project/${projectId}/firestore and click "Create database".`
          );
        } else if (status === 403) {
          throw new Error(
            `Firestore permission denied. Please verify that your Firestore Security Rules permit creating documents in "${ENQUIRIES_COLLECTION}".`
          );
        } else {
          lastError = new Error(`Firestore REST Error (${status}): ${msg}`);
        }
      }
    } catch (restErr) {
      if (restErr.message?.includes('not created yet') || restErr.message?.includes('permission denied')) {
        throw restErr;
      }
      lastError = restErr;
    }
  }

  if (!savedDocId && db) {
    try {
      const docRef = await withTimeout(
        addDoc(collection(db, ENQUIRIES_COLLECTION), {
          ...docPayload,
          timestamp: serverTimestamp(),
        }),
        4500,
        'Firestore addDoc'
      );
      savedDocId = docRef.id;
      console.log(`[Firestore] Successfully created enquiry document via Client SDK: ${savedDocId}`);
    } catch (sdkErr) {
      console.error('[Firestore] Client SDK write error:', sdkErr);
      if (sdkErr.code === 'not-found' || sdkErr.message?.includes('NOT_FOUND')) {
        throw new Error(
          `Cloud Firestore database is not created yet in project "${projectId}". Please visit https://console.firebase.google.com/project/${projectId}/firestore and click "Create database".`
        );
      } else if (sdkErr.code === 'permission-denied') {
        throw new Error(
          `Firestore permission denied. Please update security rules in Firebase Console to allow write to "${ENQUIRIES_COLLECTION}".`
        );
      }
      lastError = sdkErr;
    }
  }

  if (!savedDocId) {
    throw (
      lastError ||
      new Error('Failed to save enquiry to Firebase Firestore. Please check your Firestore connection and permissions.')
    );
  }

  return {
    id: savedDocId,
    ...docPayload,
  };
}

export function subscribeToEnquiries({ onData, onError }) {
  if (!isFirebaseConfigured || !db) {
    onError?.(new Error('Firebase is not configured. Please check environment variables in .env.local.'));
    return () => {};
  }

  try {
    const colRef = collection(db, ENQUIRIES_COLLECTION);
    let q;
    try {
      q = query(colRef, orderBy('createdAt', 'desc'));
    } catch {
      q = colRef;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => normalizeEnquiry(docSnap.id, docSnap.data()));
        items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onData(items);
      },
      (err) => {
        console.warn('[Firestore] onSnapshot error:', err);
        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
          return onSnapshot(
            colRef,
            (fallbackSnap) => {
              const fallbackItems = fallbackSnap.docs.map((d) => normalizeEnquiry(d.id, d.data()));
              fallbackItems.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
              onData(fallbackItems);
            },
            (fallbackErr) => onError?.(fallbackErr)
          );
        }
        onError?.(err);
      }
    );

    return unsubscribe;
  } catch (err) {
    onError?.(err);
    return () => {};
  }
}

export async function getEnquiriesFromFirestore({ search = '', status = 'all', sortBy = 'newest' } = {}) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig?.apiKey;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig?.projectId;

  let list = [];

  if (apiKey && projectId) {
    try {
      const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${ENQUIRIES_COLLECTION}?key=${apiKey}`;
      const res = await fetch(restUrl, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.documents)) {
          list = json.documents.map(parseFirestoreDoc).filter(Boolean);
        }
      }
    } catch {}
  }

  if (list.length === 0 && db) {
    try {
      const colRef = collection(db, ENQUIRIES_COLLECTION);
      const snapshot = await withTimeout(getDocs(colRef), 4000, 'getDocs enquiries');
      list = snapshot.docs.map((docSnap) => normalizeEnquiry(docSnap.id, docSnap.data()));
    } catch (err) {
      console.warn('[Firestore] getDocs notice:', err?.message);
    }
  }

  if (search && search.trim()) {
    const term = search.toLowerCase().trim();
    list = list.filter(
      (item) =>
        item.customerName?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.phone?.toLowerCase().includes(term) ||
        item.companyName?.toLowerCase().includes(term) ||
        item.selectedService?.toLowerCase().includes(term) ||
        item.enquiryMessage?.toLowerCase().includes(term)
    );
  }

  if (status && status !== 'all') {
    const targetStatus = status.toLowerCase();
    list = list.filter((item) => (item.status || '').toLowerCase() === targetStatus);
  }

  list.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return sortBy === 'oldest' ? timeA - timeB : timeB - timeA;
  });

  return list;
}

export async function updateEnquiryStatusInFirestore(id, newStatus, adminEmail = 'admin@reelxpress.com') {
  const normalizedStatus =
    newStatus.toLowerCase() === 'completed' || newStatus.toLowerCase() === 'resolved'
      ? 'Completed'
      : newStatus.toLowerCase() === 'contacted'
      ? 'Contacted'
      : 'New';

  const updatedAt = new Date().toISOString();

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig?.apiKey;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig?.projectId;

  if (apiKey && projectId) {
    try {
      const updateFields = {
        status: { stringValue: normalizedStatus },
        updatedAt: { stringValue: updatedAt },
        updatedBy: { stringValue: adminEmail },
      };
      const mask = 'updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt&updateMask.fieldPaths=updatedBy';
      const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${ENQUIRIES_COLLECTION}/${id}?${mask}&key=${apiKey}`;

      const res = await fetch(restUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: updateFields }),
      });

      if (res.ok) {
        return { success: true, id, status: normalizedStatus };
      }
    } catch {}
  }

  if (db) {
    const docRef = doc(db, ENQUIRIES_COLLECTION, id);
    await updateDoc(docRef, {
      status: normalizedStatus,
      updatedAt,
      updatedBy: adminEmail,
    });
    return { success: true, id, status: normalizedStatus };
  }

  throw new Error('Could not update status: Firestore database is not accessible.');
}

export async function deleteEnquiryFromFirestore(id) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig?.apiKey;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig?.projectId;

  if (apiKey && projectId) {
    try {
      const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${ENQUIRIES_COLLECTION}/${id}?key=${apiKey}`;
      const res = await fetch(restUrl, { method: 'DELETE' });
      if (res.ok) {
        return { success: true, id };
      }
    } catch {}
  }

  if (db) {
    const docRef = doc(db, ENQUIRIES_COLLECTION, id);
    await deleteDoc(docRef);
    return { success: true, id };
  }

  throw new Error('Could not delete enquiry: Firestore database is not accessible.');
}

export async function updateEnquiryCalendarSyncInFirestore(id, syncData, adminEmail = 'admin@reelxpress.com') {
  const {
    googleCalendarEventId,
    googleCalendarSyncStatus = 'synced',
    googleCalendarSyncedAt = new Date().toISOString(),
    googleCalendarEventUrl = '',
  } = syncData;

  const updatedAt = new Date().toISOString();

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig?.apiKey;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig?.projectId;

  if (apiKey && projectId) {
    try {
      const updateFields = {
        googleCalendarEventId: { stringValue: googleCalendarEventId || '' },
        googleCalendarSyncStatus: { stringValue: googleCalendarSyncStatus },
        googleCalendarSyncedAt: { stringValue: googleCalendarSyncedAt },
        googleCalendarEventUrl: { stringValue: googleCalendarEventUrl || '' },
        updatedAt: { stringValue: updatedAt },
        updatedBy: { stringValue: adminEmail },
      };
      const mask = [
        'updateMask.fieldPaths=googleCalendarEventId',
        'updateMask.fieldPaths=googleCalendarSyncStatus',
        'updateMask.fieldPaths=googleCalendarSyncedAt',
        'updateMask.fieldPaths=googleCalendarEventUrl',
        'updateMask.fieldPaths=updatedAt',
        'updateMask.fieldPaths=updatedBy',
      ].join('&');
      const restUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${ENQUIRIES_COLLECTION}/${id}?${mask}&key=${apiKey}`;

      const res = await fetch(restUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: updateFields }),
      });

      if (res.ok) {
        return { success: true, id, ...syncData };
      }
    } catch (err) {
      console.warn('[Enquiries] REST calendar sync notice:', err.message);
    }
  }

  if (db) {
    const docRef = doc(db, ENQUIRIES_COLLECTION, id);
    await updateDoc(docRef, {
      googleCalendarEventId: googleCalendarEventId || '',
      googleCalendarSyncStatus,
      googleCalendarSyncedAt,
      googleCalendarEventUrl: googleCalendarEventUrl || '',
      updatedAt,
      updatedBy: adminEmail,
    });
    return { success: true, id, ...syncData };
  }

  return { success: true, id, ...syncData };
}

export const createInquiry = createEnquiry;
export const getInquiries = getEnquiriesFromFirestore;
export const updateInquiryStatus = updateEnquiryStatusInFirestore;
export const updateInquiryCalendarSync = updateEnquiryCalendarSyncInFirestore;
export const deleteInquiry = deleteEnquiryFromFirestore;
