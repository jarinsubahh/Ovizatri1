import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { isSaved, toggleSaved } from '../../data/store'
import { useAuth } from '../../context/AuthContext'
import StarRating from '../../components/common/StarRating'
import { destinations as mockDestinations } from '../../data/mockData'
import '../../styles/Details.css'
import '../../styles/Listing.css'

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'

export default function DestinationDetails() {
  const { destinationId } = useParams()
  const navigate = useNavigate()
  const { account, role } = useAuth()

  const [destination, setDestination] = useState(null)
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  useEffect(() => {
    async function loadDestination() {
      try {
        setLoading(true)

        // 1. Fetch live database record
        const res = await fetch(`${API_URL}/destinations/${destinationId}`)
        const data = await res.json()

        if (res.ok && data.destination) {
          const d = data.destination
          const fallbackMatch = mockDestinations.find(
            (m) => m.name.toLowerCase() === (d.name || '').toLowerCase()
          )

          setDestination({
            ...d,
            destinationID: d.destinationID || d.destination_id,
            image: d.image || d.image_url || fallbackMatch?.image || DEFAULT_IMG,
            description: d.description || fallbackMatch?.description || '',
            avgRating: Number(d.avgRating || d.avg_rating || 5),
            packages: d.packages || []
          })
          setPackages(d.packages || [])
        } else {
          // 2. Fallback to mock data if ID is legacy string like DST-01
          const match = mockDestinations.find((m) => String(m.destinationID) === String(destinationId))
          if (match) {
            setDestination(match)
            setPackages([])
          } else {
            setDestination(null)
          }
        }
      } catch (err) {
        console.error('Failed to load destination:', err)
        const match = mockDestinations.find((m) => String(m.destinationID) === String(destinationId))
        setDestination(match || null)
      } finally {
        setLoading(false)
      }
    }

    loadDestination()
  }, [destinationId, API_URL])

  // Check saved state from local store and database
  useEffect(() => {
    async function checkSavedStatus() {
      if (!account || !destination) return
      const uid = account.userID || account.accountID
      const currentDestId = destination.destinationID

      // 1. First check local store
      if (isSaved(uid, 'destination', currentDestId)) {
        setSaved(true)
        return
      }

      // 2. Also check PostgreSQL backend wishlist if logged in as traveler
      if (role === 'user' && account.token) {
        try {
          const res = await fetch(`${API_URL}/wishlist`, {
            headers: { Authorization: `Bearer ${account.token}` }
          })
          const data = await res.json()
          if (res.ok && data.wishlist?.destinations) {
            const isFound = data.wishlist.destinations.some(
              (d) => String(d.destinationID || d.destination_id) === String(currentDestId)
            )
            if (isFound) {
              setSaved(true)
              toggleSaved(uid, 'destination', currentDestId)
            }
          }
        } catch (err) {
          console.error('Wishlist check error:', err)
        }
      }
    }

    checkSavedStatus()
  }, [account, destination, role, API_URL])

  async function handleSave() {
    if (!account) {
      navigate('/signin', { state: { from: { pathname: `/destinations/${destination.destinationID}` } } })
      return
    }

    if (role !== 'user') {
      alert('Only registered travelers can save destinations to their wishlist.')
      return
    }

    const uid = account.userID || account.accountID
    const targetId = Number(destination.destinationID)

    // Optimistic local state update
    const nowSaved = toggleSaved(uid, 'destination', destination.destinationID)
    setSaved(nowSaved)

    // Persist to PostgreSQL backend via wishlist API
    if (!isNaN(targetId) && account.token) {
      try {
        await fetch(`${API_URL}/wishlist/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${account.token}`
          },
          body: JSON.stringify({
            type: 'destination',
            id: targetId
          })
        })
      } catch (err) {
        console.error('Failed to sync wishlist toggle with backend:', err)
      }
    }
  }

  // Wishlist/Save is restricted to travelers (users) only
  const canSave = !account || role === 'user'

  if (loading) {
    return (
      <div className="page container">
        <p className="hint">Loading destination details...</p>
      </div>
    )
  }

  if (!destination) {
    return (
      <div className="page container">
        <div className="empty-state">
          <h3>Destination not found</h3>
          <Link to="/destinations" className="btn btn-primary">
            Back to Destinations
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        className="detail-hero"
        style={{
          backgroundImage: `url(${destination.image || DEFAULT_IMG})`,
          backgroundColor: 'var(--forest-dark)',
        }}
      >
        <div className="detail-hero-scrim" />
        <div className="container detail-hero-content">
          <span className="badge badge-gold">{destination.category}</span>
          <h1>{destination.name}</h1>
          <div className="detail-hero-meta">
            <span>{destination.division} Division</span>
            <StarRating value={destination.avgRating} />
            <span>{destination.avgRating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="page container">
        <div className="detail-layout">
          <div className="detail-main">
            <h2>About {destination.name}</h2>
            <p className="detail-body-text">{destination.description}</p>

            <h2>Tour packages to this destination</h2>
            {packages.length === 0 ? (
              <p className="detail-body-text">No agency has listed a tour package here yet.</p>
            ) : (
              <div className="related-strip">
                {packages.map((p) => (
                  <Link key={p.packageID || p.package_id} to={`/packages/${p.packageID || p.package_id}`} className="item-card">
                    <div className="item-card-body">
                      <h3>{p.title}</h3>
                      <span className="item-card-meta">{p.duration} day{p.duration > 1 ? 's' : ''}</span>
                      <div className="item-card-footer">
                        <span className="item-card-price">৳{Number(p.price).toLocaleString()}</span>
                        <span className="btn btn-outline btn-sm">View</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="detail-sidebar">
            <div className="card card-pad">
              <h3 style={{ marginTop: 0 }}>Planning a visit?</h3>
              <p className="detail-body-text" style={{ fontSize: '0.86rem' }}>
                {canSave
                  ? 'Save this destination to your dashboard or compare the tour packages offered here.'
                  : 'Compare the tour packages offered to this destination.'}
              </p>

              {canSave && (
                <button
                  className="btn btn-block"
                  onClick={handleSave}
                  style={
                    saved
                      ? { background: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--forest-dark)' }
                      : { background: 'var(--forest)', color: 'var(--paper)' }
                  }
                >
                  {saved ? 'Saved to Dashboard' : 'Save Destination'}
                </button>
              )}

              <Link to="/packages" className="btn btn-outline btn-block" style={{ marginTop: 10 }}>
                Browse All Packages
              </Link>

              {/* --- MINI MAP PREVIEW WIDGET --- */}
              <div className="destination-map-card">
                <div className="destination-map-header">
                  <span>Location Map</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${destination.name},${destination.division}, Bangladesh`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-ext-link"
                  >
                    Open in Maps ↗
                  </a>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${destination.name},${destination.division}, Bangladesh`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-frame-wrapper"
                  title="Click to view full location on Google Maps"
                >
                  <iframe
                    title={`${destination.name} Map`}
                    width="100%"
                    height="170"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      `${destination.name},${destination.division}, Bangladesh`
                    )}&t=&z=10&ie=UTF8&iwloc=&output=embed`}
                  />
                  <div className="map-overlay-badge">
                    <span>📍 View on Google Maps</span>
                  </div>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}