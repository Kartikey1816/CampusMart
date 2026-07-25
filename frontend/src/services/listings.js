import { Package } from 'lucide-react'
import { listings as mockListings } from '../data/mockListings'
import { api, apiBaseUrl } from './api'

const titleCase = (value = '') => value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export const normalizeListing = (listing) => ({
  ...listing,
  id: String(listing.id || listing._id),
  condition: titleCase(listing.condition),
  seller: typeof listing.seller === 'string' ? listing.seller : listing.seller?.name || 'Verified student',
  sellerId: typeof listing.seller === 'object' ? String(listing.seller?._id || listing.seller?.id || '') : undefined,
  icon: Package,
  tone: 'sage',
  posted: listing.createdAt ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round((new Date(listing.createdAt) - Date.now()) / 86400000), 'day') : 'Recently',
})

const categoryAliases = {
  all: 'All', book: 'Books', books: 'Books', electronic: 'Electronics', electronics: 'Electronics',
  hostel: 'Hostel', fashion: 'Fashion', sport: 'Sports', sports: 'Sports'
}

export async function getListings({ search = '', category = 'All', sort = 'Newest', condition = 'All', minPrice = '', maxPrice = '' } = {}) {
  const normalizedSearch = search.trim().toLowerCase()
  const searchCategory = categoryAliases[normalizedSearch]
  const effectiveCategory = category === 'All' && searchCategory ? searchCategory : category
  const effectiveSearch = searchCategory ? '' : search.trim()
  try {
    const params = new URLSearchParams({ status: 'available', limit: '50' })
    if (effectiveSearch) params.set('q', effectiveSearch)
    if (effectiveCategory !== 'All') params.set('category', effectiveCategory)
    if (condition !== 'All') params.set('condition', condition)
    if (minPrice !== '') params.set('minPrice', minPrice)
    if (maxPrice !== '') params.set('maxPrice', maxPrice)
    const sortBy = { 'Newest': 'newest', 'Price: low to high': 'price_asc', 'Price: high to low': 'price_desc' }[sort]
    if (sortBy) params.set('sort', sortBy)
    const response = await fetch(`${apiBaseUrl}/listings?${params}`)
    if (!response.ok) throw new Error('Listings API is unavailable.')
    const payload = await response.json()
    return payload.listings.map(normalizeListing)
  } catch {
    const query = effectiveSearch.toLowerCase()
    const results = mockListings.filter((listing) =>
      (effectiveCategory === 'All' || listing.category === effectiveCategory)
      && (condition === 'All' || listing.condition.toLowerCase().replace(' ', '-') === condition)
      && (minPrice === '' || listing.price >= Number(minPrice))
      && (maxPrice === '' || listing.price <= Number(maxPrice))
      && (!query || `${listing.title} ${listing.description} ${listing.category}`.toLowerCase().includes(query))
    )
    return [...results].sort((a, b) => sort === 'Price: low to high' ? a.price - b.price : sort === 'Price: high to low' ? b.price - a.price : a.id - b.id)
  }
}

export async function getListing(id) {
  const mockListing = mockListings.find((listing) => String(listing.id) === String(id))
  if (mockListing) return mockListing

  const response = await fetch(`${apiBaseUrl}/listings/${id}`)
  if (!response.ok) throw new Error('Listing could not be found.')
  const payload = await response.json()
  return normalizeListing(payload.listing)
}

export async function createListing(fields, token) {
  const payload = await api('/listings', { method: 'POST', token, body: fields })
  return normalizeListing(payload.listing)
}

export async function uploadListingImages(id, files, token) {
  if (!files.length) return null
  const body = new FormData()
  files.forEach((file) => body.append('images', file))
  const payload = await api(`/listings/${id}/images`, { method: 'POST', token, body })
  return normalizeListing(payload.listing)
}
