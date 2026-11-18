import CookiePolicyView from '@/components/cookies/CookiePolicyView';

export const metadata = {
  title: 'Cookie Policy | ReelXpress',
  description:
    'Cookie Policy of ReelXpress for reelXpress. Learn how cookies and tracking technologies are used on our platform.',
  alternates: {
    canonical: '/cookies',
  },
  openGraph: {
    title: 'Cookie Policy | ReelXpress',
    description:
      'Cookie Policy explaining how ReelXpress uses cookies on the reelXpress platform.',
    url: '/cookies',
  },
};

export default function CookiePage() {
  return <CookiePolicyView />;
}
