import { db, storage, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  REEL_PORTFOLIO,
  FAQ_DATA,
} from './data';

export const CMS_STORAGE_KEYS = {
  hero: 'reelxpress_cms_hero',
  pricing: 'reelxpress_cms_pricing',
  testimonials: 'reelxpress_cms_testimonials',
  faqs: 'reelxpress_cms_faqs',
  activity: 'reelxpress_cms_activity_logs',
};

const LEGACY_STORAGE_KEYS = {
  hero: 'reelxpress_cms_hero_slides',
  pricing: 'reelxpress_cms_pricing_plans',
};


export const INITIAL_TESTIMONIALS = [
  {
    id: 'testi_1',
    name: 'Krishna D.',
    role: "Groom's Brother",
    quote:
      'Booked them just a day before the wedding. They showed up with iPhones and edited the video before the baraat ended. Unreal.',
    review:
      'Booked them just a day before the wedding. They showed up with iPhones and edited the video before the baraat ended. Unreal.',
    rating: 5,
    avatar: '/creators/dp-1.jpg',
    enabled: true,
    order: 1,
  },
  {
    id: 'testi_2',
    name: 'Padma M.',
    role: 'Brand Manager, Skincare Brand',
    quote:
      'We used reelXpress for our store launch - got high-quality reels before the event wrapped up. Perfect for social!',
    review:
      'We used reelXpress for our store launch - got high-quality reels before the event wrapped up. Perfect for social!',
    rating: 5,
    avatar: '/creators/dp-2.jpg',
    enabled: true,
    order: 2,
  },
  {
    id: 'testi_3',
    name: 'Radhika P.',
    role: 'Small Business Owner',
    quote:
      'As a new business, getting professional-looking content quickly helped us gain traction online. reelXpress is now our go-to team.',
    review:
      'As a new business, getting professional-looking content quickly helped us gain traction online. reelXpress is now our go-to team.',
    rating: 5,
    avatar: '/creators/dp-3.jpg',
    enabled: true,
    order: 3,
  },
  {
    id: 'testi_4',
    name: 'Harish G.',
    role: 'Event Planner',
    quote:
      'reelXpress has changed the way we capture events for our clients. No delays, no chasing, just pure magic delivered instantly.',
    review:
      'reelXpress has changed the way we capture events for our clients. No delays, no chasing, just pure magic delivered instantly.',
    rating: 5,
    avatar: '/creators/dp-4.jpg',
    enabled: true,
    order: 4,
  },
  {
    id: 'testi_5',
    name: 'Arjun S.',
    role: 'Influencer',
    quote:
      "I didn't have to do anything except show up. They shot, added trending music, and gave me perfect reels within the hour.",
    review:
      "I didn't have to do anything except show up. They shot, added trending music, and gave me perfect reels within the hour.",
    rating: 5,
    avatar: '/creators/dp-5.jpg',
    enabled: true,
    order: 5,
  },
  {
    id: 'testi_6',
    name: 'Sravanthi R.',
    role: 'Bride',
    quote:
      'I was literally watching our wedding reel before the reception dinner even started. These guys are insanely fast and so good!',
    review:
      'I was literally watching our wedding reel before the reception dinner even started. These guys are insanely fast and so good!',
    rating: 5,
    avatar: '/creators/dp-1.jpg',
    enabled: true,
    order: 6,
  },
];

