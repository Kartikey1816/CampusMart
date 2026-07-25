import { ArrowRight, BookOpen, Headphones, Laptop, Search, Shirt, Sparkles, Trophy } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ListingCard from '../components/ListingCard'
import { getListings } from '../services/listings'

const categories = [
  { name: 'Books', icon: BookOpen }, { name: 'Electronics', icon: Laptop },
  { name: 'Hostel', icon: Sparkles }, { name: 'Fashion', icon: Shirt },
  { name: 'Sports', icon: Trophy }, { name: 'More', icon: Headphones },
]

function HomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [listings, setListings] = useState([])
  useEffect(() => { getListings().then(setListings) }, [])
  const submitSearch = (event) => { event.preventDefault(); navigate(`/explore${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`) }
  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">ONLY FOR YOUR CAMPUS</span>
          <h1>Buy smart.<br /><em>Sell simply.</em></h1>
          <p>Discover useful things from verified students, right where you study.</p>
          <form className="hero-search" onSubmit={submitSearch}><Search size={20} /><input aria-label="Search listings" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search books, cycles, calculators..." /><button>Search</button></form>
          <div className="trust-line"><span>✓</span> Every member is a verified college student</div>
        </div>
        <aside className="hero-card">
          <div className="floating-tag tag-top">Trending now <span>↗</span></div>
          <div className="product-orb"><Laptop size={74} strokeWidth={1.2} /></div>
          <p>Start exploring</p><strong>Things students love</strong>
          <div className="hero-card-footer"><span>2,400+ listings</span><ArrowRight size={19} /></div>
        </aside>
      </section>

      <section className="content-section category-section">
        <div className="section-heading"><div><span className="eyebrow">BROWSE WITH EASE</span><h2>What are you looking for?</h2></div><Link to="/explore">View all <ArrowRight size={17} /></Link></div>
        <div className="category-grid">{categories.map(({ name, icon: Icon }) => <Link to={name === 'More' ? '/explore' : `/explore?category=${encodeURIComponent(name)}`} className="category-card" key={name}><Icon size={24} /><span>{name}</span></Link>)}</div>
      </section>

      <section className="content-section featured-listings">
        <div className="section-heading"><div><span className="eyebrow">FRESH ON CAMPUS</span><h2>Recently listed</h2></div><Link to="/explore">Browse all <ArrowRight size={17} /></Link></div>
        <div className="listing-grid home-listing-grid">{listings.slice(0, 3).map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
      </section>

      <section className="content-section quick-start">
        <span className="eyebrow">THE CAMPUS DIFFERENCE</span>
        <h2>Good finds, good prices,<br />people from your campus.</h2>
        <div className="benefit-grid">
          <article><span className="benefit-number">01</span><h3>Verified community</h3><p>Connect only with fellow students from your college.</p></article>
          <article><span className="benefit-number">02</span><h3>Easy campus pickup</h3><p>Find a convenient public spot and exchange in person.</p></article>
          <article><span className="benefit-number">03</span><h3>Give things a second life</h3><p>Save money and reduce waste with every listing.</p></article>
        </div>
      </section>
    </>
  )
}

export default HomePage
