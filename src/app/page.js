'use client';

import { useState, useCallback } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

import Navbar from '@/components/layout/Navbar';
import MobileMenu from '@/components/layout/MobileMenu';
import Footer from '@/components/layout/Footer';

import HeroSection from '@/components/sections/HeroSection';
import WhyUsSection from '@/components/sections/WhyUsSection';
import PricingSection from '@/components/sections/PricingSection';
import LuxeSection from '@/components/sections/LuxeSection';
import BrandTicker from '@/components/sections/BrandTicker';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import BlogSection from '@/components/sections/BlogSection';
import FaqSection from '@/components/sections/FaqSection';
import BookingSection from '@/components/sections/BookingSection';

import BookingModal from '@/components/ui/BookingModal';
import ToastNotification from '@/components/ui/ToastNotification';

export default function HomePage() {
  useScrollReveal();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const [toast, setToast] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'check_circle',
  });

  const showToast = useCallback((toastData) => {
    setToast({
      visible: true,
      title: toastData.title,
      message: toastData.message || '',
      icon: toastData.icon || 'check_circle',
    });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  }, []);

  const handleBookingSuccess = useCallback((details) => {
    setConfirmedBooking(details);
    setIsBookingModalOpen(true);
  }, []);

  return (
    <>
      <Navbar
        onOpenMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="relative z-10 flex-1">
        <HeroSection
          onShowToast={showToast}
        />
        <PricingSection />
        <LuxeSection />
        <WhyUsSection />
        <BrandTicker />
        <TestimonialsSection />
        <BlogSection />
        <FaqSection />
        <BookingSection onBookingSuccess={handleBookingSuccess} />
      </main>

      <Footer />

      <BookingModal
        isOpen={isBookingModalOpen}
        bookingDetails={confirmedBooking}
        onClose={() => setIsBookingModalOpen(false)}
      />

      <ToastNotification toast={toast} />
    </>
  );
}
