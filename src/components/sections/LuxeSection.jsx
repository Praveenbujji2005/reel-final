'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getPricingPlans, getCachedPricingPlans, subscribeToPricingPlans } from '@/lib/cmsServices';

const DEFAULT_LUXE_PLAN = {
  id: 'luxe-exclusive',
  category: 'luxe',
  tag: 'LUXE EXPERIENCE',
  name: 'ReelXpress Luxe',
  headline: 'Our Most Exclusive Experience.',
  description:
    'ReelXpress Luxe is our premium tier — handpicked creators, cinematic shooting, and an experience built for the finest events.',
  price: '₹19,999',
  priceSuffix: 'per event',
  shootType: 'ReelXpress Luxe (Starts at ₹19,999)',
  features: [
    'iPhone 16/17 Pro only',
    'Top 1% creators',
    'Cinematic direction',
    'Same-day delivery',
  ],
};

export default function LuxeSection() {
  const [luxePlan, setLuxePlan] = useState(DEFAULT_LUXE_PLAN);

  useEffect(() => {
    let isMounted = true;

    const applyPlans = (plans) => {
      if (!isMounted || !Array.isArray(plans)) return;
      const found = plans.find(
        (p) =>
          (p.category === 'luxe' || p.id === 'luxe-exclusive' || p.name?.toLowerCase().includes('luxe')) &&
          p.enabled !== false
      );
      if (found) {
        setLuxePlan((prev) => ({
          ...prev,
          ...found,
          price: found.price || prev.price,
          description: found.description || prev.description,
          features: Array.isArray(found.inclusions) && found.inclusions.length > 0 ? found.inclusions : prev.features,
        }));
      }
    };

    const cached = getCachedPricingPlans();
    if (cached) applyPlans(cached);

    getPricingPlans().then(applyPlans).catch(() => {});
    const unsubscribe = subscribeToPricingPlans(applyPlans);

    const handleCmsUpdate = (e) => {
      if (!e.detail?.type || e.detail.type === 'pricing') {
        getPricingPlans({ forceRefresh: true }).then(applyPlans);
      }
    };
    window.addEventListener('cms-cache-invalidated', handleCmsUpdate);

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('cms-cache-invalidated', handleCmsUpdate);
    };
  }, []);

  const handleBookLuxe = (e) => {
    e.preventDefault();
    const shootType = luxePlan.shootType || 'ReelXpress Luxe';
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.location.href = `/contact?service=${encodeURIComponent(shootType)}`;
      return;
    }
    window.dispatchEvent(new CustomEvent('select-shoot-type', { detail: { type: shootType } }));
    const bookingEl = document.getElementById('booking-form') || document.getElementById('booking');
    if (bookingEl) {
      if (typeof window !== 'undefined' && window.lenis) {
        window.lenis.scrollTo(bookingEl, { offset: -60, duration: 1.2 });
      } else {
        bookingEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = `/contact?service=${encodeURIComponent(shootType)}`;
    }
  };

  const rawSuffix = (luxePlan.priceSuffix || 'per event')
    .replace(/\+?\s*18%\s*gst/gi, '')
    .replace(/\+?\s*gst/gi, '')
    .trim();

  return (
    <section
      id="luxe"
      aria-label="ReelXpress Luxe Experience"
      className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-margin max-w-[1440px] mx-auto relative select-none scroll-mt-20 md:scroll-mt-28"
    >
      <div className="relative rounded-3xl md:rounded-[36px] overflow-hidden border border-[#d4af37]/25 bg-gradient-to-br from-[#1d120a] via-[#140b06] to-[#0a0604] p-6 sm:p-10 md:p-14 lg:p-16 shadow-[0_25px_80px_rgba(0,0,0,0.85)]">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(242,140,60,0.18)_0%,transparent_70%)] blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
            <div className="inline-block">
              <img
                src="/brand/reelxpress-luxe-logo-transparent.png"
                alt="ReelXpress LUXE"
                className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-[0_4px_20px_rgba(212,175,55,0.35)] select-none"
                loading="eager"
              />
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.12]">
              Our Most Exclusive <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] via-[#F28C3C] to-[#ff9e59]">Experience.</span>
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-white/75 leading-relaxed max-w-xl font-normal">
              {luxePlan.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-baseline gap-2">
                <span className="text-xs sm:text-sm uppercase font-bold tracking-wider text-[#ffd700]">
                  Starts at
                </span>
                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                  {luxePlan.price}
                </span>
                {rawSuffix && (
                  <span className="text-xs sm:text-sm text-white/60 font-medium">
                    {rawSuffix}
                  </span>
                )}
              </div>

              <a
                href="#booking"
                onClick={handleBookLuxe}
                className="btn-glow-orange btn-shine-sweep inline-flex items-center gap-2.5 px-7 sm:px-8 py-3.5 rounded-full font-bold text-white text-sm tracking-wide transition-all shadow-[0_6px_25px_rgba(242,140,60,0.4)] active:scale-95 cursor-pointer"
              >
                <span>See Luxe</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-3.5 w-full">
            {luxePlan.features.map((feature, idx) => (
              <div
                key={`luxe-feature-${idx}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md px-5 sm:px-6 py-4 flex items-center justify-between text-sm sm:text-base font-semibold text-white/90 hover:border-[#ffd700]/50 hover:bg-white/[0.07] transition-all duration-200 shadow-sm"
              >
                <span>{feature}</span>
                <span className="w-6 h-6 rounded-full bg-[#ffd700]/15 text-[#ffd700] flex items-center justify-center shrink-0 text-xs">
                  ★
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
