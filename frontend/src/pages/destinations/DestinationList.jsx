import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { destinations } from '../../data/mockData'
import StarRating from '../../components/common/StarRating'
import '../../styles/Listing.css'

const CATEGORIES = ['All', ...new Set(destinations.map((d) => d.category))]

export default function DestinationList() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  const filtered = useMemo(() => {
    return destinations.filter((d) => {
      const matchesQuery =
        !query.trim() ||
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.division.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === 'All' || d.category === category
      return matchesQuery && matchesCategory
    })
  }, [query, category])

  return (
    <div className="page container">
      <div className="page-header">
        <p className="eyebrow">Discover</p>
        <h1>Destinations across Bangladesh</h1>
        <p className="section-lead">Browse destinations by region and category before comparing tour packages.</p>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name or division..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search destinations"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="filter-count">{filtered.length} destination{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No destinations match your search</h3>
          <p>Try a different keyword or category.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((d) => (
            <Link to={`/destinations/${d.destinationID}`} key={d.destinationID} className="item-card">
              <div className="item-card-media">
                <img src={d.image} alt={d.name} />
                <span className="badge item-card-badge">{d.category}</span>
              </div>
              <div className="item-card-body">
                <h3>{d.name}</h3>
                <span className="item-card-meta">{d.division} Division</span>
                <p className="item-card-desc">{d.description}</p>
                <div className="item-card-footer">
                  <StarRating value={d.avgRating} size={13} />
                  <span className="item-card-meta">{d.avgRating.toFixed(1)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
