export const LOCATION_TYPES = ['city', 'state']

export const CATEGORY_OPTIONS = [
  { label: 'Hotels', value: 'hotel' },
  { label: 'HomeStay & Villa', value: 'homestay & villa' },
  { label: 'Airbnb', value: 'airbnb' },
]

export const SITEMAP_CHANGEFREQ_OPTIONS = [
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
]

export const DEFAULT_LISTING = {
  locationType: 'city',
  category: '',
  country: 'India',
  state: '',
  city: '',
  slug: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  canonicalTag: '',
  robotsMeta: 'index, follow',
  heading: '',
  subHeading: '',
  bestTimeToVisit: '',
  howToReach: '',
  travelTips: '',
  highlights: [],
  faqs: [],
  nearbyLocations: [],
  latitude: '',
  longitude: '',
  mapEmbedUrl: '',
  images: [],
  altText: [],
  focusKeyword: '',
  tags: [],
  aboutLocation: '',
  schemaType: 'TouristDestination',
  enableFaqSchema: true,
  enablePageSchema: true,
  organizationName: '',
  organizationLogo: '',
  sitemapChangefreq: 'weekly',
  isActive: true,
}
