import { Heart } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { api } from '../services/api'
import { normalizeListing } from '../services/listings'
import ListingCard from '../components/ListingCard'

function SavedPage() {
  const { token } = useAuth(); const [listings, setListings] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true)
  const load = useCallback(() => api('/wishlist', { token }).then(({ listings: items }) => setListings(items.map(normalizeListing))).catch((err) => setError(err.message)).finally(() => setLoading(false)), [token])
  useEffect(() => { load() }, [load])
  const remove = async (listing) => { try { await api(`/wishlist/${listing.id}`, { method: 'DELETE', token }); setListings(listings.filter((item) => item.id !== listing.id)) } catch (err) { setError(err.message) } }
  return <section className="saved-page"><span className="eyebrow">YOUR SHORTLIST</span><h1>Saved listings</h1><p>Keep good campus finds here until you are ready to reach out.</p>{error && <p className="form-error">{error}</p>}{loading ? <div className="empty-results"><p>Loading saved listings…</p></div> : listings.length ? <div className="listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} isSaved onSave={remove} />)}</div> : <div className="empty-results"><Heart size={31} /><h2>No saved listings yet</h2><p>Tap the heart on any item you would like to revisit.</p></div>}</section>
}
export default SavedPage
