
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.reelxpress.com';

export const SITE_CONFIG = {
  name: 'reelXpress',
  legalName: 'ReelXpress',
  tagline: 'Quick Reel Service in Bengaluru',
  description:
    'We Shoot • Edit • Deliver Reels in Minutes. You live the moment. reelXpress captures it — instantly. Shot on latest iPhone gear with on-spot live editing and fast cloud delivery.',
  canonicalUrl: SITE_URL,
  
  contact: {
    directLine: '+91 9988338180',
    directLineTel: '+919988338180',
    whatsappNumber: '+91 84319 12122',
    whatsappClean: '918431912122',
    email: 'connect@reelxpress.com',
    primaryCity: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    supportedCities: ['Bengaluru', 'Hyderabad', 'Chennai', 'Vizag', 'Vijayawada'],
  },

  social: {
    instagram: 'https://www.instagram.com/reelxpress___',
    instagramHandle: '@reelxpress___',
  },

  gst: {
    rate: '',
    noticeText: '',
    shortNotice: '',
  },

  SHOW_CLIENT_BRANDS: false,
};

export default SITE_CONFIG;
