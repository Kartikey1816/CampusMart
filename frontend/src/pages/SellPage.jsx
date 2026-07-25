import { ImagePlus, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { createListing, uploadListingImages } from '../services/listings'
import { listingCategories } from '../data/mockListings'

const initialForm = { title: '', price: '', category: 'Books', condition: 'good', pickupLocation: '', description: '' }

function SellPage() {
  const { token } = useAuth(); const navigate = useNavigate()
  const [form, setForm] = useState(initialForm); const [files, setFiles] = useState([]); const [error, setError] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false)
  const change = (field) => (event) => setForm({ ...form, [field]: event.target.value })
  const selectFiles = (event) => setFiles(Array.from(event.target.files || []).slice(0, 5))
  const submit = async (event) => {
    event.preventDefault(); setError(''); setIsSubmitting(true)
    try {
      const listing = await createListing({ ...form, price: Number(form.price) }, token)
      const completedListing = await uploadListingImages(listing.id, files, token) || listing
      navigate(`/listings/${completedListing.id}`)
    } catch (err) { setError(err.message) } finally { setIsSubmitting(false) }
  }
  return <section className="form-page"><div className="form-page-heading"><span className="eyebrow">SELL ON CAMPUS</span><h1>Give a useful thing its next home.</h1><p>Post clear details so another student can quickly decide if it is right for them.</p></div><form className="listing-form" onSubmit={submit}><div className="form-stack"><label>Item title<input required minLength="3" maxLength="120" value={form.title} onChange={change('title')} placeholder="e.g. Casio fx-991ES Plus calculator" /></label><div className="form-row"><label>Price (₹)<input required min="0" type="number" value={form.price} onChange={change('price')} placeholder="0" /></label><label>Category<select value={form.category} onChange={change('category')}>{listingCategories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="form-row"><label>Condition<select value={form.condition} onChange={change('condition')}><option value="new">New</option><option value="like-new">Like new</option><option value="good">Good</option><option value="fair">Fair</option></select></label><label>Pickup location<input required maxLength="120" value={form.pickupLocation} onChange={change('pickupLocation')} placeholder="e.g. Central Library" /></label></div><label>Description<textarea required minLength="10" maxLength="2000" rows="6" value={form.description} onChange={change('description')} placeholder="Mention condition, included accessories, and anything a buyer should know." /></label></div><aside className="image-uploader"><span className="form-label">Photos <small>Optional, up to 5</small></span><label className="upload-dropzone"><ImagePlus size={28} /><strong>Add photos</strong><span>JPG, PNG, or WEBP up to 5 MB each</span><input type="file" accept="image/*" multiple onChange={selectFiles} /></label>{files.length > 0 && <div className="selected-files">{files.map((file, index) => <span key={`${file.name}-${index}`}>{file.name}<button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles(files.filter((_, itemIndex) => itemIndex !== index))}><X size={13} /></button></span>)}</div>}<p className="form-hint">Meet in a public campus area. Do not post personal contact details in your listing.</p></aside>{error && <p className="form-error form-wide">{error}</p>}<button className="primary-button form-wide" disabled={isSubmitting}>{isSubmitting ? 'Publishing…' : 'Publish listing'}</button></form></section>
}
export default SellPage