export const INITIAL_PRICING_PLANS = [
  {
    id: 'instant-hourly',
    category: 'instant',
    tag: 'SINGLE EVENT',
    name: 'Hourly Plan',
    description: 'Perfect for anyone who wants a single, fast, high-quality reel delivered in minutes.',
    price: '₹ 2,200',
    priceSuffix: '',
    badge: 'BEST SELLER',
    isPopular: true,
    enabled: true,
    order: 1,
    shootType: 'Hourly Plan (₹2,200 - 1 Hour Shoot, 1 Reel)',
    inclusions: [
      '1 Hour Professional Shoot',
      '1 High-Quality Edited Reel',
      'Shot on Latest iPhone',
      'Instant reel delivery (within minutes)',
      'Instant Reel Maker on site',
      'reelXpress Branding Included',
      'Up to 2 Free Revisions',
    ],
    ctaText: 'Book Hourly',
  },
  {
    id: 'instant-vehicle',
    category: 'instant',
    tag: 'AUTOMOTIVE',
    name: 'Vehicle Shoot',
    description: 'Specialized dynamic reels for car & superbike deliveries, unboxings, and rallies.',
    price: '₹3,999',
    priceSuffix: 'onwards',
    badge: '',
    isPopular: false,
    enabled: true,
    order: 2,
    shootType: 'Vehicle Shoot (From ₹3,999 - Regular / Premium / Drone)',
    inclusions: [
      'Regular ₹3,999 · Premium ₹4,999 · Drone ₹8,999',
      'Dynamic rolling & tracking shots',
      'Shot on Latest iPhone with gimbal gear',
      'Instant reel delivery',
      'Sound design & exhaust note capture',
      'RAW content on request',
      'reelXpress Logo Mandatory',
    ],
    ctaText: 'Book Vehicle Shoot',
  },
  {
    id: 'instant-half-day',
    category: 'instant',
    tag: 'FOUR HOURS',
    name: 'Half Day',
    description: 'Ideal for parties, pop-up events, store launches, or multi-content creator shoots.',
    price: '₹8,500',
    priceSuffix: '',
    badge: '',
    isPopular: false,
    enabled: true,
    order: 3,
    shootType: 'Half Day Plan (₹8,500 - Up to 4 Hours, 3 Reels)',
    inclusions: [
      'Covers up to 4 hours event',
      'Includes 3 High-Impact Edited Reels',
      'Shot on Latest iPhone',
      'Instant reel delivery',
      'Dedicated Creator on site',
      'Complimentary mobile portraits',
      'reelXpress Logo Mandatory',
    ],
    ctaText: 'Book Half Day',
  },
  {
    id: 'instant-full-day',
    category: 'instant',
    tag: 'EIGHT HOURS',
    name: 'Full Day',
    description: 'Complete day-long coverage for exhibitions, major festivals, and marathon events.',
    price: '₹15,000',
    priceSuffix: '',
    badge: '',
    isPopular: false,
    enabled: true,
    order: 4,
    shootType: 'Full Day Plan (₹15,000 - Up to 8 Hours, 7 Reels)',
    inclusions: [
      'Covers up to 8 hours event',
      'Includes 7 High-Impact Edited Reels',
      'Shot on Latest iPhone',
      'Priority on-site delivery',
      'Full event storytelling & coverage',
      'All RAW footage provided on request',
      'reelXpress Logo Mandatory',
    ],
    ctaText: 'Book Full Day',
  },
  {
    id: 'business-brand',
    category: 'business',
    tag: 'COMPREHENSIVE',
    name: 'Brand shoot',
    description: 'Professional coverage tailored to campaign, launch, and showcase moments, scoped around your calendar and deliverables.',
    price: 'Customised',
    priceSuffix: '',
    badge: 'MOST FLEXIBLE',
    isPopular: true,
    enabled: true,
    order: 5,
    shootType: 'Brand Shoot (Customised Pricing - Campaign & Showcase)',
    inclusions: [
      'Cinematic visuals for premium brands & events',
      'Refined, brand-aligned storytelling',
      'Professional production with expert direction',
      'Hassle-free booking & coordination',
      'Quick turnaround: Cut. Polish. Launch.',
      'Ideal for campaigns, launches & brand showcases',
      'Dedicated creative director for every campaign',
      'reelXpress Logo Mandatory',
    ],
    ctaText: 'Book Now',
  },
  {
    id: 'business-product',
    category: 'business',
    tag: 'PER REEL',
    name: 'Product Shoot',
    description: 'High-converting product and catalog reels for e-commerce, D2C, and brand launches, shot and edited to make your product the hero.',
    price: '₹ 7,000',
    priceSuffix: 'onwards / per reel',
    badge: '',
    isPopular: false,
    enabled: true,
    order: 6,
    shootType: 'Product Shoot (₹7,000 / reel - E-commerce & Catalog)',
    inclusions: [
      'Product, catalog & e-commerce reels',
      'Studio or on-location shoots',
      'Cinematic reel delivery',
      'Shot on the latest iPhone',
      'RAW content on request',
      'reelXpress Logo Mandatory',
    ],
    ctaText: 'Enquire now',
  },
  {
    id: 'wedding-basic',
    category: 'wedding',
    tag: 'SINGLE EVENT',
    name: 'Basic',
    description: "Perfect for couples looking for a stunning, professionally crafted wedding shoot that won't break the bank.",
    price: '₹ 14,999',
    priceSuffix: '',
    badge: '',
    isPopular: false,
    enabled: true,
    order: 7,
    shootType: 'Wedding Basic (₹14,999 - Single Event, 3 Reels)',
    inclusions: [
      'Covers up to one event',
      'Includes 3 Reels',
      'Shot on iPhone',
      'Instant reel delivery',
      'Complimentary pictures',
      'Please provide an SD card to receive all raw content if needed',
      'reelXpress Logo Mandatory',
    ],
    ctaText: 'Book Basic',
  },
  {
    id: 'wedding-silver',
    category: 'wedding',
    tag: 'THREE EVENTS',
    name: 'Silver',
    description: 'Perfect for those who want comprehensive coverage with an extra touch of elegance.',
    price: '₹ 44,999',
    priceSuffix: '',
    badge: '',
    isPopular: false,
    enabled: true,
    order: 8,
    shootType: 'Wedding Silver (₹44,999 - Three Events, 10 Reels)',
    inclusions: [
      'Covers up to three event',
      'Includes 10 Reels',
      'Shot on iPhone',
      'Instant reel delivery',
      'Complimentary pictures',
      'Please provide an SD card to receive all raw content if needed',
      'reelXpress Logo Mandatory',
    ],
    ctaText: 'Book Silver',
  },
  {
    id: 'wedding-gold',
    category: 'wedding',
    tag: 'FOUR EVENTS',
    name: 'Gold',
    description: 'Perfect for couples who want an exclusive, comprehensive experience across four events.',
    price: '₹ 59,999',
    priceSuffix: '',
    badge: 'MOST POPULAR',
    isPopular: true,
    enabled: true,
    order: 9,
    shootType: 'Wedding Gold (₹59,999 - Four Events, 15 Reels)',
    inclusions: [
      'Covers up to four event',
      'Includes 15 Reels',
      'Shot on iPhone',
      'Instant reel delivery',
      'Complimentary pictures',
      'Please provide an SD card to receive all raw content if needed',
      'reelXpress Logo Mandatory',
    ],
    ctaText: 'Book Gold',
  },
  {
    id: 'wedding-platinum',
    category: 'wedding',
    tag: 'COMPLETE WEDDING',
    name: 'Platinum',
    description: 'For couples who want it all: every moment captured with unmatched attention to detail.',
    price: '₹ 99,999',
    priceSuffix: '',
    badge: '',
    isPopular: false,
    enabled: true,
    order: 10,
    shootType: 'Wedding Platinum (₹99,999 - Complete Wedding, 25 Reels)',
    inclusions: [
      'Covers whole wedding events',
      'Includes 25 Reels',
      'Shot on iPhone',
      'Instant reel delivery',
      'Interaction videos with complimentary mobile portraits',
      'Please provide an SD card to receive all raw content if needed',
      'reelXpress Logo Mandatory',
    ],
    ctaText: 'Book Platinum',
  },
  {
    id: 'luxe-exclusive',
    category: 'luxe',
    tag: 'LUXE EXPERIENCE',
    name: 'ReelXpress Luxe',
    description: 'Our premium tier — handpicked creators, cinematic shooting, and an experience built for the finest events.',
    price: '₹ 20,000',
    priceSuffix: '',
    badge: 'LUXURY',
    isPopular: true,
    enabled: true,
    order: 11,
    shootType: 'ReelXpress Luxe (Starts at ₹20,000)',
    inclusions: [
      'iPhone 16/17 Pro only',
      'Top 1% creators',
      'Cinematic direction',
      'Same-day delivery',
      'Dedicated creative director on-site',
      'High-bitrate 4K HDR ProRes capture',
    ],
    ctaText: 'See Luxe',
  },
];

export const INITIAL_FAQS = (FAQ_DATA || []).map((faq, idx) => ({
  id: 'faq_' + (idx + 1),
  question: faq.question || faq.q || '',
  answer: faq.answer || faq.a || '',
  category: faq.category || 'General',
  enabled: true,
  order: idx + 1,
}));

