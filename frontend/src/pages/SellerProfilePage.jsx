import { Star } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import { useAuth } from '../context/useAuth'
import { api } from '../services/api'
import { getListings } from '../services/listings'

function SellerProfilePage() {
  const { sellerId } = useParams()
  const { token, user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [reviews, setReviews] = useState([])
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try {
      const [profileData, reviewData, listingData] = await Promise.all([
        api(`/profile/${sellerId}`, { token }), api(`/reviews/sellers/${sellerId}`, { token }), getListings({ seller: sellerId })
      ])
      setProfile(profileData.profile); setReviews(reviewData.reviews); setListings(listingData)
    } catch (err) { setError(err.message) }
  }, [sellerId, token])
  useEffect(() => { load() }, [load])

  if (error) return <section className="detail-state"><h1>{error}</h1><Link to="/explore">Back to listings</Link></section>
  if (!profile) return <section className="detail-state"><p className="eyebrow">CAMPUSMART</p><h1>Loading seller…</h1></section>
  if (profile.id === user?.id) return <section className="detail-state"><h1>This is your seller profile.</h1><Link to="/profile">Go to my profile</Link></section>

  return <section className="seller-profile-page"><div className="seller-profile-header"><div className="profile-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : profile.name.slice(0, 1)}</div><div><span className="eyebrow">VERIFIED STUDENT SELLER</span><h1>{profile.name}</h1><p>{[profile.department, profile.year && `Year ${profile.year}`, profile.hostel].filter(Boolean).join(' · ') || 'CampusMart student'}</p><strong className="seller-rating"><Star size={17} fill="currentColor" /> {profile.ratings.average.toFixed(1)} <small>({profile.ratings.count} {profile.ratings.count === 1 ? 'review' : 'reviews'})</small></strong></div></div><section className="seller-reviews"><div className="section-heading"><div><span className="eyebrow">BUYER FEEDBACK</span><h2>Reviews</h2></div></div>{reviews.length ? <div className="review-list">{reviews.map((review) => <article key={review.id}><div className="review-avatar">{review.reviewer.avatarUrl ? <img src={review.reviewer.avatarUrl} alt="" /> : review.reviewer.name.slice(0, 1)}</div><div><strong>{review.reviewer.name}</strong><span className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span><p>{review.comment}</p></div></article>)}</div> : <p className="empty-copy">No reviews yet.</p>}</section><section><div className="section-heading"><div><span className="eyebrow">SELLER'S ITEMS</span><h2>Available listings</h2></div></div>{listings.length ? <div className="listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <p className="empty-copy">No available listings right now.</p>}</section></section>
}

export default SellerProfilePage
