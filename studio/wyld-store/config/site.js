// Single source of brand, contact and commerce settings for the website, the
// app, the SEO build and the Android build. Business channels only: never add
// personal names, personal emails or private phone numbers here.
export const site = {
  name: 'WYLD',
  tagline: 'Cycling, triathlon & run apparel',
  description: 'Size-inclusive cycling, triathlon and run apparel from WYLD: race-fit and club-fit jerseys, bib shorts, trisuits, run tops and custom team kit, from XXS to 4XL.',
  shopUrl: 'https://ridewyld.com',
  currency: 'AED',
  language: 'en',
  // Public URL of this site. Leave empty in source: the SEO and app builds
  // take it from the SITE_URL environment variable (set by CI from the
  // GitHub Pages address, or a custom domain via the WYLD_SITE_URL variable).
  siteUrl: '',

  // Fact from the store's shipping policy.
  freeShippingThreshold: 1000,

  contact: {
    form: 'https://ridewyld.com/pages/contact',
    customKit: 'https://ridewyld.com/pages/custom-kit',
    // Business channels. Empty values are hidden everywhere.
    email: '',
    phone: '',
    whatsapp: '',
  },
  social: {
    instagram: 'https://www.instagram.com/ridewyld',
    tiktok: 'https://www.tiktok.com/@wearewyld',
  },
  policies: {
    shipping: 'https://ridewyld.com/policies/shipping-policy',
    returns: 'https://ridewyld.com/policies/refund-policy',
    privacy: 'https://ridewyld.com/policies/privacy-policy',
    terms: 'https://ridewyld.com/policies/terms-of-service',
  },
  journal: 'https://ridewyld.com/blogs/blog',
  giftCard: 'https://ridewyld.com/products/wyld-gift-card',
};
