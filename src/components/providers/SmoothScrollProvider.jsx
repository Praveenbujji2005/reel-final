'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export default function SmoothScrollProvider({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      try {
        window.history.scrollRestoration = 'manual';
      } catch {}
    }

    if (typeof document !== 'undefined' && !document.getElementById('reelxpress-pro-loader')) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isTouchDevice =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);

    function handleAnchorClick(e) {
      const link = e.target.closest('a[href*="#"]');
      if (!link) return;

      const rawHref = link.getAttribute('href');
      if (!rawHref) return;

      let hash = '';
      if (rawHref.startsWith('#')) {
        hash = rawHref;
      } else if (
        rawHref.startsWith('/#') &&
        (typeof window !== 'undefined' &&
          (window.location.pathname === '/' || window.location.pathname === ''))
      ) {
        hash = rawHref.substring(1);
      }

      if (!hash || hash === '#') return;

      try {
        const targetElement = document.querySelector(hash);
        if (targetElement) {
          e.preventDefault();
          const header = document.querySelector('header');
          const headerOffset = header ? header.offsetHeight + 24 : 88;

          if (window.lenis && typeof window.lenis.scrollTo === 'function' && !isTouchDevice) {
            window.lenis.scrollTo(targetElement, {
              offset: -headerOffset,
              duration: 1.2,
            });
          } else {
            const elPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
              top: elPosition - headerOffset,
              behavior: 'smooth',
            });
          }

          if (window.history.pushState) {
            window.history.pushState(null, '', hash);
          }
        }
      } catch {}
    }

    document.addEventListener('click', handleAnchorClick);

    if (prefersReducedMotion || isTouchDevice) {
      window.lenis = {
        scrollTo: (target, opts) => {
          const el = typeof target === 'string' ? document.querySelector(target) : target;
          if (el) {
            const header = document.querySelector('header');
            const offset = (opts?.offset ?? (header ? -header.offsetHeight - 24 : -88));
            const pos = el.getBoundingClientRect().top + window.pageYOffset + offset;
            window.scrollTo({ top: pos, behavior: 'smooth' });
          }
        },
        start: () => {},
        stop: () => {},
        resize: () => {},
      };

      return () => {
        document.removeEventListener('click', handleAnchorClick);
        window.lenis = null;
        if (typeof document !== 'undefined') {
          document.body.style.overflow = '';
        }
      };
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.0,
      infinite: false,
    });

    lenisRef.current = lenis;
    window.lenis = lenis;

    let rafId;
    let isRunning = true;
    function raf(time) {
      if (!isRunning) return;
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    const handleWindowLoad = () => {
      lenis.resize();
    };
    window.addEventListener('load', handleWindowLoad);
    window.addEventListener('resize', handleWindowLoad, { passive: true });

    const timer1 = setTimeout(() => lenis.resize(), 500);
    const timer2 = setTimeout(() => lenis.resize(), 1500);

    return () => {
      isRunning = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
      cancelAnimationFrame(rafId);
      window.removeEventListener('load', handleWindowLoad);
      window.removeEventListener('resize', handleWindowLoad);
      document.removeEventListener('click', handleAnchorClick);
      try {
        lenis.destroy();
      } catch {}
      window.lenis = null;
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, []);

  return <>{children}</>;
}
