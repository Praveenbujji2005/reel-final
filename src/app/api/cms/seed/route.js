import { NextResponse } from 'next/server';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { INITIAL_TESTIMONIALS, INITIAL_PRICING_PLANS } from '@/lib/cmsServices';
import { REEL_PORTFOLIO, FAQ_DATA } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    if (!isFirebaseConfigured || !db) {
      return NextResponse.json(
        { success: false, error: 'Firebase Firestore is not configured in environment variables.' },
        { status: 500 }
      );
    }

    const results = {
      hero: { seeded: 0, existing: 0 },
      pricing: { seeded: 0, existing: 0 },
      testimonials: { seeded: 0, existing: 0 },
      faqs: { seeded: 0, existing: 0 },
    };

    const heroSnap = await getDocs(collection(db, 'cms_hero'));
    if (heroSnap.empty) {
      for (const slide of REEL_PORTFOLIO) {
        const slideId = String(slide.id || `slide_${Date.now()}`);
        await setDoc(doc(db, 'cms_hero', slideId), {
          ...slide,
          id: slideId,
          enabled: slide.enabled !== false,
          order: Number(slide.order) || 1,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system_seed',
        }, { merge: true });
        results.hero.seeded++;
      }
    } else {
      results.hero.existing = heroSnap.size;
    }

    const pricingSnap = await getDocs(collection(db, 'cms_pricing'));
    if (pricingSnap.empty) {
      for (const plan of INITIAL_PRICING_PLANS) {
        const planId = String(plan.id || `plan_${Date.now()}`);
        await setDoc(doc(db, 'cms_pricing', planId), {
          ...plan,
          id: planId,
          enabled: plan.enabled !== false,
          order: Number(plan.order) || 1,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system_seed',
        }, { merge: true });
        results.pricing.seeded++;
      }
    } else {
      results.pricing.existing = pricingSnap.size;
    }

    const testSnap = await getDocs(collection(db, 'cms_testimonials'));
    if (testSnap.empty) {
      for (const t of INITIAL_TESTIMONIALS) {
        const tId = String(t.id || `t_${Date.now()}`);
        await setDoc(doc(db, 'cms_testimonials', tId), {
          ...t,
          id: tId,
          order: Number(t.order) || 1,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system_seed',
        }, { merge: true });
        results.testimonials.seeded++;
      }
    } else {
      results.testimonials.existing = testSnap.size;
    }

    const faqSnap = await getDocs(collection(db, 'cms_faqs'));
    if (faqSnap.empty) {
      for (let i = 0; i < FAQ_DATA.length; i++) {
        const faq = FAQ_DATA[i];
        const faqId = String(faq.id || `faq_${i + 1}`);
        await setDoc(doc(db, 'cms_faqs', faqId), {
          ...faq,
          id: faqId,
          order: i + 1,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system_seed',
        }, { merge: true });
        results.faqs.seeded++;
      }
    } else {
      results.faqs.existing = faqSnap.size;
    }

    return NextResponse.json({
      success: true,
      message: 'Firestore CMS seed completed successfully.',
      results,
    });
  } catch (err) {
    console.error('[API /api/cms/seed] Seed error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to seed Firestore CMS collections.' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return POST(request);
}
