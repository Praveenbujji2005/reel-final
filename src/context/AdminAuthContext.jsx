'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';

const AdminAuthContext = createContext(null);

const FAILED_ATTEMPTS_KEY = 'reelxpress_admin_failed_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockoutUntil, setLockoutUntil] = useState(null);

  useEffect(() => {
    try {
      const lockData = localStorage.getItem(FAILED_ATTEMPTS_KEY);
      if (lockData) {
        const { until } = JSON.parse(lockData);
        if (until && Date.now() < until) {
          setLockoutUntil(until);
        } else {
          localStorage.removeItem(FAILED_ATTEMPTS_KEY);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkServerSession() {
      try {
        const res = await fetch('/api/admin/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user && isMounted) {
            setUser(data.user);
            setLoading(false);
            return;
          }
        }
      } catch {}

      if (isFirebaseConfigured && auth) {
        const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
          if (!isMounted) return;
          if (fbUser) {
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || 'Administrator',
              provider: 'firebase',
            });
          } else {
            setUser(null);
          }
          setLoading(false);
        });
        return () => unsubscribe();
      } else {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    checkServerSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const recordFailedAttempt = () => {
    try {
      const current = JSON.parse(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '{"count":0}');
      const count = (current.count || 0) + 1;
      if (count >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
        localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify({ count, until }));
        setLockoutUntil(until);
      } else {
        localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify({ count }));
      }
    } catch {}
  };

  const clearFailedAttempts = () => {
    try {
      localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      setLockoutUntil(null);
    } catch {}
  };

  const login = async (email, password) => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const minsLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
      throw new Error(`Too many failed attempts. Account temporarily locked. Try again in ${minsLeft} minutes.`);
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      throw new Error('Please enter both email and password.');
    }

    if (isFirebaseConfigured && auth) {
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      } catch {}
    }

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      recordFailedAttempt();
      throw new Error(data.error || 'Invalid administrator email or password.');
    }

    clearFailedAttempts();
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}

    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch {}
    }

    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
  };

  const resetPassword = async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) throw new Error('Please provide your admin email.');

    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, cleanEmail);
      return { success: true, message: `Password reset instructions sent to ${cleanEmail}` };
    }

    return {
      success: true,
      message: `If an admin account exists for ${cleanEmail}, password reset instructions have been sent.`,
    };
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    lockoutUntil,
    login,
    logout,
    resetPassword,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
