'use client';

import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      document.documentElement.classList.add('js-ready');
      document
        .querySelectorAll('.reveal-on-scroll, .reveal-scale-on-scroll')
        .forEach((el) => {
          el.classList.add('is-revealed');
          el.setAttribute('data-revealed', 'true');
        });
      return;
    }

    document.documentElement.classList.add('js-ready');

    const revealElements = Array.from(
      document.querySelectorAll('.reveal-on-scroll, .reveal-scale-on-scroll')
    );

    if (!revealElements.length) return;

    const markRevealed = (el) => {
      if (!el) return;
      el.classList.add('is-revealed');
      el.setAttribute('data-revealed', 'true');
    };

    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    revealElements.forEach((el) => {
      if (el.closest('#hero')) {
        markRevealed(el);
        return;
      }
      try {
        const rect = el.getBoundingClientRect();
        if (rect.top < vh * 0.9 && rect.bottom > 0) {
          markRevealed(el);
        }
      } catch {}
    });

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              markRevealed(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -40px 0px',
        }
      );

      revealElements.forEach((el) => {
        if (!el.classList.contains('is-revealed') && el.getAttribute('data-revealed') !== 'true') {
          observer.observe(el);
        }
      });

      return () => {
        observer.disconnect();
      };
    } else {
      revealElements.forEach(markRevealed);
    }
  }, []);
}
