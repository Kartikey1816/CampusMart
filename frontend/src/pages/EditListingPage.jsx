import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getListing, updateListing } from '../services/listings'
import { useAuth } from '../context/useAuth'
import { listingCategories } from '../data/mockListings'

function EditListingPage() {
  const { listingId } = useParams()
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    getListing(listingId).then((item) => {
      if (!active) return
      if (item.sellerId !== user?.id) { setError('You can only edit your own listings.'); return }
      setListing(item)
      setForm({ title: item.title, price: item.price, category: item.category, condition: item.condition.toLowerCase().replace(' ', '-'), pickupLocation: item.pickupLocation, description: item.description })
    }).catch((err) => active && setError(err.message))
    return () => { active = false }
  }, [listingId, user?.id])

  const change = (key) => (event) => setForm({ ...form, [key]: event.target.value })
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const updated = await updateListing(listing.id, { ...form, price: Number(form.price) }, token)
      navigate(`/listings/${updated.id}`)
    } catch (err) { setError(err.message) } finally { setIsSubmitting(false) }
  }

  if (error) return <section className="detail-state"><h1>{error}</h1><Link to="/profile">Back to profile</Link></section>
  if (!form) return <section className="detail-state"><p className="eyebrow">CAMPUSMART</p><h1>Loading listing…</h1></section>

  return <section className="form-page"><div className="form-page-heading"><span className="eyebrow">MANAGE LISTING</span><h1>Edit your listing</h1><p>Keep the details accurate so buyers can decide with confidence.</p></div><form className="listing-form edit-listing-form" onSubmit={submit}><div className="form-stack"><label>Item title<input required minLength="3" maxLength="120" value={form.title} onChange={change('title')} /></label><div className="form-row"><label>Price (₹)<input required min="0" type="number" value={form.price} onChange={change('price')} /></label><label>Category<select value={form.category} onChange={change('category')}>{listingCategories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="form-row"><label>Condition<select value={form.condition} onChange={change('condition')}><option value="new">New</option><option value="like-new">Like new</option><option value="good">Good</option><option value="fair">Fair</option></select></label><label>Pickup location<input required maxLength="120" value={form.pickupLocation} onChange={change('pickupLocation')} /></label></div><label>Description<textarea required minLength="10" maxLength="2000" rows="6" value={form.description} onChange={change('description')} /></label></div><aside className="edit-listing-aside"><p><strong>Photos stay as they are</strong></p><p>Image replacement is not available yet. You can keep the existing photos or delete and recreate the listing if necessary.</p></aside><div className="form-wide form-actions"><Link className="outline-button" to={`/listings/${listing.id}`}>Cancel</Link><button className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save changes'}</button></div></form></section>
}

export default EditListingPage
