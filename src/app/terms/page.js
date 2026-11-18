import TermsConditionsView from '@/components/terms/TermsConditionsView';

export const metadata = {
  title: 'Terms & Conditions | ReelXpress',
  description:
    'Terms and Conditions governing access to and use of reelXpress platform, booking services, and intellectual property by ReelXpress.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Terms & Conditions | ReelXpress',
    description:
      'Legally binding terms agreement between ReelXpress and the user.',
    url: '/terms',
  },
};

export default function TermsPage() {
  return <TermsConditionsView />;
}