export const INITIAL_HERO_SLIDES = (REEL_PORTFOLIO || []).map((reel, idx) => ({
  id: String(reel.id !== undefined && reel.id !== null ? reel.id : `hero_${idx + 1}`),
  title: reel.title || `Featured Reel ${idx + 1}`,
  creator: reel.creator || 'reelXpress Creator',
  category: reel.category || 'Celebrations',
  views: reel.views || '150K views',
  poster: reel.poster || '/thumbnails/hero-video-1.jpg',
  videoUrl: reel.videoUrl || reel.videoSrc || '',
  videoSrc: reel.videoSrc || reel.videoUrl || '',
  instagramUrl: reel.instagramUrl || 'https://www.instagram.com/reelxpress___',
  enabled: true,
  order: reel.order || idx + 1,
}));


function getLocal(key, defaultVal) {
  if (typeof window === 'undefined') return defaultVal;
  try {
    let raw = localStorage.getItem(key);
    if (!raw) {
      for (const [canonical, legacy] of Object.entries(LEGACY_STORAGE_KEYS)) {
        if (CMS_STORAGE_KEYS[canonical] === key) {
          raw = localStorage.getItem(legacy);
          break;
        }
      }
    }
    if (!raw) {
      if (defaultVal !== null && defaultVal !== undefined) {
        localStorage.setItem(key, JSON.stringify(defaultVal));
      }
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function setLocal(key, val) {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(val);
    localStorage.setItem(key, serialized);
    for (const [canonical, legacy] of Object.entries(LEGACY_STORAGE_KEYS)) {
      if (CMS_STORAGE_KEYS[canonical] === key) {
        localStorage.setItem(legacy, serialized);
        break;
      }
    }
  } catch {}
}


export function getCachedHeroSlides() {
  const cached = getLocal(CMS_STORAGE_KEYS.hero, null);
  if (Array.isArray(cached) && cached.length > 0) {
    const active = cached.filter((s) => s.enabled !== false);
    if (active.length > 0) return active;
  }
  return INITIAL_HERO_SLIDES;
}

export function getCachedPricingPlans() {
  const cached = getLocal(CMS_STORAGE_KEYS.pricing, null);
  if (Array.isArray(cached) && cached.length > 0) {
    const active = cached.filter((p) => p.enabled !== false);
    if (active.length > 0) return active;
  }
  return INITIAL_PRICING_PLANS;
}

export function getCachedTestimonials() {
  const cached = getLocal(CMS_STORAGE_KEYS.testimonials, null);
  if (Array.isArray(cached) && cached.length > 0) {
    const active = cached.filter((t) => t.enabled !== false);
    if (active.length > 0) return active;
  }
  return INITIAL_TESTIMONIALS;
}

export function getCachedFaqs() {
  const cached = getLocal(CMS_STORAGE_KEYS.faqs, null);
  if (Array.isArray(cached) && cached.length > 0) {
    const active = cached.filter((f) => f.enabled !== false);
    if (active.length > 0) return active;
  }
  return INITIAL_FAQS;
}


const inFlightQueries = new Map();
const memoryCache = new Map();
const MEMORY_CACHE_TTL = 3 * 60 * 1000;
const failureCooldown = new Map();
const COOLDOWN_MS = 15000;

export function invalidateCmsCache(type) {
  if (type) {
    for (const key of memoryCache.keys()) {
      if (key.includes(type)) memoryCache.delete(key);
    }
    for (const key of inFlightQueries.keys()) {
      if (key.includes(type)) inFlightQueries.delete(key);
    }
    for (const key of failureCooldown.keys()) {
      if (key.includes(type)) failureCooldown.delete(key);
    }
  } else {
    memoryCache.clear();
    inFlightQueries.clear();
    failureCooldown.clear();
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('cms-cache-invalidated', { detail: { type } }));
    } catch {}
  }
}

function classifyError(err) {
  if (!err) return { type: 'unknown', isTimeout: false, isOffline: false, message: 'Unknown error' };
  const msg = (err.message || String(err)).toLowerCase();
  const code = (err.code || '').toLowerCase();
  const isTimeout = msg.includes('timeout') || msg.includes('timed out');
  const isOffline =
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    msg.includes('offline') ||
    msg.includes('network') ||
    msg.includes('failed to fetch');
  const isPermission = code === 'permission-denied' || msg.includes('permission');
  return {
    type: isTimeout ? 'timeout' : isOffline ? 'offline' : isPermission ? 'permission' : 'error',
    isTimeout,
    isOffline,
    isPermission,
    message: err.message || String(err),
  };
}

function updateLocalStorageFromCollection(colName, docs) {
  if (typeof window === 'undefined' || !Array.isArray(docs)) return;
  const colToKeyMap = {
    cms_hero: CMS_STORAGE_KEYS.hero,
    cms_pricing: CMS_STORAGE_KEYS.pricing,
    cms_testimonials: CMS_STORAGE_KEYS.testimonials,
    cms_faqs: CMS_STORAGE_KEYS.faqs,
  };
  const key = colToKeyMap[colName];
  if (!key) return;

  let merged = docs;
  if (colName === 'cms_hero') merged = mergeCloudWithDefaults(INITIAL_HERO_SLIDES, docs, { type: 'hero' });
  else if (colName === 'cms_pricing') merged = mergeCloudWithDefaults(INITIAL_PRICING_PLANS, docs, { type: 'pricing' });
  else if (colName === 'cms_testimonials') merged = mergeCloudWithDefaults(INITIAL_TESTIMONIALS, docs, { type: 'testimonials' });
  else if (colName === 'cms_faqs') merged = mergeCloudWithDefaults(INITIAL_FAQS, docs, { type: 'faqs' });

  setLocal(key, merged);
}

