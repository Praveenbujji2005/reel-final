'use client';

import { SITE_CONFIG } from '@/config/site';
import { CLIENT_BRANDS } from '@/lib/data';

export default function BrandTicker() {
  if (!SITE_CONFIG.SHOW_CLIENT_BRANDS) {
    return null;
  }

  return (
    <section
      className="py-12 md:py-16 border-y border-border-specular/40 bg-surface-deep/70 overflow-hidden relative select-none"
      aria-label="Client Brands Ticker"
    >
      <div className="absolute left-0 inset-y-0 w-24 sm:w-40 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-24 sm:w-40 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

      <div className="marquee-right-container flex overflow-hidden w-full">
        <div className="animate-marquee-right flex items-center shrink-0">
          {CLIENT_BRANDS.map((brand, idx) => (
            <div key={idx} className="flex items-center shrink-0 mx-6 sm:mx-10 md:mx-14">
              <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.25em] text-white/35 hover:text-white transition-colors duration-200 cursor-default">
                {brand}
              </span>
              <span className="ml-12 sm:ml-20 md:ml-28 w-1.5 h-1.5 rounded-full bg-primary-container/40" />
            </div>
          ))}
        </div>

        <div className="animate-marquee-right flex items-center shrink-0" aria-hidden="true">
          {CLIENT_BRANDS.map((brand, idx) => (
            <div key={`dup-${idx}`} className="flex items-center shrink-0 mx-6 sm:mx-10 md:mx-14">
              <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.25em] text-white/35 hover:text-white transition-colors duration-200 cursor-default">
                {brand}
              </span>
              <span className="ml-12 sm:ml-20 md:ml-28 w-1.5 h-1.5 rounded-full bg-primary-container/40" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
