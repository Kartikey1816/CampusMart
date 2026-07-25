import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import { listingCategories } from '../data/mockListings'
import { getListings } from '../services/listings'

function ExplorePage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(() => params.get('q') || '')
  const [category, setCategory] = useState(() => listingCategories.includes(params.get('category')) ? params.get('category') : 'All')
  const [sort, setSort] = useState('Newest')
  const [filters, setFilters] = useState({ condition: 'All', minPrice: '', maxPrice: '' })
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [listings, setListings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const query = params.get('q') || ''
    const nextCategory = params.get('category')
    setSearch(query)
    setCategory(listingCategories.includes(nextCategory) ? nextCategory : 'All')
  }, [params])
  useEffect(() => {
    let active = true
    setIsLoading(true)
    const timeout = window.setTimeout(() => {
      getListings({ search, category, sort, ...filters }).then((items) => { if (active) setListings(items) }).finally(() => { if (active) setIsLoading(false) })
    }, 200)
    return () => { active = false; window.clearTimeout(timeout) }
  }, [category, filters, search, sort])
  const updateSearch = (value) => { setSearch(value); setParams((current) => { const next = new URLSearchParams(current); if (value.trim()) next.set('q', value); else next.delete('q'); return next }, { replace: true }) }
  const updateCategory = (value) => { setCategory(value); setParams((current) => { const next = new URLSearchParams(current); if (value === 'All') next.delete('category'); else next.set('category', value); return next }, { replace: true }) }

  const hasFilters = filters.condition !== 'All' || filters.minPrice !== '' || filters.maxPrice !== ''
  const clearFilters = () => { updateSearch(''); updateCategory('All'); setFilters({ condition: 'All', minPrice: '', maxPrice: '' }) }
  return <section className="explore-page"><div className="explore-heading"><div><span className="eyebrow">CAMPUS LISTINGS</span><h1>Find your next good thing.</h1><p>Browse deals posted by verified students at your college.</p></div><span className="verified-count">✓ Student-only marketplace</span></div><div className="explore-toolbar"><label className="listing-search"><Search size={19} /><input type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search listings, e.g. books" /><button type="button" aria-label="Clear search" className={search ? '' : 'visually-hidden'} onClick={() => updateSearch('')}><X size={16} /></button></label><label className="sort-select"><span>Sort:</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Newest</option><option>Price: low to high</option><option>Price: high to low</option></select><ChevronDown size={15} /></label><button type="button" className={`filter-button ${hasFilters ? 'active' : ''}`} onClick={() => setIsFiltersOpen(!isFiltersOpen)}><SlidersHorizontal size={17} /> Filters{hasFilters ? ' · Active' : ''}</button></div>{isFiltersOpen && <div className="filters-panel"><label>Condition<select value={filters.condition} onChange={(event) => setFilters({ ...filters, condition: event.target.value })}><option value="All">Any condition</option><option value="new">New</option><option value="like-new">Like new</option><option value="good">Good</option><option value="fair">Fair</option></select></label><label>Minimum price<input type="number" min="0" value={filters.minPrice} onChange={(event) => setFilters({ ...filters, minPrice: event.target.value })} placeholder="₹ 0" /></label><label>Maximum price<input type="number" min="0" value={filters.maxPrice} onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value })} placeholder="No limit" /></label><button type="button" className="clear-filter-button" onClick={() => setFilters({ condition: 'All', minPrice: '', maxPrice: '' })}>Reset filters</button></div>}<div className="category-pills" aria-label="Listing categories">{listingCategories.map((item) => <button type="button" key={item} className={category === item ? 'active' : ''} onClick={() => updateCategory(item)}>{item}</button>)}</div><div className="results-line"><strong>{listings.length} listings</strong><span>from students on your campus</span></div>{isLoading ? <div className="empty-results"><p>Loading listings…</p></div> : listings.length ? <div className="listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <div className="empty-results"><Search size={30} /><h2>No matches found</h2><p>Try a different search or category.</p><button type="button" onClick={clearFilters}>Clear filters</button></div>}</section>
}

export default ExplorePage