async function safeQueryDocs(colName, sortField, sortDir = 'asc', options = {}) {
  const timeoutMs = options.timeoutMs || 3000;
  const queryKey = `${colName}_${sortField || 'none'}_${sortDir}`;

  if (!options.forceRefresh && memoryCache.has(queryKey)) {
    const cached = memoryCache.get(queryKey);
    if (Date.now() - cached.timestamp < MEMORY_CACHE_TTL) {
      return cached.data;
    }
  }

  if (inFlightQueries.has(queryKey)) {
    return inFlightQueries.get(queryKey);
  }

  if (!options.forceRefresh && failureCooldown.has(queryKey)) {
    const failedAt = failureCooldown.get(queryKey);
    if (Date.now() - failedAt < COOLDOWN_MS) {
      return null;
    }
  }

  const queryPromise = (async () => {
    let primaryResolved = false;
    let directFirestorePromise = null;

    if (isFirebaseConfigured && db) {
      try {
        let q;
        try {
          q = sortField
            ? query(collection(db, colName), orderBy(sortField, sortDir))
            : collection(db, colName);
        } catch {
          q = collection(db, colName);
        }

        directFirestorePromise = getDocs(q);

        directFirestorePromise
          .then((snap) => {
            if (snap) {
              const docs = snap.empty ? [] : snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              memoryCache.set(queryKey, { data: docs, timestamp: Date.now() });
              failureCooldown.delete(queryKey);
              updateLocalStorageFromCollection(colName, docs);

              if (!primaryResolved && typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('cms-cache-invalidated', {
                    detail: { type: colName.replace('cms_', ''), source: 'delayed-firestore-success' },
                  })
                );
              }
            }
          })
          .catch((err) => {
            const classified = classifyError(err);
            if (process.env.NODE_ENV !== 'production' && !classified.isTimeout) {
              console.debug(`[safeQueryDocs] Background Firestore notice for ${colName}:`, classified.message);
            }
          });

        const snap = await Promise.race([
          directFirestorePromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Firestore query for ${colName} timed out after ${timeoutMs}ms`)), timeoutMs)
          ),
        ]);

        primaryResolved = true;
        if (snap) {
          const docs = snap.empty ? [] : snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          memoryCache.set(queryKey, { data: docs, timestamp: Date.now() });
          failureCooldown.delete(queryKey);
          updateLocalStorageFromCollection(colName, docs);
          return docs;
        }
      } catch (err) {
        primaryResolved = false;
        const classified = classifyError(err);
        if (process.env.NODE_ENV !== 'production') {
          console.debug(`[safeQueryDocs] ${colName} SDK read notice: ${classified.message}. Attempting non-overlapping fallback.`);
        }
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const typeMap = {
          cms_hero: 'hero',
          cms_pricing: 'pricing',
          cms_testimonials: 'testimonials',
          cms_faqs: 'faqs',
          activity_logs: 'activity',
        };
        const apiType = typeMap[colName];
        if (apiType) {
          const apiTimeoutMs = Math.min(timeoutMs, 2500);
          const res = await Promise.race([
            fetch(`/api/cms?type=${apiType}`),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`API ${apiType} timed out after ${apiTimeoutMs}ms`)), apiTimeoutMs)
            ),
          ]);

          if (res && res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
              memoryCache.set(queryKey, { data: json.data, timestamp: Date.now() });
              failureCooldown.delete(queryKey);
              updateLocalStorageFromCollection(colName, json.data);
              return json.data;
            }
          }
        }
      } catch (fallbackErr) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug(`[safeQueryDocs] API fallback notice for ${colName}:`, fallbackErr?.message || fallbackErr);
        }
      }
    }

    failureCooldown.set(queryKey, Date.now());
    return null;
  })().finally(() => {
    inFlightQueries.delete(queryKey);
  });

  inFlightQueries.set(queryKey, queryPromise);
  return queryPromise;
}

function mergeCloudWithDefaults(defaults, cloudDocs, options = {}) {
  const map = new Map();

  (defaults || []).forEach((item) => {
    if (!item) return;
    const key = String(item.id !== undefined && item.id !== null ? item.id : '').trim();
    if (key) {
      map.set(key, { ...item, id: key });
    }
  });

  if (Array.isArray(cloudDocs)) {
    cloudDocs.forEach((cloudItem) => {
      if (!cloudItem || cloudItem.id === undefined || cloudItem.id === null) return;

      const rawId = String(cloudItem.id).trim();
      const targetId = rawId === 'plan_business_brand' ? 'business-brand' : rawId;

      if (cloudItem._deleted === true) {
        map.delete(targetId);
        map.delete(rawId);
        return;
      }

      const existing = map.get(targetId) || map.get(rawId) || {};

      const text =
        cloudItem.review ||
        cloudItem.quote ||
        existing.review ||
        existing.quote ||
        '';

      const question =
        cloudItem.question ||
        cloudItem.q ||
        existing.question ||
        existing.q ||
        '';
      const answer =
        cloudItem.answer ||
        cloudItem.a ||
        existing.answer ||
        existing.a ||
        '';

      const merged = {
        ...existing,
        ...cloudItem,
        id: targetId,
      };

      if (options.type === 'testimonials') {
        merged.quote = text;
        merged.review = text;
      } else if (options.type === 'faqs') {
        merged.question = question;
        merged.answer = answer;
        merged.q = question;
        merged.a = answer;
      } else if (options.type === 'hero') {
        merged.poster =
          merged.poster ||
          merged.posterUrl ||
          merged.imageUrl ||
          merged.image ||
          merged.thumbnail ||
          '/thumbnails/hero-video-1.jpg';
        merged.videoUrl =
          merged.videoUrl ||
          merged.videoSrc ||
          existing.videoUrl ||
          existing.videoSrc ||
          '';
        merged.videoSrc = merged.videoUrl;
      }

      map.set(targetId, merged);
    });
  }

  const result = Array.from(map.values());
  result.sort((a, b) => {
    const orderDiff = (Number(a.order) || 0) - (Number(b.order) || 0);
    if (orderDiff !== 0) return orderDiff;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
  return result;
}

export async function logAdminActivity(action, details, adminEmail = 'admin@reelxpress.com') {
  const entry = {
    id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    action,
    details,
    adminEmail,
    timestamp: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, 'activity_logs'), entry);
    } catch {}
  }

  const logs = getLocal(CMS_STORAGE_KEYS.activity, []);
  setLocal(CMS_STORAGE_KEYS.activity, [entry, ...logs].slice(0, 50));
  return entry;
}

export async function getActivityLogs() {
  const cloud = await safeQueryDocs('activity_logs', 'timestamp', 'desc');
  if (cloud && cloud.length > 0) {
    cloud.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    return cloud;
  }
  return getLocal(CMS_STORAGE_KEYS.activity, [
    {
      id: 'act_init',
      action: 'System Initialized',
      details: 'reelXpress Admin Panel & Firebase Suite connected successfully.',
      adminEmail: 'admin@reelxpress.com',
      timestamp: new Date().toISOString(),
    },
  ]);
}


export async function getTestimonials(options = {}) {
  const memoryKey = 'cms_testimonials_order_asc';
  if (!options.forceRefresh && memoryCache.has(memoryKey)) {
    const mem = memoryCache.get(memoryKey);
    if (Date.now() - mem.timestamp < MEMORY_CACHE_TTL) {
      return mergeCloudWithDefaults(INITIAL_TESTIMONIALS, mem.data, { type: 'testimonials' });
    }
  }

  const cached = !options.forceRefresh ? getCachedTestimonials() : null;
  try {
    const cloud = await safeQueryDocs('cms_testimonials', 'order', 'asc', options);
    if (cloud) {
      const merged = mergeCloudWithDefaults(INITIAL_TESTIMONIALS, cloud, {
        type: 'testimonials',
      });
      setLocal(CMS_STORAGE_KEYS.testimonials, merged);
      return merged;
    }
  } catch {}
  return cached && cached.length > 0 ? cached : INITIAL_TESTIMONIALS;
}

export function subscribeToTestimonials(callback) {
  if (typeof window === 'undefined' || !isFirebaseConfigured || !db) {
    return () => {};
  }
  try {
    const q = query(collection(db, 'cms_testimonials'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data._deleted) {
              items.push({ id: docSnap.id, ...data });
            }
          });
          items.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
          if (items.length > 0) {
            setLocal(CMS_STORAGE_KEYS.testimonials, items);
            callback(items);
          }
        }
      },
      (error) => {
        console.warn('[subscribeToTestimonials] Real-time listener notice:', error?.message || error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[subscribeToTestimonials] Setup notice:', err?.message || err);
    return () => {};
  }
}

export async function saveTestimonial(testimonial, adminEmail) {
  const isNew = !testimonial.id || testimonial.id.startsWith('new_');
  const tId = isNew ? 'testi_' + Date.now() : testimonial.id;
  const reviewText = (testimonial.review || testimonial.quote || '').trim();

  const payload = {
    ...testimonial,
    id: tId,
    review: reviewText,
    quote: reviewText,
    rating: Number(testimonial.rating) || 5,
    avatar: testimonial.avatar || '/brand/icon-gold.png',
    enabled: testimonial.enabled !== false,
    order: Number(testimonial.order) || 1,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail || 'admin@reelxpress.com',
  };

  let writeSuccess = false;
  let lastError = null;

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'cms_testimonials', tId), payload, { merge: true });
      writeSuccess = true;
    } catch (err) {
      console.warn('[saveTestimonial] Direct Firestore write notice:', err?.message || err);
      lastError = err;
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'testimonials', item: payload, adminEmail }),
      });
      if (res.ok) {
        writeSuccess = true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (!writeSuccess) {
          lastError = new Error(errJson.error || `Server write failed with status ${res.status}`);
        }
      }
    } catch (apiErr) {
      console.warn('[saveTestimonial] Server API sync notice:', apiErr?.message || apiErr);
      if (!writeSuccess) lastError = apiErr;
    }
  }

  if (!writeSuccess) {
    throw new Error(
      lastError?.message || 'Failed to save testimonial to Firestore. Please check Firebase permissions.'
    );
  }

  const currentList = getCachedTestimonials();
  const updated = isNew
    ? [...currentList, payload]
    : currentList.map((item) => (item.id === tId ? payload : item));
  setLocal(CMS_STORAGE_KEYS.testimonials, updated);

  invalidateCmsCache('testimonials');

  await logAdminActivity(
    isNew ? 'Added Testimonial' : 'Updated Testimonial',
    `Author: "${payload.name}" (${payload.role})`,
    adminEmail
  );

  return payload;
}

export async function deleteTestimonial(testimonialId, adminEmail) {
  let deleteSuccess = false;
  let lastError = null;

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'cms_testimonials', testimonialId));
      deleteSuccess = true;
    } catch (err) {
      try {
        await setDoc(
          doc(db, 'cms_testimonials', testimonialId),
          { id: testimonialId, _deleted: true, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        deleteSuccess = true;
      } catch (markErr) {
        lastError = markErr;
      }
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(
        `/api/cms?type=testimonials&id=${encodeURIComponent(testimonialId)}&adminEmail=${encodeURIComponent(adminEmail || '')}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        deleteSuccess = true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (!deleteSuccess) lastError = new Error(errJson.error || 'Server delete failed');
      }
    } catch (apiErr) {
      if (!deleteSuccess) lastError = apiErr;
    }
  }

  if (!deleteSuccess) {
    throw new Error(
      lastError?.message || 'Failed to delete testimonial from Firestore. Please check Firebase permissions.'
    );
  }

  const currentList = getCachedTestimonials();
  const updated = currentList.filter((t) => t.id !== testimonialId);
  setLocal(CMS_STORAGE_KEYS.testimonials, updated);

  invalidateCmsCache('testimonials');

  await logAdminActivity('Deleted Testimonial', `Testimonial ID: ${testimonialId}`, adminEmail);
  return { success: true, id: testimonialId };
}


export async function getPricingPlans(options = {}) {
  const memoryKey = 'cms_pricing_order_asc';
  if (!options.forceRefresh && memoryCache.has(memoryKey)) {
    const mem = memoryCache.get(memoryKey);
    if (Date.now() - mem.timestamp < MEMORY_CACHE_TTL) {
      return mergeCloudWithDefaults(INITIAL_PRICING_PLANS, mem.data, { type: 'pricing' });
    }
  }

  const cached = !options.forceRefresh ? getCachedPricingPlans() : null;
  try {
    const cloud = await safeQueryDocs('cms_pricing', 'order', 'asc', options);
    if (cloud) {
      const merged = mergeCloudWithDefaults(INITIAL_PRICING_PLANS, cloud, {
        type: 'pricing',
      });
      setLocal(CMS_STORAGE_KEYS.pricing, merged);
      return merged;
    }
  } catch {}
  return cached && cached.length > 0 ? cached : INITIAL_PRICING_PLANS;
}

export function subscribeToPricingPlans(callback) {
  if (typeof window === 'undefined' || !isFirebaseConfigured || !db) {
    return () => {};
  }
  try {
    const q = query(collection(db, 'cms_pricing'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data._deleted) {
              items.push({ id: docSnap.id, ...data });
            }
          });
          items.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
          if (items.length > 0) {
            setLocal(CMS_STORAGE_KEYS.pricing, items);
            callback(items);
          }
        }
      },
      (error) => {
        console.warn('[subscribeToPricingPlans] Real-time listener notice:', error?.message || error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[subscribeToPricingPlans] Setup notice:', err?.message || err);
    return () => {};
  }
}

export async function savePricingPlan(plan, adminEmail) {
  const isNew = !plan.id || plan.id.startsWith('new_');
  const planId = isNew ? 'plan_' + Date.now() : plan.id;
  const payload = {
    ...plan,
    id: planId,
    enabled: plan.enabled !== false,
    order: Number(plan.order) || 1,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail || 'admin@reelxpress.com',
  };

  let writeSuccess = false;
  let lastError = null;

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'cms_pricing', planId), payload, { merge: true });
      writeSuccess = true;
    } catch (err) {
      console.warn('[savePricingPlan] Direct Firestore write notice:', err?.message || err);
      lastError = err;
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pricing', item: payload, adminEmail }),
      });
      if (res.ok) {
        writeSuccess = true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (!writeSuccess) {
          lastError = new Error(errJson.error || `Server write failed with status ${res.status}`);
        }
      }
    } catch (apiErr) {
      console.warn('[savePricingPlan] Server API sync notice:', apiErr?.message || apiErr);
      if (!writeSuccess) lastError = apiErr;
    }
  }

  if (!writeSuccess) {
    throw new Error(
      lastError?.message || 'Failed to save pricing plan to Firestore. Please check Firebase permissions.'
    );
  }

  const currentList = getCachedPricingPlans();
  const updated = isNew
    ? [...currentList, payload]
    : currentList.map((p) => (p.id === planId ? payload : p));
  setLocal(CMS_STORAGE_KEYS.pricing, updated);

  invalidateCmsCache('pricing');

  await logAdminActivity(
    isNew ? 'Added Pricing Plan' : 'Updated Pricing Plan',
    `Plan: "${payload.name}" (${payload.price})`,
    adminEmail
  );
  return payload;
}

