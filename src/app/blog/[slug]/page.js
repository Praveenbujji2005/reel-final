import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BLOG_POSTS, getBlogPostBySlug, getAllBlogSlugs } from '@/data/blogPosts';
import { SITE_CONFIG, SITE_URL } from '@/config/site';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import ShareButton from '@/components/blog/ShareButton';

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found | reelXpress',
      description: 'The requested article could not be found.',
    };
  }

  return {
    title: `${post.title} | reelXpress`,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | reelXpress`,
      description: post.description,
      url: `/blog/${post.slug}`,
      siteName: SITE_CONFIG.name,
      locale: 'en_IN',
      type: 'article',
      publishedTime: post.publishedDate,
      authors: [SITE_CONFIG.name],
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | reelXpress`,
      description: post.description,
      images: ['/og-image.png'],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Article Structured Data (JSON-LD)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedDate,
    dateModified: post.publishedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    image: [`${SITE_URL}/og-image.png`],
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/brand/icon-gold.png`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <Navbar />

      <main className="relative z-10 pt-28 sm:pt-36 pb-20 px-4 sm:px-6 md:px-margin max-w-4xl mx-auto min-h-screen">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8">
          <ol className="flex items-center gap-2 text-xs sm:text-sm text-text-muted flex-wrap">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/blog" className="hover:text-white transition-colors">
                Blog
              </Link>
            </li>
            <li>/</li>
            <li className="text-white/80 font-medium truncate max-w-[240px] sm:max-w-md" aria-current="page">
              {post.title}
            </li>
          </ol>
        </nav>

        {/* Article Header */}
        <header className="mb-10 sm:mb-12 border-b border-white/10 pb-8 sm:pb-10">
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,122,51,0.15)]">
                {post.tag}
              </span>
              <time dateTime={post.publishedDate} className="text-xs sm:text-sm text-text-muted font-medium">
                {post.displayDate || '21 July 2026'}
              </time>
            </div>
            <ShareButton title={post.title} slug={post.slug} />
          </div>

          {/* Single H1 on page */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.2] mb-6">
            {post.title}
          </h1>

          {/* Intro paragraph from verified editorial text */}
          {post.intro && (
            <p className="text-base sm:text-xl text-white/90 leading-relaxed font-normal">
              {post.intro}
            </p>
          )}
        </header>

        {/* Key Takeaways Section */}
        {post.takeaways && post.takeaways.length > 0 && (
          <section className="p-6 sm:p-8 rounded-2xl bg-[#1E1B1F] border border-white/10 mb-12 shadow-lg">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Icon name="bolt" size={20} className="text-primary" />
              <span>Key Takeaways</span>
            </h2>
            <ul className="space-y-3 text-sm sm:text-base text-text-muted leading-relaxed">
              {post.takeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Icon name="check_circle" size={18} className="text-primary shrink-0 mt-1" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Full Editorial Body Content */}
        {post.sections && post.sections.length > 0 && (
          <div className="space-y-12 mb-16">
            {post.sections.map((section, sIdx) => (
              <section key={sIdx} className="scroll-mt-24">
                {section.heading && (
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-5 leading-tight">
                    {section.heading}
                  </h2>
                )}

                {section.paragraphs && section.paragraphs.map((para, pIdx) => (
                  <p
                    key={pIdx}
                    className="text-base sm:text-lg text-text-muted leading-relaxed font-normal mb-5 last:mb-0"
                  >
                    {para}
                  </p>
                ))}

                {/* Pricing Tiers Grid for Package Breakdowns */}
                {section.pricingTiers && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-8">
                    {section.pricingTiers.map((tier, tIdx) => (
                      <div
                        key={tIdx}
                        className="rounded-2xl bg-[#151217] border border-white/10 hover:border-primary/50 p-6 flex flex-col justify-between transition-colors shadow-lg"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/30 shadow-[0_0_12px_rgba(255,122,51,0.2)]">
                              {tier.events}
                            </span>
                            <span className="text-2xl font-black text-white">
                              {tier.price}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                          <p className="text-sm text-text-muted leading-relaxed mb-4">
                            {tier.description}
                          </p>
                        </div>
                        {tier.highlights && (
                          <ul className="space-y-1.5 pt-4 border-t border-white/5 text-xs text-white/80">
                            {tier.highlights.map((h, hIdx) => (
                              <li key={hIdx} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Bullet Points with Label & Text */}
                {section.bullets && (
                  <ul className="space-y-3.5 my-6 p-6 rounded-2xl bg-[#151217] border border-white/10">
                    {section.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-3 text-base text-text-muted leading-relaxed">
                        <Icon name="check_circle" size={18} className="text-primary shrink-0 mt-1" />
                        <div>
                          <strong className="text-white font-semibold mr-1.5">{b.label}</strong>
                          <span>{b.text}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* 10 Numbered Trends Display */}
                {section.numberedTrends && (
                  <div className="space-y-5 my-8">
                    {section.numberedTrends.map((trend, trIdx) => (
                      <div
                        key={trIdx}
                        className="p-6 sm:p-7 rounded-2xl bg-[#151217] border border-white/10 hover:border-primary/40 transition-all shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <span className="px-3.5 py-1.5 rounded-xl bg-gradient-to-br from-primary/25 to-transparent border border-primary/40 text-primary text-sm font-black shrink-0 shadow-[0_0_15px_rgba(255,122,51,0.2)]">
                            {trend.number}
                          </span>
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-snug">
                              {trend.title}
                            </h3>
                            <p className="text-sm sm:text-base text-text-muted leading-relaxed font-normal">
                              {trend.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {section.extraParagraphs && section.extraParagraphs.map((para, epIdx) => (
                  <p
                    key={epIdx}
                    className="text-base sm:text-lg text-text-muted leading-relaxed font-normal my-5"
                  >
                    {para}
                  </p>
                ))}

                {/* Section Footer Callout with Quick Navigation Links */}
                {section.footerCta && (
                  <div className="p-6 sm:p-7 rounded-2xl bg-[#1E1B1F] border border-border-amber/50 my-8 shadow-[0_10px_30px_rgba(255,94,30,0.15)]">
                    <p className="text-sm sm:text-base text-white/90 leading-relaxed mb-4">
                      {section.footerCta.text}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {section.footerCta.links.map((link, lIdx) => (
                        <Link
                          key={lIdx}
                          href={link.href}
                          className="btn-glass-creator inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white hover:text-white transition-all group"
                        >
                          <span className="text-primary font-bold">{link.label}</span>
                          <Icon name="arrow_forward" size={14} className="text-primary group-hover:translate-x-1 transition-transform" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {/* Primary CTA to Book */}
        <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#1E1B1F] to-[#110e13] border border-border-amber/40 text-center shadow-[0_20px_60px_rgba(255,94,30,0.2)] relative overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[rgba(255,94,30,0.20)] blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 tracking-tight relative z-10">
            Ready to shoot your vertical reel?
          </h2>
          <p className="text-sm sm:text-base text-text-muted max-w-md mx-auto mb-8 relative z-10">
            Book professional iPhone cinematography across Bengaluru. Delivered directly to your device within minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link
              href="/#booking"
              className="btn-orange-lux btn-shine-sweep w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full font-black text-sm uppercase tracking-wider text-white shadow-[0_8px_28px_rgba(255,94,30,0.45)] hover:shadow-[0_12px_36px_rgba(255,94,30,0.65)] active:scale-95 transition-all text-center cursor-pointer"
            >
              <span>Book Your Reel</span>
              <Icon name="arrow_forward" size={16} />
            </Link>
            <Link
              href="/contact"
              className="btn-glass-creator w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-sm text-white/90 hover:text-white active:scale-95 transition-all text-center cursor-pointer"
            >
              <span>Contact Team</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
