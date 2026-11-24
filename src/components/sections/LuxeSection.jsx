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
  price: '20,000',
  priceSuffix: '',
  shootType: 'ReelXpress Luxe (Starts at ₹20,000)',
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
        const rawPrice = (found.price || '20,000').replace(/[^0-9,]/g, '') || '20,000';
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
    const shootType = luxeData.shootType || 'ReelXpress Luxe (Starts at ₹20,000)';
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
      className="relative w-full py-16 sm:py-20 md:py-28 px-4 sm:px-6 md:px-margin max-w-[1440px] mx-auto select-none scroll-mt-20 md:scroll-mt-28 bg-transparent"
    >
      <style jsx>{`
        .luxe-gold-text {
          background: linear-gradient(135deg, #F9E27D 0%, #D4AF37 45%, #B8860B 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .luxe-cta-button {
          position: relative;
          overflow: hidden;
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

        .luxe-cta-shine {
          position: absolute;
          top: -60%;
          bottom: -60%;
          width: 75px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.85) 50%,
            transparent 100%
          );
          transform: skewX(-25deg);
          animation: luxeShineSweep 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          pointer-events: none;
        }

        @keyframes luxeShineSweep {
          0% {
            left: -120px;
            opacity: 0;
          }
          6% {
            opacity: 1;
          }
          38% {
            left: 125%;
            opacity: 1;
          }
          39%, 100% {
            left: 125%;
            opacity: 0;
          }
        }

        .luxe-feature-row {
          background: rgba(35, 18, 11, 0.45);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(212, 175, 55, 0.18);
          transition: border-color 0.3s ease,
                      background-color 0.3s ease,
                      transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          animation: luxeFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }

        .luxe-feature-row:hover {
          border-color: rgba(249, 226, 125, 0.55);
          background-color: rgba(70, 37, 20, 0.45);
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

      {/* Direct Content Grid - Seamlessly blended into page background */}
      <div className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column: Brand, Headline, Subtext, Price & CTA */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-5 sm:space-y-6">
            {/* Logo: ReelXpress LUXE */}
            <div className="flex items-center">
              <img
                src="/brand/reelxpress-luxe-logo-transparent.png"
                alt="ReelXpress LUXE"
                className="h-6 sm:h-7 md:h-8 w-auto object-contain drop-shadow-[0_2px_14px_rgba(212,175,55,0.35)] select-none"
                loading="eager"
              />
            </div>

            {/* Headline: "Our Most Exclusive Experience." */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-extrabold text-white tracking-tight leading-[1.12]">
              Our Most Exclusive <span className="luxe-gold-text">Experience.</span>
            </h2>

            {/* Subtext */}
            <p className="text-sm sm:text-base md:text-lg text-white/80 font-normal leading-relaxed max-w-xl">
              {luxeData.description}
            </p>

            {/* Price & CTA Button Container */}
            <div className="pt-2 sm:pt-3 w-full flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
              {/* Price Block: Starts at ₹20,000 */}
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] sm:text-xs uppercase tracking-widest font-bold text-[#F9E27D]">
                  Starts at
                </span>
                <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#F9E27D]">
                  ₹
                </span>
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                  {luxeData.price}
                </span>
              </div>

              {/* Gold Gradient CTA Button: See Luxe → */}
              <a
                href="#booking"
                onClick={handleBookLuxe}
                className="luxe-cta-button group rounded-full px-8 py-4 font-bold text-sm sm:text-base tracking-wide flex items-center justify-center gap-3 w-full sm:w-auto cursor-pointer"
                aria-label="See Luxe package and check availability"
              >
                <div className="luxe-cta-shine" aria-hidden="true" />
                <span className="relative z-10">See Luxe</span>
                <svg
                  className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1"
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
                  className="luxe-feature-row rounded-xl sm:rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between text-sm sm:text-[15px] font-semibold text-zinc-100 shadow-sm"
                >
                  <span className="tracking-wide">{feature}</span>
                  {/* Small Gold Sparkle / Diamond Icon */}
                  <span
                    className="w-6 h-6 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#F9E27D] flex items-center justify-center shrink-0 ml-3"
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
      </div>
    </section>
  );
}
