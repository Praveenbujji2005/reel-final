'use client';

import React, { useState, useEffect } from 'react';
import { getPricingPlans, getCachedPricingPlans, subscribeToPricingPlans } from '@/lib/cmsServices';

const DEFAULT_LUXE_DATA = {
  id: 'luxe-exclusive',
  category: 'luxe',
  tag: 'LUXE EXPERIENCE',
  name: 'ReelXpress Luxe',
  headline: 'Our Most Exclusive Experience.',
  description:
    'Our premium tier — handpicked creators, cinematic shooting, and an experience built for the finest events.',
  price: '19,999',
  priceSuffix: 'per event',
  shootType: 'ReelXpress Luxe (Starts at ₹19,999)',
  features: [
    'iPhone 16/17 Pro only',
    'Top 1% creators',
    'Cinematic direction',
    'Same-day delivery',
    'Dedicated creative director on-site',
    'High-bitrate 4K HDR ProRes capture',
  ],
};

export default function LuxeSection() {
  const [luxeData, setLuxeData] = useState(DEFAULT_LUXE_DATA);

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
        const rawPrice = (found.price || '19,999').replace(/[^0-9,]/g, '') || '19,999';
        setLuxeData((prev) => ({
          ...prev,
          ...found,
          price: rawPrice,
          description: found.description || prev.description,
          features:
            Array.isArray(found.inclusions) && found.inclusions.length > 0
              ? found.inclusions
              : prev.features,
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
    const shootType = luxeData.shootType || 'ReelXpress Luxe (Starts at ₹19,999)';
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

  return (
    <section
      id="luxe"
      aria-label="ReelXpress Luxe Experience"
      className="relative w-full py-16 sm:py-20 md:py-28 px-4 sm:px-6 md:px-margin max-w-[1440px] mx-auto select-none scroll-mt-20 md:scroll-mt-28 bg-[#0A0A0F]"
    >
      <style jsx>{`
        .luxe-film-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.038'/%3E%3C/svg%3E");
        }

        .luxe-gold-glow {
          background: radial-gradient(
            ellipse 75% 60% at 50% 50%,
            rgba(212, 175, 55, 0.16) 0%,
            rgba(184, 134, 11, 0.05) 50%,
            transparent 100%
          );
        }

        .luxe-glass-card {
          background: radial-gradient(
            circle at 20% 15%,
            rgba(36, 26, 18, 0.7) 0%,
            rgba(18, 14, 24, 0.8) 50%,
            rgba(10, 8, 15, 0.92) 100%
          );
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(212, 175, 55, 0.3);
          box-shadow:
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.12),
            inset 0 0 32px 0 rgba(212, 175, 55, 0.06),
            0 24px 80px -15px rgba(0, 0, 0, 0.85);
        }

        .luxe-gold-text {
          background: linear-gradient(135deg, #F9E27D 0%, #D4AF37 45%, #B8860B 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .luxe-cta-button {
          background: linear-gradient(135deg, #F9E27D 0%, #D4AF37 45%, #B8860B 100%);
          color: #1A1200;
          box-shadow: 0 8px 30px rgba(212, 175, 55, 0.45);
          transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
                      box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .luxe-cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(212, 175, 55, 0.65);
        }

        .luxe-cta-button:active {
          transform: translateY(0) scale(0.97);
        }

        .luxe-cta-button::after {
          content: '';
          position: absolute;
          top: -50%;
          bottom: -50%;
          left: 0;
          width: 45px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.7),
            transparent
          );
          animation: luxeShineSweep 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          pointer-events: none;
        }

        @keyframes luxeShineSweep {
          0% {
            transform: translateX(-150%) skewX(-20deg);
          }
          32%, 100% {
            transform: translateX(350%) skewX(-20deg);
          }
        }

        .luxe-feature-row {
          background: rgba(22, 18, 29, 0.55);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: border-color 0.3s ease,
                      background-color 0.3s ease,
                      transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          animation: luxeFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }

        .luxe-feature-row:hover {
          border-color: rgba(212, 175, 55, 0.55);
          background-color: rgba(212, 175, 55, 0.08);
          transform: translateX(6px);
        }

        @keyframes luxeFadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Subtle Cinematic Film-Grain Texture */}
      <div
        className="luxe-film-grain absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Soft Warm Gold Radial Glow Behind Card */}
      <div
        className="luxe-gold-glow absolute inset-0 max-w-[1280px] mx-auto pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Ambient Lighting Orbs */}
      <div
        className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(249,226,125,0.12)_0%,transparent_70%)] blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)] blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Glassmorphic Luxe Card */}
      <article className="luxe-glass-card relative z-10 rounded-[28px] p-6 sm:p-10 md:p-14 lg:p-16 overflow-hidden">
        {/* Subtle Card Header Corner Accent Glow */}
        <div
          className="absolute top-0 right-0 w-72 h-72 bg-[radial-gradient(circle,rgba(212,175,55,0.1)_0%,transparent_70%)] blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column: Brand, Headline, Subtext, Price & CTA */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6 sm:space-y-7">
            {/* Logo: ReelXpress with LUXE tag */}
            <div className="flex items-center gap-3">
              <img
                src="/brand/reelxpress-luxe-logo-transparent.png"
                alt="ReelXpress LUXE"
                className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-[0_4px_22px_rgba(212,175,55,0.35)] select-none"
                loading="eager"
              />
            </div>

            {/* Headline: "Our Most Exclusive Experience." */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold text-white tracking-tight leading-[1.12]">
              Our Most Exclusive <span className="luxe-gold-text">Experience.</span>
            </h2>

            {/* Subtext */}
            <p className="text-sm sm:text-base md:text-lg text-zinc-300 font-normal leading-relaxed max-w-xl">
              {luxeData.description}
            </p>

            {/* Price & CTA Button Container */}
            <div className="pt-2 sm:pt-4 w-full flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
              {/* Price Block: Starts at ₹19,999 per event */}
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-[#D4AF37]/90">
                  Starts at
                </span>
                <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#D4AF37]">
                  ₹
                </span>
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                  {luxeData.price}
                </span>
                <span className="text-xs sm:text-sm text-zinc-400 font-medium ml-1">
                  {luxeData.priceSuffix || 'per event'}
                </span>
              </div>

              {/* Gold Gradient CTA Button: See Luxe → */}
              <a
                href="#booking"
                onClick={handleBookLuxe}
                className="luxe-cta-button group relative overflow-hidden rounded-full px-8 py-4 font-bold text-sm sm:text-base tracking-wide flex items-center justify-center gap-3 w-full sm:w-auto cursor-pointer"
                aria-label="See Luxe package and check availability"
              >
                <span>See Luxe</span>
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Column: Feature List Pills */}
          <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-3.5 w-full">
            <ul className="flex flex-col gap-3 sm:gap-3.5 w-full m-0 p-0 list-none">
              {luxeData.features.map((feature, idx) => (
                <li
                  key={`luxe-feature-${idx}`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                  className="luxe-feature-row rounded-xl sm:rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between text-sm sm:text-[15px] font-semibold text-zinc-200 shadow-sm"
                >
                  <span className="tracking-wide">{feature}</span>
                  {/* Small Gold Sparkle / Diamond Icon */}
                  <span
                    className="w-6 h-6 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center shrink-0 ml-3"
                    aria-hidden="true"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.4 14.4L2 12L9.6 9.6L12 2Z" />
                    </svg>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    </section>
  );
}
