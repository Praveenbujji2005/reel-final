'use client';

import { useEffect, useRef } from 'react';
import { META_PIXEL_ID, loadMetaPixel, trackMetaEvent } from '@/lib/metaPixel';

export default function MetaPixel({ viewContentId }) {
  const pageViewSentRef = useRef(false);

  useEffect(() => {
    if (pageViewSentRef.current) return;
    pageViewSentRef.current = true;
    loadMetaPixel();
    trackMetaEvent('PageView');
  }, []);

  useEffect(() => {
    if (!viewContentId || typeof IntersectionObserver === 'undefined') return;

    let observer;
    let retryTimer;
    let attempts = 0;
    let sent = false;

    const watch = () => {
      const target = document.getElementById(viewContentId);
      if (!target) {
        if (attempts++ < 20) retryTimer = setTimeout(watch, 500);
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          if (sent || !entries.some((entry) => entry.isIntersecting)) return;
          sent = true;
          observer.disconnect();
          trackMetaEvent('ViewContent', { content_name: 'Pricing', content_category: 'home_page' });
        },
        { threshold: 0, rootMargin: '0px 0px -40% 0px' }
      );
      observer.observe(target);
    };

    watch();

    return () => {
      clearTimeout(retryTimer);
      observer?.disconnect();
    };
  }, [viewContentId]);

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        alt=""
        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
      />
    </noscript>
  );
}