export async function deletePricingPlan(planId, adminEmail) {
  let deleteSuccess = false;
  let lastError = null;

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'cms_pricing', planId));
      deleteSuccess = true;
    } catch (err) {
      try {
        await setDoc(
          doc(db, 'cms_pricing', planId),
          { id: planId, _deleted: true, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        deleteSuccess = true;
      } catch (markErr) {
        lastError = markErr;
      }
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(
        `/api/cms?type=pricing&id=${encodeURIComponent(planId)}&adminEmail=${encodeURIComponent(adminEmail || '')}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        deleteSuccess = true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (!deleteSuccess) lastError = new Error(errJson.error || 'Server delete failed');
      }
    } catch (apiErr) {
      if (!deleteSuccess) lastError = apiErr;
    }
  }

  if (!deleteSuccess) {
    throw new Error(
      lastError?.message || 'Failed to delete pricing plan from Firestore. Please check Firebase permissions.'
    );
  }

  const currentList = getCachedPricingPlans();
  const updated = currentList.filter((p) => p.id !== planId);
  setLocal(CMS_STORAGE_KEYS.pricing, updated);

  invalidateCmsCache('pricing');

  await logAdminActivity('Deleted Pricing Plan', `Plan ID: ${planId}`, adminEmail);
  return { success: true, id: planId };
}


export async function getFaqs(options = {}) {
  const memoryKey = 'cms_faqs_order_asc';
  if (!options.forceRefresh && memoryCache.has(memoryKey)) {
    const mem = memoryCache.get(memoryKey);
    if (Date.now() - mem.timestamp < MEMORY_CACHE_TTL) {
      return mergeCloudWithDefaults(INITIAL_FAQS, mem.data, { type: 'faqs' });
    }
  }

  const cached = !options.forceRefresh ? getCachedFaqs() : null;
  try {
    const cloud = await safeQueryDocs('cms_faqs', 'order', 'asc', options);
    if (cloud) {
      const merged = mergeCloudWithDefaults(INITIAL_FAQS, cloud, {
        type: 'faqs',
      });
      setLocal(CMS_STORAGE_KEYS.faqs, merged);
      return merged;
    }
  } catch {}
  return cached && cached.length > 0 ? cached : INITIAL_FAQS;
}

export function subscribeToFaqs(callback) {
  if (typeof window === 'undefined' || !isFirebaseConfigured || !db) {
    return () => {};
  }
  try {
    const q = query(collection(db, 'cms_faqs'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data._deleted) {
              items.push({ id: docSnap.id, ...data });
            }
          });
          items.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
          const merged = mergeCloudWithDefaults(INITIAL_FAQS, items, { type: 'faqs' });
          if (merged.length > 0) {
            setLocal(CMS_STORAGE_KEYS.faqs, merged);
            callback(merged);
          }
        }
      },
      (error) => {
        console.warn('[subscribeToFaqs] Real-time listener notice:', error?.message || error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[subscribeToFaqs] Setup notice:', err?.message || err);
    return () => {};
  }
}

export async function saveFaq(faq, adminEmail) {
  const isNew = !faq.id || faq.id.startsWith('new_');
  const faqId = isNew ? 'faq_' + Date.now() : faq.id;
  const question = (faq.question || faq.q || '').trim();
  const answer = (faq.answer || faq.a || '').trim();

  const payload = {
    ...faq,
    id: faqId,
    question,
    answer,
    q: question,
    a: answer,
    category: faq.category || 'General',
    enabled: faq.enabled !== false,
    order: Number(faq.order) || 1,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail || 'admin@reelxpress.com',
  };

  let writeSuccess = false;
  let lastError = null;

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'cms_faqs', faqId), payload, { merge: true });
      writeSuccess = true;
    } catch (err) {
      console.warn('[saveFaq] Direct Firestore write notice:', err?.message || err);
      lastError = err;
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'faqs', item: payload, adminEmail }),
      });
      if (res.ok) {
        writeSuccess = true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (!writeSuccess) {
          lastError = new Error(errJson.error || `Server write failed with status ${res.status}`);
        }
      }
    } catch (apiErr) {
      console.warn('[saveFaq] Server API sync notice:', apiErr?.message || apiErr);
      if (!writeSuccess) lastError = apiErr;
    }
  }

  if (!writeSuccess) {
    throw new Error(
      lastError?.message || 'Failed to save FAQ to Firestore. Please check Firebase permissions.'
    );
  }

  const currentList = getCachedFaqs();
  const updated = isNew
    ? [...currentList, payload]
    : currentList.map((item) => (item.id === faqId ? payload : item));
  setLocal(CMS_STORAGE_KEYS.faqs, updated);

  invalidateCmsCache('faqs');

  await logAdminActivity(
    isNew ? 'Added FAQ' : 'Updated FAQ',
    `Question: "${payload.question.substring(0, 40)}..."`,
    adminEmail
  );
  return payload;
}

export async function deleteFaq(faqId, adminEmail) {
  let deleteSuccess = false;
  let lastError = null;

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'cms_faqs', faqId));
      deleteSuccess = true;
    } catch (err) {
      try {
        await setDoc(
          doc(db, 'cms_faqs', faqId),
          { id: faqId, _deleted: true, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        deleteSuccess = true;
      } catch (markErr) {
        lastError = markErr;
      }
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(
        `/api/cms?type=faqs&id=${encodeURIComponent(faqId)}&adminEmail=${encodeURIComponent(adminEmail || '')}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        deleteSuccess = true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (!deleteSuccess) lastError = new Error(errJson.error || 'Server delete failed');
      }
    } catch (apiErr) {
      if (!deleteSuccess) lastError = apiErr;
    }
  }

  if (!deleteSuccess) {
    throw new Error(
      lastError?.message || 'Failed to delete FAQ from Firestore. Please check Firebase permissions.'
    );
  }

  const currentList = getCachedFaqs();
  const updated = currentList.filter((f) => f.id !== faqId);
  setLocal(CMS_STORAGE_KEYS.faqs, updated);

  invalidateCmsCache('faqs');

  await logAdminActivity('Deleted FAQ', `FAQ ID: ${faqId}`, adminEmail);
  return { success: true, id: faqId };
}


