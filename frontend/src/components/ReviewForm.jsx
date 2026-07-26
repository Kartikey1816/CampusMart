import { Star } from 'lucide-react'
import { useState } from 'react'
import { api } from '../services/api'

function ReviewForm({ listingId, token, onComplete }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submit = async (event) => {
    event.preventDefault(); setError(''); setIsSubmitting(true)
    try { const data = await api(`/reviews/listings/${listingId}`, { method: 'POST', token, body: { rating, comment } }); onComplete(data.review) } catch (err) { setError(err.message) } finally { setIsSubmitting(false) }
  }
  return <form className="review-form" onSubmit={submit}><span className="eyebrow">COMPLETED EXCHANGE?</span><h2>Rate this seller</h2><div className="star-picker" aria-label="Rating out of five">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} stars`} className={value <= rating ? 'selected' : ''} onClick={() => setRating(value)}><Star size={22} fill="currentColor" /></button>)}</div><textarea required minLength="3" maxLength="500" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share how the exchange went…" rows="3" />{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Publishing…' : 'Publish review'}</button></form>
}

export default ReviewForm
