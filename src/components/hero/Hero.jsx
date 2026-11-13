'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import StatCard from './StatCard';
import PortfolioCarousel from '../sections/PortfolioCarousel';
import Icon from '@/components/ui/Icon';

/**
 * MobileStatItem with IntersectionObserver-triggered count-up animation
 */
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
      <div className="flex items-center justify-center gap-1.5 leading-none">
        <span className="text-[28px] xs:text-[32px] sm:text-[36px] font-black tracking-tight text-white leading-none tabular-nums">
          {displayValue}
        </span>
        {hasStar && (
          <span className="text-[#FF7A33] text-[24px] xs:text-[26px] leading-none drop-shadow-[0_0_10px_rgba(255,122,51,0.65)] select-none">
            ★
          </span>
        )}
      </div>
      <span className="text-white/70 text-[12px] sm:text-[14px] mt-2 font-medium tracking-wide">
        {label}
      </span>
    </div>
  );
}

/**
 * Hero Component
 *
 * Streamlined dark-luxury hero section:
 * - Eyebrow badge, main headline, and sub-line with sequential reveals
 * - Desktop (>= 768px): Side-by-side primary CTAs & balanced 2-column StatCards row
 * - Mobile (< 768px): Redesigned mobile hero bottom section:
 *     1. Trust Chips (1 on first row, 2 per row) with glassmorphism
 *     2. Centered CTA buttons (Vibrant Book Now + Crystal-Clear Glass Become a Creator)
 *     3. Service Tiles (3 in a row with glassmorphic backdrop and bright icons)
 *     4. Balanced 2-column Stats Row (45,000+ Reels, 4.8★ Average Rating, NO 200+ Creators)
 *     5. Animated subtle orange line beneath statistics
 *     6. 90px bottom padding to prevent WhatsApp widget overlap
 * - Key creative showcase ("THE REAL WORK") interactive 3D video portfolio carousel
 */
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
      {/* Subtle Grid Pattern Overlay */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-50 -z-10"
        aria-hidden="true"
      />

      {/* Main Headline with Sequential Entrance */}
      <h1 className="reveal-on-scroll hero-animate-1 text-white w-full max-w-6xl mx-auto mb-6 sm:mb-8 select-none text-center">
        <span className="inline-flex flex-wrap items-center justify-center text-[clamp(15px,4.3vw,52px)] font-extrabold tracking-tight leading-[1.2]">
          <span className="whitespace-nowrap">Shoot The Moment</span>
          <img
            src="/brand/reelxpress-gold-x.png"
            alt="reelXpress Mark"
            className="inline-block h-[0.88em] w-auto mx-1.5 sm:mx-2.5 md:mx-3 object-contain drop-shadow-[0_0_14px_rgba(255,200,60,0.5)] shrink-0 select-none"
            loading="eager"
          />
          <span className="whitespace-nowrap">Own The Spotlight</span>
        </span>
        <span className="block mt-2 sm:mt-3 text-[clamp(20px,5.4vw,62px)] font-black tracking-tight leading-[1.15] bg-gradient-to-r from-[#FFA033] via-[#FF7A33] to-[#FF5E1E] bg-clip-text text-transparent hero-animate-2 drop-shadow-[0_2px_12px_rgba(255,109,41,0.25)]">
          We Deliver The Reel.
        </span>
      </h1>

      {/* Sub-line */}
      <p className="reveal-on-scroll hero-animate-3 text-sm sm:text-lg md:text-xl font-normal text-white/75 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
        You live the moment. reelXpress captures it — instantly. Shot on latest iPhone gear with on-spot live editing.
      </p>

      {/* =========================================================================
          DESKTOP ONLY (>= 768px): SIDE-BY-SIDE CTAs & 2-CARD STATS ROW
         ========================================================================= */}
      <div className="hidden md:flex reveal-on-scroll hero-animate-4 relative z-30 w-full max-w-xl mx-auto flex-row items-center justify-center gap-6 mb-10 px-4">
        {/* Book Now Button: Vibrant Luxury Gradient */}
        <a
          href="#booking"
          onClick={handleBookNow}
          className="btn-orange-lux btn-shine-sweep group w-auto inline-flex items-center justify-center gap-2.5 px-10 py-4.5 rounded-full font-black text-base tracking-wider uppercase cursor-pointer select-none touch-manipulation min-h-[52px]"
          aria-label="Book reelXpress Now"
        >
          <span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">BOOK NOW</span>
          <Icon name="arrow_forward" size={20} className="text-white transition-transform duration-200 group-hover:translate-x-1" />
        </a>

        {/* Become a Creator Button: Crystal-Clear Glassmorphism */}
        <Link
          href="/creators"
          className="btn-glass-creator group w-auto inline-flex items-center justify-center gap-2.5 px-10 py-4.5 rounded-full font-black text-base tracking-wider uppercase cursor-pointer select-none touch-manipulation min-h-[52px]"
          aria-label="Become a Creator"
        >
          <span className="text-[#FF7A33]">BECOME A CREATOR</span>
          <Icon name="north_east" size={20} className="text-[#FF7A33] transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Desktop StatCards (Balanced 2-Column Layout, No 200+ Creators) */}
      <div className="hidden md:block reveal-on-scroll hero-animate-5 relative z-30 w-full max-w-2xl mx-auto mb-14 px-4">
        <div className="grid grid-cols-2 gap-6">
          <StatCard value="45,000+" label="Reels delivered" />
          <StatCard value="4.8" label="Average Rating" hasStar={true} />
        </div>
        {/* Animated subtle orange line from left to right beneath the statistics */}
        <div className="relative w-56 mx-auto mt-6 h-[2px] overflow-hidden rounded-full bg-white/5">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#FF7A33] to-transparent animate-stat-line-sweep" />
        </div>
      </div>

      {/* =========================================================================
          MOBILE ONLY (< 768px): REDESIGNED HERO BOTTOM SECTION
          - 1. Trust Chips (Semi-transparent glass, subtle borders, bright orange icons)
          - 2. Centered CTA Buttons (Vibrant Book Now + Crystal-Clear Glass Become a Creator)
          - 3. Service Tiles (Quick Shoot, Wedding Shoot, Vehicle Shoot with glassmorphism)
          - 4. Balanced 2-Column Stats Row (45,000+, 4.8★, Animated Counter, NO 200+ Creators)
          - 5. Animated subtle orange line beneath statistics
          - 90px bottom padding to prevent WhatsApp widget overlap
         ========================================================================= */}
      <div className="md:hidden relative z-30 w-full max-w-lg mx-auto flex flex-col items-center pb-[90px] px-2 select-none">
        {/* Subtle Brand Orange Radial Glow behind CTA area */}
        <div
          className="absolute top-24 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full pointer-events-none -z-10"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(255,122,51,0.12), transparent 60%)',
          }}
          aria-hidden="true"
        />

        {/* 1. TRUST CHIPS (Uniform semi-transparent glass, subtle border, vibrant orange icons) */}
        <div className="hero-animate-4 flex flex-col items-center gap-2.5 mb-7 w-full">
          {/* Row 1: 1 chip */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-[#161218]/70 backdrop-blur-md border border-white/10 rounded-full py-2.5 px-4 text-[13px] sm:text-[14px] font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <Icon name="star" size={17} className="text-[#FF7A33] drop-shadow-[0_0_8px_rgba(255,122,51,0.6)]" />
              <span>4.8★ Average Rating</span>
            </div>
          </div>
          {/* Row 2: 2 chips */}
          <div className="flex items-center justify-center gap-2.5 w-full">
            <div className="inline-flex items-center gap-2 bg-[#161218]/70 backdrop-blur-md border border-white/10 rounded-full py-2.5 px-3.5 text-[13px] sm:text-[14px] font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <Icon name="military_tech" size={17} className="text-[#FF7A33]" />
              <span>5,000+ Bookings Done</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-[#161218]/70 backdrop-blur-md border border-white/10 rounded-full py-2.5 px-3.5 text-[13px] sm:text-[14px] font-medium text-white shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <Icon name="bolt" size={17} className="text-[#FF7A33]" />
              <span>Delivery in Minutes</span>
            </div>
          </div>
          {/* Row 3: 2 chips */}
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

        {/* 2. CTA BUTTONS (centered, ~72-76% screen width, 14px gap) */}
        <div className="hero-animate-5 flex flex-col items-center gap-[14px] w-[74%] max-w-[310px] mb-8">
          {/* BOOK NOW: Vibrant luxury orange gradient, radius 20px, height 60px, surface highlight */}
          <a
            href="#booking"
            onClick={handleBookNow}
            className="w-full h-[60px] rounded-[20px] btn-orange-lux flex items-center justify-center text-white font-black text-[15px] tracking-[0.04em] uppercase cursor-pointer select-none touch-manipulation active:scale-[0.97]"
            aria-label="Book Now"
          >
            <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">BOOK NOW</span>
          </a>

          {/* BECOME A CREATOR: Crystal-clear glassmorphism, 18px backdrop blur, subtle orange border */}
          <Link
            href="/creators"
            className="w-full h-[60px] rounded-[20px] btn-glass-creator flex items-center justify-center text-[#FF7A33] font-black text-[15px] tracking-[0.04em] uppercase cursor-pointer select-none touch-manipulation active:scale-[0.97]"
            aria-label="Become a Creator"
          >
            <span>BECOME A CREATOR</span>
          </Link>
        </div>

        {/* 3. SERVICE TILES (3 in a row, equal width cards, 12px gap, semi-transparent glass) */}
        <div className="hero-animate-6 grid grid-cols-3 gap-3 w-full px-2 mb-8">
          {/* Quick Shoot */}
          <Link
            href="/contact?service=Quick%20Shoot"
            className="flex flex-col items-center text-center p-3.5 py-4 rounded-[24px] bg-[#161218]/70 backdrop-blur-md border border-white/10 hover:border-[#FF7A33]/40 active:scale-95 transition-all shadow-[0_6px_20px_rgba(0,0,0,0.4)] cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-[rgba(255,122,51,0.15)] border border-[#FF7A33]/25 flex items-center justify-center mb-2.5 shadow-[0_0_12px_rgba(255,122,51,0.2)]">
              <Icon name="bolt" size={26} className="text-[#FF7A33]" />
            </div>
            <span className="text-[13.5px] sm:text-[15px] font-semibold text-white tracking-tight leading-tight">
              Quick Shoot
            </span>
          </Link>

          {/* Wedding Shoot */}
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

          {/* Vehicle Shoot */}
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

        {/* 4. STATS ROW (Balanced 2-Column Layout, Animated Number Counters, NO 200+ Creators) */}
        <div className="hero-animate-7 w-full border-t border-white/10 pt-8 mt-2">
          <div className="grid grid-cols-2 gap-4 text-center max-w-sm mx-auto">
            {/* Column 1: 45,000+ / Reels Delivered */}
            <MobileStatItem value="45,000+" label="Reels Delivered" />

            {/* Column 2: 4.8★ Average Rating */}
            <MobileStatItem value="4.8" label="Average Rating" hasStar={true} />
          </div>

          {/* 5. Animated subtle orange gradient line beneath the statistics */}
          <div className="relative w-44 mx-auto mt-6 h-[2px] overflow-hidden rounded-full bg-white/5">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#FF7A33] to-transparent animate-stat-line-sweep" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          KEY CREATIVE SHOWCASE ("THE REAL WORK")
          - Video carousel sits openly and seamlessly on the hero section background
          - Preserves #showcase anchor for navbar navigation
         ========================================================================= */}
      <div id="showcase" className="reveal-scale-on-scroll relative w-full max-w-7xl mx-auto mb-8 sm:mb-12 overflow-visible scroll-mt-20 md:scroll-mt-28">
        {/* Ambient Warm Radial Glow Behind Showcase */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[620px] md:w-[920px] h-[340px] sm:h-[480px] rounded-full bg-gradient-to-br from-[#FF5E1E]/12 via-[#5c1d00]/05 to-transparent blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />

        {/* Section Header */}
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

        {/* Fanned-Out Reel Portfolio Carousel */}
        <PortfolioCarousel onShowToast={onShowToast} />
      </div>
    </section>
  );
}