export async function getHeroSlides(options = {}) {
  const memoryKey = 'cms_hero_order_asc';
  if (!options.forceRefresh && memoryCache.has(memoryKey)) {
    const mem = memoryCache.get(memoryKey);
    if (Date.now() - mem.timestamp < MEMORY_CACHE_TTL) {
      return mergeCloudWithDefaults(INITIAL_HERO_SLIDES, mem.data, { type: 'hero' });
    }
  }

  const cached = !options.forceRefresh ? getCachedHeroSlides() : null;
  try {
    const cloud = await safeQueryDocs('cms_hero', 'order', 'asc', options);
    if (cloud) {
      const merged = mergeCloudWithDefaults(INITIAL_HERO_SLIDES, cloud, {
        type: 'hero',
      });
      setLocal(CMS_STORAGE_KEYS.hero, merged);
      return merged;
    }
  } catch {}
  return cached && cached.length > 0 ? cached : INITIAL_HERO_SLIDES;
}

export function subscribeToHeroSlides(callback) {
  if (typeof window === 'undefined' || !isFirebaseConfigured || !db) {
    return () => {};
  }
  try {
    const q = query(collection(db, 'cms_hero'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data._deleted) {
              items.push({ id: docSnap.id, ...data });
            }
          });
          items.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
          if (items.length > 0) {
            setLocal(CMS_STORAGE_KEYS.hero, items);
            callback(items);
          }
        }
      },
      (error) => {
        console.warn('[subscribeToHeroSlides] Real-time listener notice:', error?.message || error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[subscribeToHeroSlides] Setup notice:', err?.message || err);
    return () => {};
  }
}

