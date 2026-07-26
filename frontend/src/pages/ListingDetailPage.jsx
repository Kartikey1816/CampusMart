import { ArrowLeft, CheckCircle2, Heart, MapPin, MessageCircle, Pencil, ShieldCheck, Share2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteListing, getListing, markListingSold } from '../services/listings'
import { useAuth } from '../context/useAuth'
import { api } from '../services/api'
import ReviewForm from '../components/ReviewForm'

function ListingDetailPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [error, setError] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const { token, user } = useAuth()

  useEffect(() => {
    let active = true
    getListing(listingId).then((item) => active && setListing(item)).catch(() => active && setError('This listing is no longer available.'))
    return () => { active = false }
  }, [listingId])

  useEffect(() => {
    if (!token) return
    api('/wishlist', { token }).then(({ listings }) => setIsSaved(listings.some((item) => String(item.id) === String(listingId)))).catch(() => {})
  }, [listingId, token])

  const toggleSave = async () => {
    if (!token) { navigate('/login'); return }
    try { await api(`/wishlist/${listing.id}`, { method: isSaved ? 'DELETE' : 'POST', token }); setIsSaved(!isSaved) } catch (err) { setError(err.message) }
  }
  const markSold = async () => {
    if (!window.confirm('Mark this listing as sold? Buyers will no longer be able to start a new chat.')) return
    try { setListing(await markListingSold(listing.id, token)) } catch (err) { setError(err.message) }
  }
  const removeListing = async () => {
    if (!window.confirm('Delete this listing permanently? Its images will also be removed.')) return
    try { await deleteListing(listing.id, token); navigate('/profile') } catch (err) { setError(err.message) }
  }

  if (error && !listing) return <section className="detail-state"><h1>{error}</h1><Link to="/explore">Back to listings</Link></section>
  if (!listing) return <section className="detail-state"><p className="eyebrow">CAMPUSMART</p><h1>Loading listing…</h1></section>

  const Icon = listing.icon
  const isOwnListing = listing.sellerId && listing.sellerId === user?.id
  return <section className="detail-page">
    <Link className="back-link" to="/explore"><ArrowLeft size={17} /> Back to listings</Link>
    <div className="detail-grid">
      <div className={`detail-image tone-${listing.tone}`}>{listing.images?.[0]?.url ? <img src={listing.images[0].url} alt={listing.title} /> : <Icon size={110} strokeWidth={1.1} aria-hidden="true" />}<span className="condition-pill">{listing.status === 'sold' ? 'Sold' : listing.condition}</span></div>
      <div className="detail-content">
        <div className="detail-heading"><div><span className="listing-category">{listing.category}</span><h1>{listing.title}</h1></div>{!isOwnListing && <div className="detail-actions"><button type="button" aria-label="Save listing" className={isSaved ? 'saved' : ''} onClick={toggleSave}><Heart size={19} fill={isSaved ? 'currentColor' : 'none'} /></button><button type="button" aria-label="Share listing" onClick={() => navigator.share?.({ title: listing.title, url: window.location.href })}><Share2 size={19} /></button></div>}</div>
        {error && <p className="form-error">{error}</p>}
        <div className="detail-price">₹{listing.price.toLocaleString('en-IN')}</div><p className="detail-posted">Posted {listing.posted}</p>
        {listing.sellerId ? <Link className="seller-card" to={isOwnListing ? '/profile' : `/sellers/${listing.sellerId}`}><div className="seller-avatar">{listing.seller.slice(0, 1)}</div><div><span className="seller-label"><ShieldCheck size={15} /> Verified student</span><strong>{listing.seller}</strong><small>View seller profile</small></div></Link> : <div className="seller-card"><div className="seller-avatar">{listing.seller.slice(0, 1)}</div><div><span className="seller-label"><ShieldCheck size={15} /> Verified student</span><strong>{listing.seller}</strong><small>Student at your college</small></div></div>}
        <div className="detail-section"><h2>About this item</h2><p>{listing.description}</p></div>
        <div className="pickup-card"><MapPin size={20} /><div><span>Preferred pickup</span><strong>{listing.pickupLocation || 'On campus'}</strong></div></div>
        {isOwnListing ? <div className="listing-management"><span className="eyebrow">YOUR LISTING</span>{listing.status === 'sold' ? <p className="sold-note"><CheckCircle2 size={17} /> This listing is marked as sold.</p> : <button type="button" className="primary-button" onClick={markSold}><CheckCircle2 size={18} /> Mark as sold</button>}<Link className="outline-button" to={`/listings/${listing.id}/edit`}><Pencil size={16} /> Edit listing</Link><button type="button" className="delete-button" onClick={removeListing}><Trash2 size={16} /> Delete listing</button></div> : listing.status === 'sold' ? <>{!hasReviewed && token && <ReviewForm listingId={listing.id} token={token} onComplete={() => setHasReviewed(true)} />}<p className="sold-note"><CheckCircle2 size={17} /> This item has been sold.</p></> : <Link className="chat-button" to={token ? `/chats?listingId=${listing.id}` : '/login'}><MessageCircle size={20} /> Chat with seller</Link>}
        <p className="safety-note">For your safety, meet in a public campus location. Never share OTPs or payment passwords.</p>
      </div>
    </div>
  </section>
}

export default ListingDetailPage
