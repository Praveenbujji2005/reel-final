/**
 * Centralized Blog Posts Data Store
 *
 * Slugs match the official site specifications:
 * 1. wedding-videography-packages-india-2026-cost-breakdown
 * 2. car-delivery-shoot-bangalore
 * 3. top-10-wedding-reel-trends-india-2026
 */

export const BLOG_POSTS = [
  {
    id: 1,
    slug: 'wedding-videography-packages-india-2026-cost-breakdown',
    title: 'Wedding Videography Packages in India: Complete 2026 Cost Breakdown',
    description: 'What wedding videography actually costs in India, tier by tier — no guesswork.',
    tag: 'Weddings',
    publishedDate: '2026-07-21',
    displayDate: '21 July 2026',
    intro:
      'Wedding videography pricing in India is famously opaque. Ask three studios for a quote and you will get three wildly different numbers, each bundled with terms that are hard to compare. This guide breaks down what you are actually paying for in 2026, using ReelXpress\'s transparent, published packages as a reference so you can budget with confidence.',
    takeaways: [
      'Normalise every studio quote to three factors: events covered, finished edits, and turnaround time.',
      'Instant reel delivery allows couples and guests to post while the celebration is actively trending.',
      'Higher tiers include raw 4K footage handover on SD card for lifetime archiving and re-cutting.',
    ],
    sections: [
      {
        heading: 'What drives the cost of wedding videography?',
        paragraphs: [
          'Three variables move the price more than anything else: the number of events covered, the number of finished deliverables you receive, and how quickly you get them. A single haldi or engagement needs one crew for a few hours. A four-day wedding with a mehendi, sangeet, ceremony and reception is a different production entirely, requiring coverage across multiple days and venues.',
          'The second big lever is output. Traditional studios quote a "highlight film" but leave the number of social-ready edits vague. Because most couples now want content they can post the same week, the count of finished reels matters far more than it used to.',
        ],
      },
      {
        heading: 'The 2026 tier-by-tier breakdown',
        paragraphs: [
          'Here is how a modern, reel-first wedding package is structured. These are ReelXpress\'s actual wedding videography packages, all shot on the latest iPhone with instant reel delivery and complimentary pictures.',
        ],
        pricingTiers: [
          {
            name: 'Basic',
            price: '₹14,999',
            events: 'Single Event',
            description:
              'Essential coverage for an intimate celebration or a single function. You get coverage of up to one event, three finished reels, and complementary pictures. This tier suits couples who want professional social content for a haldi, engagement or registry without committing to full multi-day coverage.',
            highlights: ['Up to 1 Event', '3 Finished Reels', 'Complementary Pictures'],
          },
          {
            name: 'Silver',
            price: '₹44,999',
            events: 'Three Events',
            description:
              'Comprehensive cinematic storytelling across three functions, with ten finished reels. This is the sweet spot for most Indian weddings, where the mehendi, sangeet and main ceremony each deserve their own edit.',
            highlights: ['Up to 3 Events', '10 Finished Reels', 'Instant Delivery per Event'],
          },
          {
            name: 'Gold',
            price: '₹59,999',
            events: 'Four Events',
            description:
              'Extended coverage across four events with fifteen reels, and — importantly — your raw content delivered on an SD card. If you want the footage archived so you can re-cut it later, this is the first tier that hands it over.',
            highlights: ['Up to 4 Events', '15 Finished Reels', 'Raw Content on SD Card'],
          },
          {
            name: 'Platinum',
            price: '₹99,999',
            events: 'Complete Wedding',
            description:
              'Coverage of the whole wedding, twenty-five reels, dedicated interaction videos (the candid guest and family moments), and raw content on SD card. This is the flagship for couples who want nothing left uncaptured.',
            highlights: ['Complete Wedding Coverage', '25 Finished Reels', 'Interaction Videos', 'Raw Content on SD Card'],
          },
        ],
      },
      {
        heading: 'Reading a quote like a pro',
        paragraphs: [
          'When you compare studios, normalise every quote to three numbers: events covered, finished edits delivered, and turnaround time. A ₹40,000 package that delivers one film in six weeks is not cheaper than a ₹44,999 package that delivers ten reels within minutes of each event — it is a different product. Also confirm whether revisions are included; ReelXpress builds in up to two free revisions on every package so you are not nickel-and-dimed for a colour tweak.',
        ],
      },
      {
        heading: 'Why turnaround changed the math',
        paragraphs: [
          'The single biggest shift in wedding videography over the last two years is speed. Guests expect to see content while the celebration is still trending in their feeds. A film that arrives two months later is a keepsake; a reel that arrives the same evening is marketing for your own wedding — it drives the shares, the comments and the "where was this shot?" DMs. That is why instant delivery, once a novelty, is now a headline feature rather than an upsell.',
        ],
      },
      {
        heading: 'How to choose your tier',
        bullets: [
          {
            label: 'One function, tight budget:',
            text: 'Basic covers it with three reels.',
          },
          {
            label: 'Standard multi-day wedding:',
            text: 'Silver\'s three events and ten reels fit the typical mehendi-sangeet-ceremony arc.',
          },
          {
            label: 'You want the raw footage:',
            text: 'Jump to Gold or Platinum, the tiers that include SD-card delivery.',
          },
          {
            label: 'Leave nothing out:',
            text: 'Platinum\'s full-wedding coverage and twenty-five reels is the comprehensive option.',
          },
        ],
      },
      {
        heading: 'What is usually not included — and how to check',
        paragraphs: [
          'The gaps in a quote cost more than the headline number. Before you commit, confirm a few things that studios often leave unsaid. Ask how many finished reels you receive, not just "a highlight" — the count is what determines whether every function is covered. Ask about turnaround in writing, because "soon" can mean two months. Ask whether revisions are included and how many; ReelXpress bundles two complimentary revision rounds into every tier, so a colour or pacing tweak never becomes a surprise charge. Ask whether raw footage is handed over, since only the higher tiers (Gold and Platinum) include SD-card delivery. And confirm what "coverage" means per event — a full function versus a token appearance are very different jobs.',
          'Finally, watch for the travel-and-logistics line. A package that looks cheap can balloon once conveyance and multi-day availability are added. A transparent, all-in package with published prices removes that anxiety entirely, which is the whole point of quoting by events and reel count rather than by a vague day rate.',
        ],
      },
      {
        heading: 'The bottom line',
        paragraphs: [
          'Wedding videography in India spans a huge range, but the confusion comes from opaque quoting, not genuine complexity. Anchor your decision to events, deliverables and turnaround, and the right tier becomes obvious.',
        ],
        footerCta: {
          text: 'You can see the full, published breakdown on our wedding packages page, browse real work in our portfolio, or book a shoot when you are ready.',
          links: [
            { label: 'Wedding Packages', href: '/#pricing' },
            { label: 'Portfolio', href: '/#portfolio' },
            { label: 'Book a Shoot', href: '/#booking' },
          ],
        },
      },
    ],
  },
  {
    id: 2,
    slug: 'car-delivery-shoot-bangalore',
    title: 'Car Delivery Shoot: Why Showrooms & Owners Are Booking Videographers',
    description: 'How a showroom handover becomes a cinematic, share-ready reel.',
    tag: 'Automotive',
    publishedDate: '2026-07-21',
    displayDate: '21 July 2026',
    intro:
      'Buying a car or a bike is one of the biggest emotional purchases most people make. For years, that moment — the keys changing hands, the first ride out of the showroom — went undocumented beyond a shaky phone clip. Today it is one of the fastest-growing niches in videography, and both showrooms and owners are booking professionals for it. Here is why the vehicle delivery shoot has become a category of its own.',
    takeaways: [
      'Authentic handover emotion generates organic viral engagement for dealerships and owners.',
      'Mobile iPhone cinematography gets tight cockpit angles and ground-level rolling shots seamlessly.',
      'Immediate delivery ensures buyers celebrate on social feeds before they even reach home.',
    ],
    sections: [
      {
        heading: 'The delivery moment is pure, unscripted emotion',
        paragraphs: [
          'Weddings are staged. Product shoots are art-directed. A vehicle handover is neither — it is genuine, first-take reaction. The moment someone sees their new car with the ribbon on it, sits in the driver\'s seat, or takes the first drive, the emotion is real and it photographs beautifully. That authenticity is exactly what performs on Instagram and Reels, where audiences are fatigued by over-produced content and reward the real thing.',
        ],
      },
      {
        heading: 'Why showrooms are commissioning it',
        paragraphs: [
          'For a dealership, a delivery reel is marketing that the customer actively wants to share. When a proud new owner posts their cinematic handover video and tags the showroom, that is authentic reach money cannot easily buy. It converts a one-time transaction into social proof that reaches every friend and follower the customer has. Progressive showrooms now offer a professional delivery shoot as a value-add that differentiates them from the dealer down the road.',
          'The economics are compelling. A single reel that a happy customer shares can out-perform a paid ad, because it carries the trust of a personal recommendation. Multiply that across every delivery in a month and the showroom builds a steady stream of genuine, customer-generated marketing.',
        ],
      },
      {
        heading: 'Why owners are booking it themselves',
        paragraphs: [
          'Not every owner waits for the showroom. Many book a videographer directly to capture the day they have been saving for. A first car, an upgrade after years of work, a dream bike — these are milestones people want preserved as more than a static photo. A cinematic reel of the first ride, cut to music, becomes the definitive memory of the day.',
        ],
      },
      {
        heading: 'What a good vehicle shoot actually captures',
        paragraphs: [
          'ReelXpress\'s vehicle package is built around the full arc of the moment, not just the static car. A strong delivery shoot covers:',
        ],
        bullets: [
          {
            label: 'The reveal:',
            text: 'The ribbon, the first look, the reaction.',
          },
          {
            label: 'The details:',
            text: 'Badges, alloys, interior, the odometer at zero.',
          },
          {
            label: 'The handover:',
            text: 'Keys changing hands, the first sit-in.',
          },
          {
            label: 'The first drive:',
            text: 'Rolling shots of the car or bike leaving, cut cinematically.',
          },
        ],
        extraParagraphs: [
          'All of it is shot on the latest iPhone in reel and shorts format, ready to post, with fast-turnaround delivery and a couple of revision rounds included at no cost. From showroom delivery to first reactions and the first ride, the goal is one polished, share-ready film.',
        ],
      },
      {
        heading: 'Cars and bikes both qualify',
        paragraphs: [
          'This is not just a four-wheeler story. Bike deliveries carry the same emotional charge — arguably more, given the enthusiast culture around motorcycles. A rolling shot of a new bike pulling away at golden hour is one of the most reliable pieces of content on two-wheeler Instagram.',
        ],
      },
      {
        heading: 'The mobile-first advantage',
        paragraphs: [
          'Vehicle shoots benefit uniquely from being shot on iPhone. A phone rig is small, unobtrusive and fast to reposition — you can get low ground-level shots, tight interior angles, and quick handheld follows that a bulky rig would fumble. And because the edit happens fast, the reel can be delivered while the excitement is still fresh, before the owner has even reached home.',
        ],
      },
      {
        heading: 'Timing and light: getting the cinematic look',
        paragraphs: [
          'The difference between a nice delivery clip and a genuinely cinematic reel usually comes down to timing. Golden hour — the hour after sunrise or before sunset — flatters paintwork and chrome, and turns a routine handover into something that looks shot for a commercial. Where the delivery time is fixed, an overcast sky is the next-best friend: soft, even light with no harsh reflections across the bodywork.',
          'Location matters just as much as light. A clean forecourt, an open road for the rolling shot, or a scenic backdrop for the first drive all elevate the final cut. A quick scout — even a mental one — before the shoot pays off, because the creator arrives knowing where the reveal, the detail shots and the drive-away will happen. Because the shoot is done on a compact iPhone rig, the creator can move fast between these setups without holding up the handover, and the finished reel is still delivered within minutes.',
        ],
      },
      {
        heading: 'How to book one',
        paragraphs: [
          'Whether you are a showroom wanting to offer delivery reels as a service, or an owner who wants their big day captured, a vehicle shoot is a custom package built around the specific handover. You can see examples in our hero section and request a booking to lock in a creator. You celebrate the moment; we shoot, edit and deliver before the excitement fades.',
        ],
        footerCta: {
          text: 'Lock in your vehicle handover with certified mobile cinematographers.',
          links: [
            { label: 'Explore Vehicle Packages', href: '/#pricing' },
            { label: 'Request a Booking', href: '/#booking' },
          ],
        },
      },
    ],
  },
  {
    id: 3,
    slug: 'top-10-wedding-reel-trends-india-2026',
    title: 'Top 10 Wedding Reel Trends in India 2026',
    description: 'The trends defining Indian wedding reels this year — and how to capture them.',
    tag: 'Trends',
    publishedDate: '2026-07-21',
    displayDate: '21 July 2026',
    intro:
      'Wedding content in India has moved decisively from the album to the feed. Couples now plan for how their wedding will look as a reel just as carefully as how it looks in person. Here are the ten trends defining Indian wedding reels in 2026 — and how to make sure your own wedding is captured for them.',
    takeaways: [
      'Same-day vertical reels capture maximum reach while event hashtags are trending.',
      'Candid interaction and guest reactions outperform staged slow-motion couple walks.',
      'Function-by-function reel series replace monolithic 60-minute wedding videos.',
    ],
    sections: [
      {
        heading: 'Top 10 Wedding Reel Trends in India 2026',
        numberedTrends: [
          {
            number: '01',
            title: 'Same-day edits are the new standard',
            text: 'The biggest shift is speed. Couples expect a polished reel from the mehendi to be live before the sangeet even starts. Instant delivery — a finished reel within minutes of a function — has gone from novelty to expectation, because same-day content is what actually rides the wedding hashtag while guests are still posting.',
          },
          {
            number: '02',
            title: 'Vertical-first storytelling',
            text: 'Reels are watched vertically, so they are increasingly shot vertically from the start rather than cropped from horizontal footage. Shooting on iPhone makes vertical the native frame, which is why mobile-first wedding coverage has taken over the reel space.',
          },
          {
            number: '03',
            title: 'Candid interaction videos over posed sequences',
            text: 'The staged, slow-motion couple walk is giving way to candid interaction videos — real conversations, family reactions, the unscripted moments between the set pieces. These "in-between" clips consistently out-perform the posed shots because they feel genuine. ReelXpress\'s Platinum wedding package includes dedicated interaction videos for exactly this reason.',
          },
          {
            number: '04',
            title: 'Function-by-function reel series',
            text: 'Instead of one long film, couples want a reel per function — a haldi reel, a mehendi reel, a sangeet reel — each posted the day it happens. This is why packages are increasingly priced by event and by reel count rather than by a single film, from three reels on a single-event package up to twenty-five across a full wedding.',
          },
          {
            number: '05',
            title: 'Trending-audio-led edits',
            text: 'The music makes the reel. Edits are increasingly cut to whatever audio is trending that week, because riding a popular sound is one of the strongest distribution levers on Instagram. Fast delivery matters here too — a trending sound this week may be stale next month.',
          },
          {
            number: '06',
            title: 'The "get ready with me" bridal reel',
            text: 'Bridal prep content — the getting-ready sequence, the jewellery, the final look reveal — has become a genre of its own. It is intimate, aspirational and highly shareable, and it gives the bride a starring reel that is entirely her own.',
          },
          {
            number: '07',
            title: 'Guest-perspective and reaction shots',
            text: 'Reels increasingly weave in guest reactions — the tears, the laughs, the dance-floor chaos — to tell the story from the room rather than just from the stage. An unobtrusive mobile creator captures these candidly, without the guest ever feeling filmed.',
          },
          {
            number: '08',
            title: 'Golden-hour and rolling exits',
            text: 'Cinematic movement — golden-hour couple portraits, rolling shots of the exit, drone-style follows — remains a staple, now cut tighter and faster to suit the reel format rather than stretched into a long film.',
          },
          {
            number: '09',
            title: 'Raw footage as a keepsake',
            text: 'Even as reels dominate, couples increasingly want the raw content archived so they can re-cut it in years to come. Higher wedding tiers now hand over raw footage on an SD card precisely for this — the reels for now, the archive for later.',
          },
          {
            number: '10',
            title: 'Booking content-first, not camera-first',
            text: 'The final trend is a mindset shift: couples now book for the content outcome — how many reels, how fast, in what format — rather than just "a videographer." Transparent, reel-count-based wedding packages exist because that is how couples now think about the decision.',
          },
        ],
      },
      {
        heading: 'How to brief your videographer for these trends',
        paragraphs: [
          'Trends only translate to your feed if the shoot is planned for them. A few briefing notes make the difference. Tell your creator which functions you most want as standalone reels, so coverage and edits are allocated where they matter to you. Flag if you want a bridal getting-ready reel — it needs access to the prep room and a little lead time. Ask for candid interaction coverage explicitly, because the best in-between moments are captured by a creator who is watching for them rather than only shooting the set pieces.',
          'Speed should be part of the brief too. If you want same-day reels to ride the wedding hashtag, say so up front — instant delivery is built for exactly this, but it helps the creator prioritise the edit. And if you care about archiving, confirm your tier includes raw footage on SD card so you can re-cut in future. A clear, trend-aware brief is what turns a generic "wedding video" into the function-by-function reel series couples actually want in 2026.',
        ],
      },
      {
        heading: 'How to capture these trends at your wedding',
        paragraphs: [
          'The common thread across all ten trends is speed, vertical format and candid authenticity — exactly what a mobile-first, instant-delivery workflow is built for. If you want your 2026 wedding captured for the feed as thoughtfully as for the album, our wedding packages lay out the reel count per tier, the portfolio shows the current style, and you can reserve a date whenever you are ready.',
        ],
        footerCta: {
          text: 'Book mobile-first wedding reels delivered instantly on your big day.',
          links: [
            { label: 'View Wedding Packages', href: '/#pricing' },
            { label: 'Watch Portfolio', href: '/#portfolio' },
            { label: 'Reserve a Date', href: '/#booking' },
          ],
        },
      },
    ],
  },
];

export function getBlogPostBySlug(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllBlogSlugs() {
  return BLOG_POSTS.map((p) => p.slug);
}

export default BLOG_POSTS;
