'use client';

import { useState } from 'react';

export default function ShareButton({ title, slug }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url =
      typeof window !== 'undefined'
        ? window.location.href
        : `https://reelxpress-final-5r6a.vercel.app/blog/${slug}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: title || 'reelXpress Article',
          url,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch {
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="btn-glass-creator inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white/90 hover:text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer"
      title="Share this article"
    >
      <span className="material-symbols-outlined text-sm text-primary">share</span>
      <span>{copied ? 'Link Copied!' : 'Share'}</span>
    </button>
  );
}
