import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { destinations, getDestination } from '../../data/mockData'
import { listPackages } from '../../data/store'
import '../../styles/Listing.css'

const SORTS = [
  { value: 'popular', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'duration', label: 'Duration' },
]

export default function PackageList() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [destinationFilter, setDestinationFilter] = useState(searchParams.get('destination') || 'All')
  const [sort, setSort] = useState('popular')

  const packages = listPackages()

  const filtered = useMemo(() => {
    let list = packages.filter((p) => {
      const matchesQuery = !query.trim() || p.title.toLowerCase().includes(query.toLowerCase())
      const matchesDestination = destinationFilter === 'All' || p.destinationID === destinationFilter
      return matchesQuery && matchesDestination
    })
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'duration') list = [...list].sort((a, b) => a.duration - b.duration)
    return list
  }, [packages, query, destinationFilter, sort])

  return (
    <div className="page container">
      <div className="page-header">
        <p className="eyebrow">Book</p>
        <h1>Tour packages</h1>
        <p className="section-lead">Compare packages from agencies operating across Bangladesh.</p>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search packages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search tour packages"
        />
        <select value={destinationFilter} onChange={(e) => setDestinationFilter(e.target.value)} aria-label="Filter by destination">
          <option value="All">All destinations</option>
          {destinations.map((d) => (
            <option key={d.destinationID} value={d.destinationID}>
              {d.name}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort packages">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="filter-count">{filtered.length} package{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No packages match your filters</h3>
          <p>Try clearing the destination filter or search term.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((p) => {
            const destination = getDestination(p.destinationID)
            const finalPrice = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price
            return (
              <Link to={`/packages/${p.packageID}`} key={p.packageID} className="item-card">
                <div className="item-card-media">
                  {destination && <img src={destination.image} alt={destination.name} />}
                  {p.discount > 0 && <span className="badge badge-gold item-card-badge">{p.discount}% off</span>}
                </div>
                <div className="item-card-body">
                  <h3>{p.title}</h3>
                  <span className="item-card-meta">
                    {destination?.name} &middot; {p.duration} day{p.duration > 1 ? 's' : ''}
                  </span>
                  <p className="item-card-desc">{p.description}</p>
                  <div className="item-card-footer">
                    <span className="item-card-price">
                      ৳{finalPrice.toLocaleString()}
                      <small> / person</small>
                    </span>
                    <span className="btn btn-outline btn-sm">Details</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