export async function saveHeroSlide(slide, adminEmail) {
  const isNew = !slide.id || slide.id.startsWith('new_');
  const slideId = isNew ? 'slide_' + Date.now() : slide.id;
  const hasVideo = Boolean(slide.videoUrl || slide.videoSrc);
  const payload = {
    ...slide,
    id: slideId,
    videoUrl: slide.videoUrl || slide.videoSrc || '',
    videoSrc: slide.videoUrl || slide.videoSrc || '',
    storagePath: slide.storagePath || '',
    mediaType: hasVideo ? 'video' : (slide.mediaType || 'image'),
    originalFileName: slide.originalFileName || '',
    uploadedAt: slide.uploadedAt || new Date().toISOString(),
    enabled: slide.enabled !== false,
    order: Number(slide.order) || 1,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail || 'admin@reelxpress.com',
  };

  let writeSuccess = false;
  let lastError = null;

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'cms_hero', slideId), payload, { merge: true });
      writeSuccess = true;
    } catch (err) {
      console.warn('[saveHeroSlide] Direct Firestore write notice:', err?.message || err);
      lastError = err;
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'hero', item: payload, adminEmail }),
      });
      if (res.ok) {
        writeSuccess = true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (!writeSuccess) {
          lastError = new Error(errJson.error || `Server write failed with status ${res.status}`);
        }
      }
    } catch (apiErr) {
      console.warn('[saveHeroSlide] Server API sync notice:', apiErr?.message || apiErr);
      if (!writeSuccess) lastError = apiErr;
    }
  }

  if (!writeSuccess) {
    throw new Error(
      lastError?.message || 'Failed to save hero slide to Firestore. Please check Firebase permissions.'
    );
  }

  const currentList = getCachedHeroSlides();
  const updated = isNew
    ? [...currentList, payload]
    : currentList.map((s) => (s.id === slideId ? payload : s));
  setLocal(CMS_STORAGE_KEYS.hero, updated);

  invalidateCmsCache('hero');

  await logAdminActivity(
    isNew ? 'Added Hero Slide' : 'Updated Hero Slide',
    `Slide: "${payload.title}" (${payload.category})`,
    adminEmail
  );
  return payload;
}

