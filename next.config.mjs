const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  poweredByHeader: false,
  allowedDevOrigins: ['192.168.31.151', '192.168.*', 'localhost:3000', 'localhost:3001'],
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  async headers() {
    const isPreview = process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production';

    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com data:;
      img-src 'self' data: blob: https: res.cloudinary.com https://firebasestorage.googleapis.com;
      media-src 'self' blob: data: https://firebasestorage.googleapis.com https://res.cloudinary.com;
      connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.firebaseapp.com https://firebasestorage.googleapis.com https://api.liner.com https://api.cloudinary.com;
      frame-src 'self' https://accounts.google.com https://www.google.com;
      frame-ancestors 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self' https://accounts.google.com;
    `
      .replace(/\s{2,}/g, ' ')
      .trim();

    return [
      {
        source: '/(brand|thumbnails|assets|fonts)/:all*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          ...(isPreview
            ? [
                {
                  key: 'X-Robots-Tag',
                  value: 'noindex, nofollow',
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
