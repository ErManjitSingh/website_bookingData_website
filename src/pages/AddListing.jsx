import { useEffect, useState } from 'react'
import { fetchCities, fetchStates } from '../api/locations'
import { createListing, fetchListingById, updateListing } from '../api/seoListings'
import {
  DEFAULT_LISTING,
  LOCATION_TYPES,
  CATEGORY_OPTIONS,
  SITEMAP_CHANGEFREQ_OPTIONS,
} from '../constants/seoListing'
import { formToPayload, listingToForm, slugify } from '../utils/seoListingForm'
import ImageUpload from '../components/ImageUpload'
import './AddListing.css'

function Field({ label, required, children, hint }) {
  return (
    <label className="form-field">
      <span className="form-field__label">
        {label}
        {required && <span className="form-field__required">*</span>}
      </span>
      {children}
      {hint && <span className="form-field__hint">{hint}</span>}
    </label>
  )
}

function Section({ title, children }) {
  return (
    <section className="form-section">
      <h3 className="form-section__title">{title}</h3>
      <div className="form-section__body">{children}</div>
    </section>
  )
}

function TagList({ values, onChange, placeholder }) {
  const [input, setInput] = useState('')

  const add = () => {
    const value = input.trim()
    if (!value || values.includes(value)) return
    onChange([...values, value])
    setInput('')
  }

  return (
    <div className="tag-list">
      <div className="tag-list__input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <button type="button" onClick={add}>
          Add
        </button>
      </div>
      <div className="tag-list__items">
        {values.map((tag, i) => (
          <span key={tag + i} className="tag-list__tag">
            {tag}
            <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))}>
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function AddListing({ editId, onSaved, onCancelEdit }) {
  const [form, setForm] = useState({ ...DEFAULT_LISTING })
  const [cities, setCities] = useState([])
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(!!editId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const isEdit = Boolean(editId)

  useEffect(() => {
    Promise.all([fetchCities(), fetchStates()])
      .then(([cityList, stateList]) => {
        setCities(cityList)
        setStates(stateList)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!editId) {
      setForm({ ...DEFAULT_LISTING })
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    fetchListingById(editId)
      .then((data) => setForm(listingToForm(data)))
      .catch((err) => setError(err.message ?? 'Failed to load listing'))
      .finally(() => setLoading(false))
  }, [editId])

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = formToPayload(form)
      if (isEdit) {
        await updateListing(editId, payload)
        setSuccess('Listing updated successfully')
      } else {
        await createListing(payload)
        setSuccess('Listing created successfully')
        setForm({ ...DEFAULT_LISTING })
      }
      onSaved?.()
    } catch (err) {
      setError(err.message ?? 'Failed to save listing')
    } finally {
      setSaving(false)
    }
  }

  const addFaq = () => update({ faqs: [...form.faqs, { question: '', answer: '' }] })
  const updateFaq = (index, field, value) => {
    const faqs = form.faqs.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    update({ faqs })
  }
  const removeFaq = (index) => update({ faqs: form.faqs.filter((_, i) => i !== index) })

  const addNearby = () =>
    update({
      nearbyLocations: [
        ...form.nearbyLocations,
        { name: '', slug: '', distance: '', image: '', altText: '' },
      ],
    })
  const updateNearby = (index, field, value) => {
    const nearbyLocations = form.nearbyLocations.map((n, i) =>
      i === index ? { ...n, [field]: value } : n,
    )
    update({ nearbyLocations })
  }
  const removeNearby = (index) =>
    update({ nearbyLocations: form.nearbyLocations.filter((_, i) => i !== index) })

  const addImage = () =>
    update({
      images: [...form.images, { name: '', preview: '', id: Date.now() }],
    })
  const updateImage = (index, field, value) => {
    const images = form.images.map((img, i) => (i === index ? { ...img, [field]: value } : img))
    update({ images })
  }
  const removeImage = (index) => update({ images: form.images.filter((_, i) => i !== index) })

  if (loading) {
    return (
      <div className="listing-state">
        <div className="bookings-spinner" />
        <p>Loading listing…</p>
      </div>
    )
  }

  return (
    <div className="add-listing">
      <div className="add-listing__header">
        <h2>{isEdit ? 'Edit Listing' : 'Add Listing'}</h2>
        {isEdit && (
          <button type="button" className="add-listing__cancel" onClick={onCancelEdit}>
            Cancel Edit
          </button>
        )}
      </div>

      {error && (
        <div className="add-listing__alert add-listing__alert--error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="add-listing__alert add-listing__alert--success" role="status">
          {success}
        </div>
      )}

      <form className="listing-form" onSubmit={handleSubmit}>
        <Section title="Location">
          <div className="form-grid">
            <Field label="Location Type" required>
              <select
                value={form.locationType}
                onChange={(e) => update({ locationType: e.target.value })}
                required
              >
                {LOCATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => update({ category: e.target.value })}
              >
                <option value="">Select category</option>
                {form.category &&
                  !CATEGORY_OPTIONS.some((opt) => opt.value === form.category) && (
                    <option value={form.category}>{form.category}</option>
                  )}
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Country" required>
              <input
                type="text"
                value={form.country}
                onChange={(e) => update({ country: e.target.value })}
                required
              />
            </Field>

            <Field label="State" required={form.locationType === 'state'}>
              <select
                value={form.state}
                onChange={(e) => update({ state: e.target.value })}
                required={form.locationType === 'state'}
              >
                <option value="">Select state</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </Field>

            {form.locationType === 'city' && (
              <Field label="City" required>
                <select
                  value={form.city}
                  onChange={(e) => update({ city: e.target.value })}
                  required
                >
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Slug" required hint="Unique URL slug (lowercase)">
              <div className="slug-row">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => update({ slug: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="slug-row__btn"
                  onClick={() => update({ slug: slugify(form.heading || form.city || form.state) })}
                >
                  Generate
                </button>
              </div>
            </Field>
          </div>
        </Section>

        <Section title="SEO Meta">
          <div className="form-grid">
            <Field label="Meta Title" required>
              <input
                type="text"
                value={form.metaTitle}
                onChange={(e) => update({ metaTitle: e.target.value })}
                required
              />
            </Field>
            <Field label="Focus Keyword">
              <input
                type="text"
                value={form.focusKeyword}
                onChange={(e) => update({ focusKeyword: e.target.value })}
              />
            </Field>
            <Field label="Meta Description" required>
              <textarea
                value={form.metaDescription}
                onChange={(e) => update({ metaDescription: e.target.value })}
                rows={3}
                required
              />
            </Field>
            <Field label="Meta Keywords">
              <input
                type="text"
                value={form.metaKeywords}
                onChange={(e) => update({ metaKeywords: e.target.value })}
              />
            </Field>
            <Field label="Canonical Tag">
              <input
                type="text"
                value={form.canonicalTag}
                onChange={(e) => update({ canonicalTag: e.target.value })}
              />
            </Field>
            <Field label="Robots Meta">
              <input
                type="text"
                value={form.robotsMeta}
                onChange={(e) => update({ robotsMeta: e.target.value })}
              />
            </Field>
          </div>
        </Section>

        <Section title="Content">
          <div className="form-grid">
            <Field label="Heading" required>
              <input
                type="text"
                value={form.heading}
                onChange={(e) => update({ heading: e.target.value })}
                required
              />
            </Field>
            <Field label="Sub Heading">
              <input
                type="text"
                value={form.subHeading}
                onChange={(e) => update({ subHeading: e.target.value })}
              />
            </Field>
            <Field label="About Location" required>
              <textarea
                value={form.aboutLocation}
                onChange={(e) => update({ aboutLocation: e.target.value })}
                rows={5}
                required
              />
            </Field>
            <Field label="Best Time to Visit">
              <textarea
                value={form.bestTimeToVisit}
                onChange={(e) => update({ bestTimeToVisit: e.target.value })}
                rows={2}
              />
            </Field>
            <Field label="How to Reach">
              <textarea
                value={form.howToReach}
                onChange={(e) => update({ howToReach: e.target.value })}
                rows={2}
              />
            </Field>
            <Field label="Travel Tips">
              <textarea
                value={form.travelTips}
                onChange={(e) => update({ travelTips: e.target.value })}
                rows={2}
              />
            </Field>
            <Field label="Highlights">
              <TagList
                values={form.highlights}
                onChange={(highlights) => update({ highlights })}
                placeholder="Add highlight"
              />
            </Field>
            <Field label="Tags">
              <TagList
                values={form.tags}
                onChange={(tags) => update({ tags })}
                placeholder="Add tag"
              />
            </Field>
          </div>
        </Section>

        <Section title="FAQs">
          {form.faqs.map((faq, i) => (
            <div key={i} className="repeat-block">
              <div className="repeat-block__header">
                <span>FAQ {i + 1}</span>
                <button type="button" onClick={() => removeFaq(i)}>
                  Remove
                </button>
              </div>
              <Field label="Question" required>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => updateFaq(i, 'question', e.target.value)}
                />
              </Field>
              <Field label="Answer" required>
                <textarea
                  value={faq.answer}
                  onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                  rows={2}
                />
              </Field>
            </div>
          ))}
          <button type="button" className="repeat-block__add" onClick={addFaq}>
            + Add FAQ
          </button>
        </Section>

        <Section title="Nearby Locations">
          {form.nearbyLocations.map((loc, i) => (
            <div key={i} className="repeat-block">
              <div className="repeat-block__header">
                <span>Location {i + 1}</span>
                <button type="button" onClick={() => removeNearby(i)}>
                  Remove
                </button>
              </div>
              <div className="form-grid">
                <Field label="Name" required>
                  <input
                    type="text"
                    value={loc.name}
                    onChange={(e) => updateNearby(i, 'name', e.target.value)}
                  />
                </Field>
                <Field label="Slug">
                  <input
                    type="text"
                    value={loc.slug}
                    onChange={(e) => updateNearby(i, 'slug', e.target.value)}
                  />
                </Field>
                <Field label="Distance">
                  <input
                    type="text"
                    value={loc.distance}
                    onChange={(e) => updateNearby(i, 'distance', e.target.value)}
                  />
                </Field>
                <Field label="Image">
                  <ImageUpload
                    value={loc.image}
                    onChange={(url) => updateNearby(i, 'image', url)}
                    folder="seo-listings/nearby"
                  />
                </Field>
                <Field label="Alt Text">
                  <input
                    type="text"
                    value={loc.altText}
                    onChange={(e) => updateNearby(i, 'altText', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          ))}
          <button type="button" className="repeat-block__add" onClick={addNearby}>
            + Add Nearby Location
          </button>
        </Section>

        <Section title="Map & Coordinates">
          <div className="form-grid">
            <Field label="Latitude">
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => update({ latitude: e.target.value })}
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => update({ longitude: e.target.value })}
              />
            </Field>
            <Field label="Map Embed URL">
              <input
                type="text"
                value={form.mapEmbedUrl}
                onChange={(e) => update({ mapEmbedUrl: e.target.value })}
              />
            </Field>
          </div>
        </Section>

        <Section title="Images">
          {form.images.map((img, i) => (
            <div key={img.id ?? i} className="repeat-block">
              <div className="repeat-block__header">
                <span>Image {i + 1}</span>
                <button type="button" onClick={() => removeImage(i)}>
                  Remove
                </button>
              </div>
              <div className="form-grid">
                <Field label="Name">
                  <input
                    type="text"
                    value={img.name}
                    onChange={(e) => updateImage(i, 'name', e.target.value)}
                  />
                </Field>
                <Field label="Image">
                  <ImageUpload
                    value={img.preview}
                    onChange={(url) => {
                      const images = form.images.map((item, idx) => {
                        if (idx !== i) return item
                        const fileName = url
                          ? decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? '')
                          : ''
                        return {
                          ...item,
                          preview: url,
                          name: item.name || fileName,
                        }
                      })
                      update({ images })
                    }}
                    folder="seo-listings/images"
                  />
                </Field>
              </div>
            </div>
          ))}
          <button type="button" className="repeat-block__add" onClick={addImage}>
            + Add Image
          </button>
          <Field label="Image Alt Texts">
            <TagList
              values={form.altText}
              onChange={(altText) => update({ altText })}
              placeholder="Add alt text"
            />
          </Field>
        </Section>

        <Section title="Schema & Settings">
          <div className="form-grid">
            <Field label="Schema Type">
              <input
                type="text"
                value={form.schemaType}
                onChange={(e) => update({ schemaType: e.target.value })}
              />
            </Field>
            <Field label="Sitemap Changefreq">
              <select
                value={form.sitemapChangefreq}
                onChange={(e) => update({ sitemapChangefreq: e.target.value })}
              >
                {SITEMAP_CHANGEFREQ_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Organization Name">
              <input
                type="text"
                value={form.organizationName}
                onChange={(e) => update({ organizationName: e.target.value })}
              />
            </Field>
            <Field label="Organization Logo">
              <ImageUpload
                value={form.organizationLogo}
                onChange={(url) => update({ organizationLogo: url })}
                folder="seo-listings/logos"
              />
            </Field>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={form.enableFaqSchema}
                onChange={(e) => update({ enableFaqSchema: e.target.checked })}
              />
              Enable FAQ Schema
            </label>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={form.enablePageSchema}
                onChange={(e) => update({ enablePageSchema: e.target.checked })}
              />
              Enable Page Schema
            </label>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => update({ isActive: e.target.checked })}
              />
              Active Listing
            </label>
          </div>
        </Section>

        <div className="listing-form__actions">
          <button type="submit" className="listing-form__submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update Listing' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  )
}
