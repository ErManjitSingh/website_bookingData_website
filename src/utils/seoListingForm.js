import { DEFAULT_LISTING } from '../constants/seoListing'

export function uniqueLocations(list) {
  const seen = new Set()
  const result = []

  for (const item of list) {
    const trimmed = String(item ?? '')
      .trim()
      .replace(/^,\s*/, '')
    if (!trimmed) continue

    const key = trimmed.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(trimmed)
    }
  }

  return result.sort((a, b) => a.localeCompare(b))
}

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function listingToForm(listing) {
  if (!listing) return { ...DEFAULT_LISTING }

  return {
    locationType: listing.locationType ?? 'city',
    category: listing.category ?? '',
    country: listing.country ?? 'India',
    state: listing.state ?? '',
    city: listing.city ?? '',
    slug: listing.slug ?? '',
    metaTitle: listing.metaTitle ?? '',
    metaDescription: listing.metaDescription ?? '',
    metaKeywords: listing.metaKeywords ?? '',
    canonicalTag: listing.canonicalTag ?? '',
    robotsMeta: listing.robotsMeta ?? 'index, follow',
    heading: listing.heading ?? '',
    subHeading: listing.subHeading ?? '',
    bestTimeToVisit: listing.bestTimeToVisit ?? '',
    howToReach: listing.howToReach ?? '',
    travelTips: listing.travelTips ?? '',
    highlights: listing.highlights ?? [],
    faqs: listing.faqs ?? [],
    nearbyLocations: listing.nearbyLocations ?? [],
    latitude: listing.latitude ?? '',
    longitude: listing.longitude ?? '',
    mapEmbedUrl: listing.mapEmbedUrl ?? '',
    images: listing.images ?? [],
    altText: listing.altText ?? [],
    focusKeyword: listing.focusKeyword ?? '',
    tags: listing.tags ?? [],
    aboutLocation: listing.aboutLocation ?? '',
    schemaType: listing.schemaType ?? 'TouristDestination',
    enableFaqSchema: listing.enableFaqSchema ?? true,
    enablePageSchema: listing.enablePageSchema ?? true,
    organizationName: listing.organizationName ?? '',
    organizationLogo: listing.organizationLogo ?? '',
    sitemapChangefreq: listing.sitemapChangefreq ?? 'weekly',
    isActive: listing.isActive ?? true,
  }
}

export function formToPayload(form) {
  const latitude = form.latitude === '' ? null : Number(form.latitude)
  const longitude = form.longitude === '' ? null : Number(form.longitude)

  return {
    ...form,
    slug: form.slug.toLowerCase().trim(),
    category: form.category.toLowerCase().trim(),
    state: form.locationType === 'state' ? form.state : form.state,
    city: form.locationType === 'city' ? form.city : '',
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    highlights: form.highlights.filter(Boolean),
    tags: form.tags.filter(Boolean),
    altText: form.altText.filter(Boolean),
    faqs: form.faqs.filter((f) => f.question?.trim() && f.answer?.trim()),
    nearbyLocations: form.nearbyLocations.filter((n) => n.name?.trim()),
    images: form.images.filter((img) => img.preview?.trim() || img.name?.trim()),
  }
}
