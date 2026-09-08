import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import StarRating from '../../components/common/StarRating'
import { destinations as fallbackDestinations } from '../../data/mockData'
import '../../styles/Listing.css'

const DIVISIONS = ['Dhaka', 'Chattogram', 'Khulna', 'Rajshahi', 'Rangpur', 'Barishal', 'Sylhet', 'Mymensingh']
const CATEGORIES = ['Beach', 'Hills', 'Rivers', 'Mangrove Forest', 'Heritage', 'Wildlife']

export default function DestinationList() {
  const { account, role } = useAuth()
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  // Modal State for Admin Creation
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    division: 'Chattogram',
    category: 'Hills',
    description: '',
    avg_rating: 4.8,
    image_url: '',
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  const fetchDestinations = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/destinations`)
      const data = await res.json()
      if (res.ok && Array.isArray(data.destinations) && data.destinations.length > 0) {
        // Map database records and fill fallback images if null
        const combined = data.destinations.map((d) => {
          const match = fallbackDestinations.find((f) => f.name.toLowerCase() === d.name.toLowerCase())
          return {
            ...d,
            image: d.image || match?.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          }
        })
        setDestinations(combined)
      } else {
        setDestinations(fallbackDestinations)
      }
    } catch (err) {
      console.error('Failed to load from API, using fallback data:', err)
      setDestinations(fallbackDestinations)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDestinations()
  }, [])

  const filtered = useMemo(() => {
    return destinations.filter((d) => {
      const matchesQuery =
        !query.trim() ||
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.division.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === 'All' || d.category === category
      return matchesQuery && matchesCategory
    })
  }, [destinations, query, category])

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleCreateDestination(e) {
    e.preventDefault()
    setFormError('')

    if (!form.name.trim() || !form.description.trim()) {
      setFormError('Destination name and description are required.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch(`${API_URL}/destinations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account?.token}`,
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        setFormError(data.message || 'Failed to create destination.')
        return
      }

      // Close modal, reset form, and re-fetch list
      setIsModalOpen(false)
      setForm({
        name: '',
        division: 'Chattogram',
        category: 'Hills',
        description: '',
        avg_rating: 4.8,
        image_url: '',
      })
      await fetchDestinations()
    } catch (err) {
      setFormError('Server connection error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="eyebrow">Discover</p>
          <h1>Destinations across Bangladesh</h1>
          <p className="section-lead">Browse destinations by region and category before comparing tour packages.</p>
        </div>

        {/* ADMIN ACTION: Add Destination */}
        {role === 'admin' && (
          <button className="btn btn-gold" onClick={() => setIsModalOpen(true)}>
            + Create Destination Card
          </button>
        )}
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
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="filter-count">{filtered.length} destination{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <p className="hint">Loading destinations...</p>
      ) : filtered.length === 0 ? (
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
                  <StarRating value={Number(d.avgRating) || 5} size={13} />
                  <span className="item-card-meta">{Number(d.avgRating || 5).toFixed(1)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CREATE DESTINATION MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 20, 15, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="card card-pad"
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--paper)',
              boxShadow: 'var(--shadow-pop)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Create Destination Card</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsModalOpen(false)}>
                ✕ Close
              </button>
            </div>

            {formError && <div className="form-error-banner">{formError}</div>}

            <form onSubmit={handleCreateDestination}>
              <div className="field">
                <label htmlFor="destName">Destination Name *</label>
                <input
                  id="destName"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Tanguar Haor"
                  required
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="destDivision">Division *</label>
                  <select id="destDivision" name="division" value={form.division} onChange={handleFormChange}>
                    {DIVISIONS.map((div) => (
                      <option key={div} value={div}>
                        {div}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="destCategory">Category *</label>
                  <select id="destCategory" name="category" value={form.category} onChange={handleFormChange}>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="destRating">Initial Rating (0 - 5)</label>
                  <input
                    id="destRating"
                    name="avg_rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.avg_rating}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="field">
                  <label htmlFor="destImage">Image URL (Direct link)</label>
                  <input
                    id="destImage"
                    name="image_url"
                    value={form.image_url}
                    onChange={handleFormChange}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="destDesc">Description *</label>
                <textarea
                  id="destDesc"
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Highlight unique experiences, scenic sights, or activities..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving to Database...' : 'Save Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}