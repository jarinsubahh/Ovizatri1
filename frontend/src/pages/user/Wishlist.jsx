import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { destinations as mockDestinations, getPackage } from '../../data/mockData'
import { listSaved, toggleSaved } from '../../data/store'
import '../../styles/Listing.css'

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'

export default function Wishlist() {
  const { account, role } = useAuth()
  const uid = account?.userID || account?.accountID
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)

  const [savedItems, setSavedItems] = useState([])
  const [allDestinations, setAllDestinations] = useState([])
  const [loading, setLoading] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  useEffect(() => {
    async function loadWishlistData() {
      try {
        setLoading(true)

        // 1. Fetch all live destinations from backend
        const destRes = await fetch(`${API_URL}/destinations`)
        const destData = await destRes.json()
        let fetchedDests = []
        if (destRes.ok && destData.destinations) {
          fetchedDests = destData.destinations
        }

        setAllDestinations(fetchedDests)

        // 2. Fetch backend wishlist if token exists
        let items = listSaved(uid)
        if (account?.token && role === 'user') {
          const wishRes = await fetch(`${API_URL}/wishlist`, {
            headers: { Authorization: `Bearer ${account.token}` }
          })
          const wishData = await wishRes.json()
          if (wishRes.ok && wishData.wishlist) {
            const dbDests = (wishData.wishlist.destinations || []).map((d) => ({
              userID: uid,
              type: 'destination',
              id: d.destinationID || d.destination_id
            }))
            const dbPkgs = (wishData.wishlist.packages || []).map((p) => ({
              userID: uid,
              type: 'package',
              id: p.packageID || p.package_id
            }))

            // Merge with local store
            const merged = [...items]
            ;[...dbDests, ...dbPkgs].forEach((entry) => {
              if (!merged.some((m) => m.type === entry.type && String(m.id) === String(entry.id))) {
                merged.push(entry)
                toggleSaved(uid, entry.type, entry.id)
              }
            })
            items = merged
          }
        }
        setSavedItems(items)
      } catch (err) {
        console.error('Failed loading wishlist:', err)
        setSavedItems(listSaved(uid))
      } finally {
        setLoading(false)
      }
    }

    if (uid) {
      loadWishlistData()
    } else {
      setLoading(false)
    }
  }, [uid, account, role, API_URL])

  async function handleRemove(type, id) {
    toggleSaved(uid, type, id)
    setSavedItems((prev) => prev.filter((s) => !(s.type === type && String(s.id) === String(id))))

    const numId = Number(id)
    if (!isNaN(numId) && account?.token) {
      try {
        await fetch(`${API_URL}/wishlist/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${account.token}`
          },
          body: JSON.stringify({ type, id: numId })
        })
      } catch (err) {
        console.error('Failed to sync remove with server:', err)
      }
    }

    forceUpdate()
  }

  function resolveDestination(destId) {
    // Check PostgreSQL destinations first
    const fromApi = allDestinations.find(
      (d) => String(d.destinationID || d.destination_id) === String(destId)
    )
    if (fromApi) {
      const match = mockDestinations.find(
        (m) => m.name.toLowerCase() === (fromApi.name || '').toLowerCase()
      )
      return {
        ...fromApi,
        destinationID: fromApi.destinationID || fromApi.destination_id,
        image: fromApi.image || fromApi.image_url || match?.image || DEFAULT_IMG
      }
    }

    // Fallback to mockData
    const fromMock = mockDestinations.find((m) => String(m.destinationID) === String(destId))
    return fromMock || null
  }

  if (loading) {
    return (
      <div className="page container">
        <p className="hint">Loading your wishlist...</p>
      </div>
    )
  }

  return (
    <div className="page container">
      <div className="page-header">
        <p className="eyebrow">Your List</p>
        <h1>Wishlist</h1>
        <p className="section-lead">Destinations and tour packages you've saved for later.</p>
      </div>

      {savedItems.length === 0 ? (
        <div className="empty-state">
          <h3>Your wishlist is empty</h3>
          <p>Save a destination or tour package while browsing to find it here.</p>
          <Link to="/destinations" className="btn btn-primary">
            Explore Destinations
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {savedItems.map((s) => {
            if (s.type === 'destination') {
              const d = resolveDestination(s.id)
              if (!d) return null
              return (
                <div key={`dest-${s.id}`} className="item-card wishlist-item">
                  <Link to={`/destinations/${d.destinationID}`}>
                    <div className="item-card-media">
                      <img src={d.image || DEFAULT_IMG} alt={d.name} />
                      <span className="badge item-card-badge">Destination</span>
                    </div>
                    <div className="item-card-body">
                      <h3>{d.name}</h3>
                      <span className="item-card-meta">{d.division} Division</span>
                    </div>
                  </Link>
                  <button
                    className="btn btn-outline btn-sm wishlist-remove"
                    onClick={() => handleRemove('destination', d.destinationID)}
                  >
                    Remove
                  </button>
                </div>
              )
            }

            const p = getPackage(s.id)
            if (!p) return null
            const dest = resolveDestination(p.destinationID)
            return (
              <div key={`pkg-${s.id}`} className="item-card wishlist-item">
                <Link to={`/packages/${p.packageID}`}>
                  <div className="item-card-media">
                    <img src={dest?.image || DEFAULT_IMG} alt={dest?.name || p.title} />
                    <span className="badge badge-river item-card-badge">Package</span>
                  </div>
                  <div className="item-card-body">
                    <h3>{p.title}</h3>
                    <span className="item-card-meta">৳{p.price.toLocaleString()}</span>
                  </div>
                </Link>
                <button
                  className="btn btn-outline btn-sm wishlist-remove"
                  onClick={() => handleRemove('package', p.packageID)}
                >
                  Remove
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}