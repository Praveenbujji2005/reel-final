'use client';

import React, { useState, useEffect } from 'react';

export function GoogleCalendarIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z" />
    </svg>
  );
}

export function GoogleColorIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function GoogleCalendarSettingsModal({
  isOpen,
  onClose,
  status,
  onStatusChange,
  pendingEnquiry = null,
}) {
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    clientId: '',
    clientSecret: '',
  });
  const [configMessage, setConfigMessage] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const redirectUri =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/google-calendar/callback`
      : 'http://localhost:3000/api/google-calendar/callback';

  useEffect(() => {
    if (showConfig && !configForm.clientId) {
      fetch('/api/google-calendar/config')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.clientIdPreview) {
            setConfigForm((prev) => ({
              ...prev,
              clientId: prev.clientId || data.clientIdPreview || '',
            }));
          }
        })
        .catch(() => {});
    }
  }, [showConfig]);

  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.type === 'GOOGLE_CALENDAR_CONNECTED') {
        if (typeof onStatusChange === 'function') {
          onStatusChange({
            connected: true,
            email: e.data.email,
            configured: true,
          });
        }
        setLoading(false);
      } else if (e.data?.type === 'GOOGLE_CALENDAR_ERROR') {
        setLoading(false);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onStatusChange]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setLoading(true);
    setConfigMessage(null);
    try {
      const res = await fetch('/api/google-calendar/auth-url');
      const data = await res.json();
      if (data.success && data.url) {
        const width = 540;
        const height = 650;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
          data.url,
          'google_calendar_oauth_popup',
          `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0`
        );
      } else {
        if (data.error === 'CONFIG_REQUIRED') {
          setShowConfig(true);
          setConfigMessage('Please enter your Google OAuth credentials below to connect.');
        } else {
          setConfigMessage(data.message || 'Failed to start Google connection.');
        }
        setLoading(false);
      }
    } catch (err) {
      setConfigMessage(err.message || 'Connection request failed.');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Calendar? You can reconnect anytime.')) return;
    setDisconnecting(true);
    try {
      const res = await fetch('/api/google-calendar/disconnect', { method: 'POST' });
      const data = await res.json();
      if (data.success && typeof onStatusChange === 'function') {
        onStatusChange({
          connected: false,
          email: null,
          configured: status?.configured,
        });
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    setConfigMessage(null);
    try {
      const res = await fetch('/api/google-calendar/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: configForm.clientId,
          clientSecret: configForm.clientSecret,
          redirectUri,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfigMessage({
          type: 'success',
          text: 'Credentials saved successfully in database! You can now click "Connect Google Calendar".',
        });
        if (typeof onStatusChange === 'function') {
          onStatusChange({ ...status, configured: true });
        }
      } else {
        setConfigMessage({
          type: 'error',
          text: data.error || 'Failed to save credentials.',
        });
      }
    } catch (err) {
      setConfigMessage({
        type: 'error',
        text: err.message || 'Failed to save credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyRedirectUri = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(redirectUri);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[#141014] border border-white/10 p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4285F4]/15 border border-[#4285F4]/30 flex items-center justify-center text-[#4285F4]">
              <GoogleCalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Google Calendar Sync</span>
              </h3>
              <p className="text-xs text-text-muted">
                Official Google Calendar API Integration for Enquiries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {pendingEnquiry && (
          <div className="my-4 p-3 rounded-xl bg-blue-950/50 border border-blue-500/40 text-blue-200 text-xs flex items-start gap-2.5">
            <span className="material-symbols-outlined text-blue-400 text-base shrink-0 mt-0.5">info</span>
            <div>
              <span className="font-semibold text-white">Action Required: </span>
              Connect your Google Calendar account below to schedule the shoot for{' '}
              <strong>{pendingEnquiry.customerName || pendingEnquiry.fullName}</strong>.
            </div>
          </div>
        )}

        <div className="my-5 p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-text-muted font-bold">
              Account Status
            </span>
            {status?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Not Connected</span>
              </span>
            )}
          </div>

          {status?.connected ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#1a151b] border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <GoogleColorIcon className="w-5 h-5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {status.email || 'Admin Google Account'}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      Calendar events will be scheduled directly on this account
                    </div>
                  </div>
                </div>
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#4285F4]/20 hover:bg-[#4285F4]/30 text-[#4285F4] text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Open Calendar
                </a>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleConnect}
                  className="text-xs text-text-muted hover:text-white transition-colors cursor-pointer"
                >
                  Switch / Re-authorize Account
                </button>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold transition-colors cursor-pointer"
                >
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                Connect your Google account to automatically create and sync calendar events with 30-minute reminders for customer shoots.
              </p>

              <button
                type="button"
                onClick={handleConnect}
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-xl bg-[#4285F4] hover:bg-[#3367d6] text-white font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <GoogleColorIcon className="w-5 h-5" />
                )}
                <span>Connect Google Calendar</span>
              </button>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between text-xs text-text-muted hover:text-white transition-colors py-2 cursor-pointer"
          >
            <span className="font-semibold">OAuth Credentials &amp; Setup Guide</span>
            <span className="material-symbols-outlined text-sm">
              {showConfig ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {showConfig && (
            <div className="mt-3 space-y-4 text-xs animate-fadeIn">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                  Authorized Redirect URI (Copy to Google Cloud Console)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={redirectUri}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-zinc-300 select-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyRedirectUri}
                    className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold whitespace-nowrap transition-colors"
                  >
                    {copyFeedback ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/10 space-y-1.5 text-zinc-400">
                <div className="font-bold text-white mb-1">Google Cloud Setup Instructions:</div>
                <div>1. Go to Google Cloud Console &gt; APIs &amp; Services &gt; Credentials.</div>
                <div>2. Create an OAuth 2.0 Client ID (Application type: <strong>Web application</strong>).</div>
                <div>3. Under <strong>Authorized redirect URIs</strong>, paste the exact URI above.</div>
                <div>4. Enable the <strong>Google Calendar API</strong> in API Library.</div>
                <div>5. Paste your Client ID &amp; Secret below or set in <code>.env.local</code>.</div>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Google Client ID
                  </label>
                  <input
                    type="text"
                    value={configForm.clientId}
                    onChange={(e) => setConfigForm({ ...configForm, clientId: e.target.value })}
                    placeholder="e.g. 754352444243-...apps.googleusercontent.com"
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-container border border-border-specular text-white text-xs outline-none focus:border-[#4285F4]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Google Client Secret
                  </label>
                  <input
                    type="password"
                    value={configForm.clientSecret}
                    onChange={(e) => setConfigForm({ ...configForm, clientSecret: e.target.value })}
                    placeholder="GOCSPX-..."
                    className="w-full px-3 py-2.5 rounded-lg bg-surface-container border border-border-specular text-white text-xs outline-none focus:border-[#4285F4]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !configForm.clientId || !configForm.clientSecret}
                  className="w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Save Credentials
                </button>
              </form>
            </div>
          )}

          {configMessage && (
            <div
              className={`mt-3 p-3 rounded-lg text-xs border ${
                typeof configMessage === 'object' && configMessage.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {typeof configMessage === 'object' ? configMessage.text : configMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
