import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  getPersistentCacheIndexManager,
  disablePersistentCacheIndexAutoCreation,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

try {
  setLogLevel('silent');
} catch {}

if (typeof window !== 'undefined' && typeof console !== 'undefined' && console.error) {
  const originalConsoleError = console.error.bind(console);
  console.error = (...args) => {
    const raw = args
      .map((arg) => (typeof arg === 'string' ? arg : arg?.message || ''))
      .join(' ');
    if (
      raw.includes("Failed to obtain primary lease for action 'Backfill Indexes'") ||
      raw.includes('Failed to obtain primary lease')
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 10 &&
  !firebaseConfig.apiKey.includes('YourFirebase') &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId.length > 3
);

let app = null;
let auth = null;
let db = null;
let storage = null;

if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'test') {
  try {
    if (isFirebaseConfigured) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);

      if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
        try {
          db = initializeFirestore(app, {
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager(),
            }),
          });
        } catch {
          db = getFirestore(app);
        }

        try {
          const indexManager = getPersistentCacheIndexManager(db);
          if (indexManager) {
            disablePersistentCacheIndexAutoCreation(indexManager);
          }
        } catch {}
      } else {
        db = getFirestore(app);
      }

      storage = getStorage(app);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Firebase initialization notice:', err?.message || err);
    }
  }
}

export { app, auth, db, storage, firebaseConfig };
