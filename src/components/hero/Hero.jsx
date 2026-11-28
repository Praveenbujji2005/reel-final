'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import StatCard from './StatCard';
import PortfolioCarousel from '../sections/PortfolioCarousel';
import Icon from '@/components/ui/Icon';

function MobileStatItem({ value, label, hasStar = false }) {
  const [displayValue, setDisplayValue] = useState(value);
  const itemRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    const str = String(value).trim();
    const hasPlus = str.endsWith('+');
    const cleaned = str.replace(/[^\d.]/g, '');
    const isFloat = cleaned.includes('.');
    const targetNumber = parseFloat(cleaned);

    if (isNaN(targetNumber)) {
      setDisplayValue(value);
      return;
    }

    if (hasAnimatedRef.current) {
      setDisplayValue(value);
      return;
    }

    setDisplayValue(isFloat ? '0.0' : hasPlus ? '0+' : '0');

    let animationFrameId;

    const startCountUp = () => {
      if (hasAnimatedRef.current) return;
      hasAnimatedRef.current = true;

      const duration = 1800;
      const startTime = performance.now();

      const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentVal = targetNumber * ease;

        if (progress < 1) {
          if (isFloat) {
            setDisplayValue(currentVal.toFixed(1) + (hasPlus ? '+' : ''));
          } else {
            setDisplayValue(Math.floor(currentVal).toLocaleString('en-US') + (hasPlus ? '+' : ''));
          }
          animationFrameId = requestAnimationFrame(updateCounter);
        } else {
          setDisplayValue(value);
        }
      };

      animationFrameId = requestAnimationFrame(updateCounter);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          startCountUp();
        }
      },
      { threshold: 0.15 }
    );

    if (itemRef.current) observer.observe(itemRef.current);

    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value]);

  return (
    <div ref={itemRef} className="flex flex-col items-center">
      <div className="flex items-center justify-center gap-1 leading-none">
        <span className="text-[20px] xs:text-[23px] sm:text-[28px] font-black tracking-tight text-white leading-none tabular-nums">
          {displayValue}
        </span>
        {hasStar && (
          <span className="text-[#FF7A33] text-[17px] xs:text-[19px] sm:text-[22px] leading-none drop-shadow-[0_0_10px_rgba(255,122,51,0.65)] select-none">
            ★
          </span>
        )}
      </div>
      <span className="text-white/70 text-[11px] xs:text-[12px] sm:text-[13px] mt-1.5 font-medium tracking-tight text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

export default function Hero({ onShowToast }) {
  const handleBookNow = useCallback((e) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      e.preventDefault();
      window.location.href = '/contact';
      return;
    }
    e.preventDefault();
    const bookingEl = document.getElementById('booking') || document.getElementById('booking-form');
    if (bookingEl) {
      if (typeof window !== 'undefined' && window.lenis) {
        window.lenis.scrollTo(bookingEl, { offset: -60, duration: 1.2 });
      } else {
        bookingEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = '/contact';
    }
  }, []);

  return (
    <section
      id="hero"
      aria-label="ReelXpress Hero"
      className="relative pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-12 sm:pb-16 px-4 sm:px-6 md:px-margin w-full max-w-[1600px] mx-auto text-center flex flex-col items-center overflow-visible scroll-mt-20 md:scroll-mt-28"
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-50 -z-10"
        aria-hidden="true"
      />

      <h1 className="reveal-on-scroll hero-animate-1 text-white w-full max-w-6xl mx-auto mb-6 sm:mb-8 select-none text-center">
        <span className="inline-flex flex-wrap items-center justify-center text-[clamp(15px,4.3vw,52px)] font-extrabold tracking-tight leading-[1.2]">
          <span className="whitespace-nowrap">Shoot The Moment</span>
          <img
            src="/brand/reelxpress-orange-x.png"
            alt="reelXpress Mark"
            className="inline-block h-[0.88em] w-auto mx-1.5 sm:mx-2.5 md:mx-3 object-contain drop-shadow-[0_0_16px_rgba(255,109,41,0.6)] shrink-0 select-none"
            loading="eager"
          />
          <span className="whitespace-nowrap">Own The Spotlight</span>
        </span>
        <span className="block mt-2 sm:mt-3 text-[clamp(20px,5.4vw,62px)] font-black tracking-tight leading-[1.15] bg-gradient-to-r from-[#FFA033] via-[#FF7A33] to-[#FF5E1E] bg-clip-text text-transparent hero-animate-2 drop-shadow-[0_2px_12px_rgba(255,109,41,0.25)]">
          We Deliver The Reel.
        </span>
      </h1>

      <p className="reveal-on-scroll hero-animate-3 text-sm sm:text-lg md:text-xl font-normal text-white/75 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
        You live the moment. reelXpress captures it — instantly. Shot on latest iPhone gear with on-spot live editing.
      </p>

      <div className="hidden md:flex reveal-on-scroll hero-animate-4 relative z-30 w-full max-w-xl mx-auto flex-row items-center justify-center gap-6 mb-10 px-4">
        <a
          href="#booking"
          onClick={handleBookNow}
          className="btn-orange-lux btn-shine-sweep group w-auto inline-flex items-center justify-center gap-2.5 px-12 py-4.5 rounded-full font-black text-base tracking-wider uppercase cursor-pointer select-none touch-manipulation min-h-[52px]"
          aria-label="Book reelXpress Now"
        >
          <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">BOOK NOW</span>
          <Icon name="arrow_forward" size={20} className="text-white transition-transform duration-200 group-hover:translate-x-1" />
        </a>
      </div>

      <div className="hidden md:block reveal-on-scroll hero-animate-5 relative z-30 w-full max-w-3xl mx-auto mb-14 px-4">
        <div className="grid grid-cols-3 gap-6">
          <StatCard value="10,000+" label="Reels delivered" />
          <StatCard value="12,000+" label="Booking Done" />
          <StatCard value="4.8" label="Average Rating" hasStar={true} />
        </div>
        <div className="relative w-64 mx-auto mt-6 h-[2px] overflow-hidden rounded-full bg-white/5">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#FF7A33] to-transparent animate-stat-line-sweep" />
        </div>
      </div>

      <div className="md:hidden relative z-30 w-full max-w-lg mx-auto flex flex-col items-center pb-[90px] px-2 select-none">
        <div
          className="absolute top-24 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full pointer-events-none -z-10"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(255,122,51,0.12), transparent 60%)',
          }}
          aria-hidden="true"
        />

        <div className="hero-animate-4 flex flex-col items-center gap-2.5 mb-7 w-full">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-[#161218]/70 backdrop-blur-md border border-white/10 rounded-full py-2.5 px-4 text-[13px] sm:text-[14px] font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <Icon name="star" size={17} className="text-[#FF7A33] drop-shadow-[0_0_8px_rgba(255,122,51,0.6)]" />
              <span>4.8★ Average Rating</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2.5 w-full">
            <div className="inline-flex items-center gap-2 bg-[#161218]/70 backdrop-blur-md border border-white/10 rounded-full py-2.5 px-3.5 text-[13px] sm:text-[14px] font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <Icon name="military_tech" size={17} className="text-[#FF7A33]" />
              <span>12,000+ Bookings Done</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-[#161218]/70 backdrop-blur-md border border-white/10 rounded-full py-2.5 px-3.5 text-[13px] sm:text-[14px] font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <Icon name="bolt" size={17} className="text-[#FF7A33]" />
              <span>Delivery in Minutes</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2.5 w-full">
            <div className="inline-flex items-center gap-2 bg-[#161218]/70 backdrop-blur-md border border-white/10 rounded-full py-2.5 px-3.5 text-[13px] sm:text-[14px] font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <Icon name="phone_iphone" size={17} className="text-[#FF7A33]" />
              <span>Shot on Latest iPhone</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-[#161218]/70 backdrop-blur-md border border-white/10 rounded-full py-2.5 px-3.5 text-[13px] sm:text-[14px] font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <Icon name="currency_rupee" size={17} className="text-[#FF7A33]" />
              <span>Starting at ₹1,999</span>
            </div>
          </div>
        </div>

        <div className="hero-animate-5 flex flex-col items-center w-[74%] max-w-[310px] mb-8">
          <Link
            href="/contact"
            className="w-full h-[60px] rounded-[20px] btn-orange-lux flex items-center justify-center text-white font-black text-[15px] tracking-[0.04em] uppercase cursor-pointer select-none touch-manipulation active:scale-[0.97]"
            aria-label="Book Now"
          >
            <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">BOOK NOW</span>
          </Link>
        </div>

        <div className="hero-animate-6 grid grid-cols-3 gap-3 w-full px-2 mb-8">
          <Link
            href="/contact?service=All%20Event%20Shoot"
            className="flex flex-col items-center text-center p-3.5 py-4 rounded-[24px] bg-[#161218]/70 backdrop-blur-md border border-white/10 hover:border-[#FF7A33]/40 active:scale-95 transition-all shadow-[0_6px_20px_rgba(0,0,0,0.4)] cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-[rgba(255,122,51,0.15)] border border-[#FF7A33]/25 flex items-center justify-center mb-2.5 shadow-[0_0_12px_rgba(255,122,51,0.2)]">
              <Icon name="celebration" size={26} className="text-[#FF7A33]" />
            </div>
            <span className="text-[13px] sm:text-[14.5px] font-semibold text-white tracking-tight leading-tight">
              All Event Shoot
            </span>
          </Link>

          <Link
            href="/contact?service=Wedding%20Shoot"
            className="flex flex-col items-center text-center p-3.5 py-4 rounded-[24px] bg-[#161218]/70 backdrop-blur-md border border-white/10 hover:border-[#FF7A33]/40 active:scale-95 transition-all shadow-[0_6px_20px_rgba(0,0,0,0.4)] cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-[rgba(255,122,51,0.15)] border border-[#FF7A33]/25 flex items-center justify-center mb-2.5 shadow-[0_0_12px_rgba(255,122,51,0.2)]">
              <Icon name="favorite" size={26} className="text-[#FF7A33]" />
            </div>
            <span className="text-[13.5px] sm:text-[15px] font-semibold text-white tracking-tight leading-tight">
              Wedding Shoot
            </span>
          </Link>

          <Link
            href="/contact?service=Vehicle%20Shoot"
            className="flex flex-col items-center text-center p-3.5 py-4 rounded-[24px] bg-[#161218]/70 backdrop-blur-md border border-white/10 hover:border-[#FF7A33]/40 active:scale-95 transition-all shadow-[0_6px_20px_rgba(0,0,0,0.4)] cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-[rgba(255,122,51,0.15)] border border-[#FF7A33]/25 flex items-center justify-center mb-2.5 shadow-[0_0_12px_rgba(255,122,51,0.2)]">
              <Icon name="directions_car" size={26} className="text-[#FF7A33]" />
            </div>
            <span className="text-[13.5px] sm:text-[15px] font-semibold text-white tracking-tight leading-tight">
              Vehicle Shoot
            </span>
          </Link>
        </div>

        <div className="hero-animate-7 w-full border-t border-white/10 pt-8 mt-2">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center max-w-md mx-auto">
            <MobileStatItem value="10,000+" label="Reels Delivered" />

            <MobileStatItem value="12,000+" label="Booking Done" />

            <MobileStatItem value="4.8" label="Average Rating" hasStar={true} />
          </div>

          <div className="relative w-48 mx-auto mt-6 h-[2px] overflow-hidden rounded-full bg-white/5">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#FF7A33] to-transparent animate-stat-line-sweep" />
          </div>
        </div>
      </div>

      <div id="showcase" className="reveal-scale-on-scroll relative w-full max-w-7xl mx-auto mb-8 sm:mb-12 overflow-visible scroll-mt-20 md:scroll-mt-28">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[620px] md:w-[920px] h-[340px] sm:h-[480px] rounded-full bg-gradient-to-br from-[#FF5E1E]/12 via-[#5c1d00]/05 to-transparent blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div className="relative text-center max-w-3xl mx-auto mb-6 md:mb-10 z-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-glass-tinted border border-border-amber text-primary text-label-sm font-label-sm uppercase tracking-widest mb-3 shadow-[0_0_15px_rgba(255,94,30,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container rec-indicator" />
            <span>LIVE FEED</span>
          </div>
          <h2 className="text-3xl md:text-headline-lg font-display-xl font-extrabold text-text-primary tracking-tight mb-2">
            THE REAL WORK
          </h2>
          <p className="text-body-md md:text-title-md font-body-lg text-text-muted max-w-2xl mx-auto">
            Shot on Pro-grade gear. Edited on-site. Delivered via Cloud.
          </p>
        </div>

        <PortfolioCarousel onShowToast={onShowToast} />
      </div>
    </section>
  );
}
