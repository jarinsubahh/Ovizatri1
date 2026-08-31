import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDestination, getPackage } from '../../data/mockData'
import { listSaved, toggleSaved } from '../../data/store'
import '../../styles/Listing.css'

export default function Wishlist() {
  const { account } = useAuth()
  const uid = account.userID || account.accountID
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)
  const saved = listSaved(uid)

  function handleRemove(type, id) {
    toggleSaved(uid, type, id)
    forceUpdate()
  }

  return (
    <div className="page container">
      <div className="page-header">
        <p className="eyebrow">Your List</p>
        <h1>Wishlist</h1>
        <p className="section-lead">Destinations and tour packages you've saved for later.</p>
      </div>

      {saved.length === 0 ? (
        <div className="empty-state">
          <h3>Your wishlist is empty</h3>
          <p>Save a destination or tour package while browsing to find it here.</p>
          <Link to="/destinations" className="btn btn-primary">
            Explore Destinations
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {saved.map((s) => {
            if (s.type === 'destination') {
              const d = getDestination(s.id)
              if (!d) return null
              return (
                <div key={s.type + s.id} className="item-card wishlist-item">
                  <Link to={`/destinations/${d.destinationID}`}>
                    <div className="item-card-media">
                      <img src={d.image} alt={d.name} />
                      <span className="badge item-card-badge">Destination</span>
                    </div>
                    <div className="item-card-body">
                      <h3>{d.name}</h3>
                      <span className="item-card-meta">{d.division} Division</span>
                    </div>
                  </Link>
                  <button className="btn btn-outline btn-sm wishlist-remove" onClick={() => handleRemove('destination', d.destinationID)}>
                    Remove
                  </button>
                </div>
              )
            }

            const p = getPackage(s.id)
            if (!p) return null
            const destination = getDestination(p.destinationID)
            return (
              <div key={s.type + s.id} className="item-card wishlist-item">
                <Link to={`/packages/${p.packageID}`}>
                  <div className="item-card-media">
                    {destination && <img src={destination.image} alt={destination.name} />}
                    <span className="badge badge-river item-card-badge">Package</span>
                  </div>
                  <div className="item-card-body">
                    <h3>{p.title}</h3>
                    <span className="item-card-meta">৳{p.price.toLocaleString()}</span>
                  </div>
                </Link>
                <button className="btn btn-outline btn-sm wishlist-remove" onClick={() => handleRemove('package', p.packageID)}>
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