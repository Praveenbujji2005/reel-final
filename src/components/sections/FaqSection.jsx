'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FAQItem from './FAQItem';
import { FAQ_DATA } from '@/lib/data';
import { getFaqs, getCachedFaqs, subscribeToFaqs } from '@/lib/cmsServices';

export default function FaqSection() {
  const [faqs, setFaqs] = useState(FAQ_DATA);
  const [openIndex, setOpenIndex] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const applyFaqs = (items) => {
      if (isMounted && items && items.length > 0) {
        const active = items.filter((f) => f.enabled !== false);
        if (active.length > 0) {
          setFaqs(active);
        }
      }
      if (isMounted) setIsLoading(false);
    };

    const cached = getCachedFaqs();
    if (cached && cached.length > 0) {
      applyFaqs(cached);
    }

    getFaqs().then(applyFaqs).catch(() => {});

    const unsubscribeSnapshot = subscribeToFaqs(applyFaqs);

    const handleCmsUpdate = (e) => {
      if (!e.detail?.type || e.detail.type === 'faqs') {
        getFaqs({ forceRefresh: true }).then(applyFaqs);
      }
    };
    window.addEventListener('cms-cache-invalidated', handleCmsUpdate);

    return () => {
      isMounted = false;
      if (typeof unsubscribeSnapshot === 'function') unsubscribeSnapshot();
      window.removeEventListener('cms-cache-invalidated', handleCmsUpdate);
    };
  }, []);

  const toggleFaq = (idx) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  const displayedFaqs = showAll ? faqs : faqs.slice(0, 6);

  return (
    <section
      className="py-10 md:py-space-2xl px-4 sm:px-6 md:px-margin max-w-[1440px] mx-auto relative select-none scroll-mt-16 md:scroll-mt-28"
      id="faq"
      aria-label="Frequently Asked Questions"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 xl:gap-20 items-start">
        <div className="reveal-on-scroll lg:col-span-5 lg:sticky lg:top-28 lg:self-start space-y-4 sm:space-y-6">
          <span className="text-primary text-xs sm:text-sm font-bold uppercase tracking-[0.2em] block">
            FAQs
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-text-primary tracking-tight leading-[1.14]">
            Answers to<br className="hidden sm:inline" />
            {' '}Your Most Common<br className="hidden sm:inline" />
            {' '}Questions
          </h2>

          <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-md">
            Explore our FAQ section to find clear and concise answers to common queries about our services, processes, and more.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
            <a
              href="#booking"
              className="btn-glow-orange btn-shine-sweep inline-flex items-center justify-between sm:justify-center gap-3 px-7 py-3.5 rounded-full font-bold text-white text-sm transition-all shadow-md group cursor-pointer"
            >
              <span>Book your event now</span>
              <span className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center transition-colors shrink-0">
                <svg
                  className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </a>

            <Link
              href="/creators"
              className="btn-glow-dark inline-flex items-center justify-center px-7 py-3.5 rounded-full font-bold text-white text-sm transition-all cursor-pointer text-center"
            >
              Become a creator
            </Link>
          </div>
        </div>

        <div className="reveal-on-scroll lg:col-span-7 flex flex-col gap-3">
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="rounded-xl p-3.5 sm:p-4 md:p-5 bg-[#110e13] border border-white/5 flex items-center justify-between ambient-skeleton shadow-sm min-h-[58px]"
                >
                  <div className="w-3/4 h-5 rounded-md bg-white/10 ambient-pulse" />
                  <div className="w-7 h-7 rounded-full bg-white/10 shrink-0 ambient-pulse" />
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col gap-3 fade-in-content">
              {displayedFaqs.map((faq, idx) => (
                <FAQItem
                  key={`faq-${faq.id ?? idx}-${idx}`}
                  index={idx}
                  faq={faq}
                  isOpen={openIndex === idx}
                  onToggle={() => toggleFaq(idx)}
                />
              ))}

              {faqs.length > 6 && (
                <div className="pt-2 sm:pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAll((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-glass border border-border-specular hover:border-border-amber text-primary hover:text-primary-container font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer"
                  >
                    <span>{showAll ? 'Show fewer questions' : `View all ${faqs.length} Questions`}</span>
                    <span className="material-symbols-outlined text-base transition-transform duration-200">
                      {showAll ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
