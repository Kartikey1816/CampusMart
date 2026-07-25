import { Heart, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

function ListingCard({ listing, isSaved = false, onSave }) {
  const Icon = listing.icon
  return <article className="listing-card"><Link to={`/listings/${listing.id}`} className="listing-card-link"><div className={`listing-image tone-${listing.tone}`}>{listing.images?.[0]?.url ? <img src={listing.images[0].url} alt={listing.title} /> : <Icon size={68} strokeWidth={1.25} aria-hidden="true" />}<span className="condition-pill">{listing.condition}</span></div><div className="listing-details"><div className="listing-category">{listing.category}</div><h3>{listing.title}</h3><div className="listing-price">₹{listing.price.toLocaleString('en-IN')}</div><div className="listing-meta"><span><ShieldCheck size={14} /> {listing.seller}</span><span>{listing.posted}</span></div></div></Link><button type="button" className={`save-listing ${isSaved ? 'saved' : ''}`} aria-label={`${isSaved ? 'Remove' : 'Save'} ${listing.title}`} onClick={() => onSave?.(listing)}><Heart size={18} fill={isSaved ? 'currentColor' : 'none'} /></button></article>
}

export default ListingCard
