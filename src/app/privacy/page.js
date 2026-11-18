import PrivacyPolicyView from '@/components/privacy/PrivacyPolicyView';

export const metadata = {
  title: 'Privacy Policy | ReelXpress',
  description:
    'Official Privacy Policy of ReelXpress. Learn how we collect, process, and protect your data under Indian data protection laws.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | ReelXpress',
    description:
      'Security & Privacy Policy of ReelXpress.',
    url: '/privacy',
  },
};

export default function PrivacyPage() {
  return <PrivacyPolicyView />;
}
