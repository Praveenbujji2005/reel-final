export const WHATSAPP_CONFIG = {
  number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918431912122',
  displayNumber: '+91 84319 12122',
  companyName: 'ReelXpress',
  subtitle: 'Instant Content Creation',
  defaultMessage: "Hello ReelXpress! I'd like to know more about your services.",
};

export function getWhatsAppUrl(message) {
  const sanitizedNumber = (WHATSAPP_CONFIG.number || '918431912122').replace(/\D/g, '');
  const rawMessage = message && message.trim().length > 0
    ? message.trim()
    : WHATSAPP_CONFIG.defaultMessage;

  return `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(rawMessage)}`;
}

export function openWhatsApp(message) {
  if (typeof window === 'undefined') return;
  const url = getWhatsAppUrl(message);

  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 200);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
