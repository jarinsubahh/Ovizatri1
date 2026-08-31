import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { destinations } from '../../data/mockData'
import './SearchBar.css'

// Tour package "type" is derived from destination category (Beach, Hills,
// Rivers, Mangrove Forest) since packages don't carry their own type field
// in the current data model — this keeps the filter grounded in real data
// rather than inventing an unused attribute.
const PACKAGE_TYPES = [...new Set(destinations.map((d) => d.category))]

export default function SearchBar() {
  const navigate = useNavigate()
  const [destinationID, setDestinationID] = useState('All')
  const [type, setType] = useState('All')

  function handleSubmit(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (destinationID !== 'All') params.set('destination', destinationID)
    if (type !== 'All') params.set('type', type)
    const query = params.toString()
    navigate(`/packages${query ? `?${query}` : ''}`)
  }

  return (
    <section className="search-bar-section container">
      <form className="search-card" onSubmit={handleSubmit}>
        <div className="search-field">
          <label htmlFor="search-destination">Destination</label>
          <select id="search-destination" value={destinationID} onChange={(e) => setDestinationID(e.target.value)}>
            <option value="All">All Destinations</option>
            {destinations.map((d) => (
              <option key={d.destinationID} value={d.destinationID}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="search-field">
          <label htmlFor="search-type">Tour Package Type</label>
          <select id="search-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="All">All Types</option>
            {PACKAGE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-gold search-submit">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="9" cy="9" r="6.5" />
            <line x1="14" y1="14" x2="18" y2="18" strokeLinecap="round" />
          </svg>
          Search
        </button>
      </form>
    </section>
  )
}