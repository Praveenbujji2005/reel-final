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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBq9zNDqw6Oww_-_EWZ2muvdiGvVuHWQqI',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'reelxpress-a862c.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'reelxpress-a862c',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'reelxpress-a862c.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '754352444243',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:754352444243:web:2444292f0e2fd9de60c7a6',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-KX1T8RD0P2',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://reelxpress-a862c-default-rtdb.firebaseio.com',
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