export async function deleteHeroSlide(slideId, adminEmail) {
  let deleteSuccess = false;
  let lastError = null;

  const currentList = getCachedHeroSlides();
  const existingSlide = currentList.find((s) => s.id === slideId);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'cms_hero', slideId));
      deleteSuccess = true;
    } catch (err) {
      try {
        await setDoc(
          doc(db, 'cms_hero', slideId),
          { id: slideId, _deleted: true, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        deleteSuccess = true;
      } catch (markErr) {
        lastError = markErr;
      }
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(
        `/api/cms?type=hero&id=${encodeURIComponent(slideId)}&adminEmail=${encodeURIComponent(adminEmail || '')}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        deleteSuccess = true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (!deleteSuccess) lastError = new Error(errJson.error || 'Server delete failed');
      }
    } catch (apiErr) {
      if (!deleteSuccess) lastError = apiErr;
    }
  }

  if (!deleteSuccess) {
    throw new Error(
      lastError?.message || 'Failed to delete hero slide from Firestore. Please check Firebase permissions.'
    );
  }

  if (existingSlide && (existingSlide.storagePath || (existingSlide.videoUrl && existingSlide.videoUrl.includes('firebasestorage')))) {
    deleteStorageFile(existingSlide.storagePath || existingSlide.videoUrl).catch(() => {});
  }

  const updated = currentList.filter((s) => s.id !== slideId);
  setLocal(CMS_STORAGE_KEYS.hero, updated);

  invalidateCmsCache('hero');

  await logAdminActivity('Deleted Hero Slide', `Slide ID: ${slideId}`, adminEmail);
  return { success: true, id: slideId };
}


async function compressImageFile(file, maxWidth = 1080, maxHeight = 1920, quality = 0.85) {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    !file ||
    !file.type ||
    !file.type.startsWith('image/')
  ) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && (blob.size < file.size || file.size > 800000)) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      img.src = objectUrl;
    } catch {
      resolve(file);
    }
  });
}

export async function uploadImageFile(file, folder = 'uploads') {
  if (!file) throw new Error('No file provided for upload.');

  const targetFile = await compressImageFile(file);

  if (isFirebaseConfigured && storage) {
    try {
      const sanitizedName = (targetFile.name || file.name || 'image.jpg').replace(/[^a-zA-Z0-9.]/g, '_');
      const storageRef = ref(storage, `${folder}/${Date.now()}_${sanitizedName}`);
      const snapshot = await Promise.race([
        uploadBytes(storageRef, targetFile),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firebase Storage Upload timed out after 5000ms')), 5000)
        ),
      ]);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (err) {
      console.warn('[uploadImageFile] Firebase Storage upload notice, falling back:', err?.message || err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const formData = new FormData();
      formData.append('file', targetFile);
      formData.append('folder', 'images');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) return data.url;
      }
    } catch (apiErr) {
      console.warn('[uploadImageFile] Server upload fallback notice:', apiErr?.message || apiErr);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(targetFile);
  });
}

export async function deleteStorageFile(storagePathOrUrl) {
  if (!storagePathOrUrl || !isFirebaseConfigured || !storage) return false;
  try {
    let fileRef = null;
    if (storagePathOrUrl.startsWith('http://') || storagePathOrUrl.startsWith('https://')) {
      fileRef = ref(storage, storagePathOrUrl);
    } else {
      fileRef = ref(storage, storagePathOrUrl);
    }
    await deleteObject(fileRef);
    return true;
  } catch (err) {
    console.warn('[deleteStorageFile] Storage file deletion notice (benign):', err?.message || err);
    return false;
  }
}

export async function uploadHeroVideo(file, onProgress) {
  if (!file) throw new Error('No video file selected.');

  const validFormats = ['video/mp4', 'video/webm', 'video/quicktime'];
  const ext = (file.name || '').split('.').pop()?.toLowerCase();
  const validExtensions = ['mp4', 'webm', 'mov'];
  const isValidFormat = validFormats.includes(file.type) || validExtensions.includes(ext);
  if (!isValidFormat) {
    throw new Error('Unsupported video format. Please upload an MP4 or WebM video.');
  }

  const MAX_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error(`Video file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 100MB.`);
  }

  const timestamp = Date.now();
  const safeName = (file.name || 'video.mp4')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_');
  const storagePath = `hero-videos/${timestamp}_${safeName}`;

  if (isFirebaseConfigured && storage) {
    return new Promise((resolve, reject) => {
      try {
        const storageRef = ref(storage, storagePath);
        const metadata = {
          contentType: file.type || 'video/mp4',
          customMetadata: {
            originalName: file.name || '',
            uploadedAt: new Date().toISOString(),
          },
        };

        const uploadTask = uploadBytesResumable(storageRef, file, metadata);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (snapshot.totalBytes > 0) {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              if (typeof onProgress === 'function') {
                onProgress(progress);
              }
            }
          },
          (error) => {
            console.error('[uploadHeroVideo] Firebase Storage upload error:', error);
            uploadViaServerApi(file, onProgress, storagePath)
              .then(resolve)
              .catch(() => reject(new Error(`Firebase Storage upload failed: ${error.message || 'Permission denied'}`)));
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              if (typeof onProgress === 'function') onProgress(100);
              resolve({
                downloadUrl,
                videoUrl: downloadUrl,
                videoSrc: downloadUrl,
                storagePath,
                originalFileName: file.name,
                fileSize: file.size,
                mediaType: 'video',
                uploadedAt: new Date().toISOString(),
              });
            } catch (urlErr) {
              reject(new Error(`Failed to retrieve video download URL: ${urlErr.message}`));
            }
          }
        );
      } catch (err) {
        uploadViaServerApi(file, onProgress, storagePath)
          .then(resolve)
          .catch(reject);
      }
    });
  }

  return uploadViaServerApi(file, onProgress, storagePath);
}

async function uploadViaServerApi(file, onProgress, storagePath) {
  if (typeof onProgress === 'function') onProgress(10);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'hero-videos');

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Upload failed with status ${res.status}`);
  }

  const result = await res.json();
  if (typeof onProgress === 'function') onProgress(100);

  return {
    downloadUrl: result.downloadUrl || result.url,
    videoUrl: result.downloadUrl || result.url,
    videoSrc: result.downloadUrl || result.url,
    storagePath: result.storagePath || storagePath,
    originalFileName: file.name,
    fileSize: file.size,
    mediaType: 'video',
    uploadedAt: new Date().toISOString(),
  };
}

export async function uploadVideoFile(file, folder = 'hero-videos') {
  const result = await uploadHeroVideo(file);
  return result.downloadUrl || result.videoUrl;
}
