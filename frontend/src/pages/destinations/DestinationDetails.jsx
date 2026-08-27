import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getDestination, getPackagesForDestination } from '../../data/mockData'
import { isSaved, toggleSaved } from '../../data/store'
import { useAuth } from '../../context/AuthContext'
import StarRating from '../../components/common/StarRating'
import '../../styles/Details.css'
import '../../styles/Listing.css'

export default function DestinationDetails() {
  const { destinationId } = useParams()
  const navigate = useNavigate()
  const { account } = useAuth()
  const destination = getDestination(destinationId)
  const packages = destination ? getPackagesForDestination(destination.destinationID) : []
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (account && destination) setSaved(isSaved(account.userID || account.accountID, 'destination', destination.destinationID))
  }, [account, destination])

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

  function handleSave() {
    if (!account) {
      navigate('/signin', { state: { from: { pathname: `/destinations/${destination.destinationID}` } } })
      return
    }
    const nowSaved = toggleSaved(account.userID || account.accountID, 'destination', destination.destinationID)
    setSaved(nowSaved)
  }

  return (
    <div>
      <div className="detail-hero" style={{ backgroundImage: `url(${destination.image})` }}>
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
                  <Link key={p.packageID} to={`/packages/${p.packageID}`} className="item-card">
                    <div className="item-card-body">
                      <h3>{p.title}</h3>
                      <span className="item-card-meta">{p.duration} day{p.duration > 1 ? 's' : ''}</span>
                      <div className="item-card-footer">
                        <span className="item-card-price">৳{p.price.toLocaleString()}</span>
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
                Save this destination to your dashboard or compare the tour packages offered here.
              </p>
              <button className="btn btn-block" onClick={handleSave} style={saved ? { background: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--forest-dark)' } : { background: 'var(--forest)', color: 'var(--paper)' }}>
                {saved ? 'Saved to Dashboard' : 'Save Destination'}
              </button>
              <Link to="/packages" className="btn btn-outline btn-block" style={{ marginTop: 10 }}>
                Browse All Packages
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
