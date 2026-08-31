import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tourPackages, getDestination, getAgency, getReviewsForPackage } from '../../data/mockData'
import { isSaved, toggleSaved } from '../../data/store'
import { useAuth } from '../../context/AuthContext'
import './FeaturedPackages.css'

function averageRating(packageID) {
  const reviews = getReviewsForPackage(packageID)
  if (reviews.length === 0) return null
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
}

const FEATURED_IDS = ['PKG-01', 'PKG-02', 'PKG-03', 'PKG-04']
const featured = FEATURED_IDS.map((id) => tourPackages.find((p) => p.packageID === id)).filter(Boolean)

export default function FeaturedPackages() {
  const { account } = useAuth()
  const navigate = useNavigate()
  const [savedMap, setSavedMap] = useState({})

  useEffect(() => {
    if (!account) {
      setSavedMap({})
      return
    }
    const uid = account.userID || account.accountID
    const map = {}
    featured.forEach((p) => {
      map[p.packageID] = isSaved(uid, 'package', p.packageID)
    })
    setSavedMap(map)
  }, [account])

  function handleWishlist(e, packageID) {
    e.preventDefault()
    e.stopPropagation()
    if (!account) {
      navigate('/signin', { state: { from: { pathname: '/' } } })
      return
    }
    const uid = account.userID || account.accountID
    const nowSaved = toggleSaved(uid, 'package', packageID)
    setSavedMap((m) => ({ ...m, [packageID]: nowSaved }))
  }

  return (
    <section className="featured-packages container">
      <div className="section-head">
        <div>
          <p className="eyebrow">Curated for you</p>
          <h2>Featured Tour Packages</h2>
          <p className="section-lead">A selection of well-reviewed packages from agencies across the country.</p>
        </div>
        <Link to="/packages" className="btn btn-outline">
          Browse All Packages
        </Link>
      </div>

      <div className="featured-packages-grid">
        {featured.map((p) => {
          const destination = getDestination(p.destinationID)
          const agency = getAgency(p.agencyID)
          const rating = averageRating(p.packageID)
          const finalPrice = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price
          const saved = Boolean(savedMap[p.packageID])

          return (
            <Link to={`/packages/${p.packageID}`} key={p.packageID} className="pkg-card">
              <div className="pkg-card-media">
                {destination && <img src={destination.image} alt={destination.name} loading="lazy" />}
                <button
                  type="button"
                  className={'pkg-wishlist-btn' + (saved ? ' active' : '')}
                  onClick={(e) => handleWishlist(e, p.packageID)}
                  aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
                  aria-pressed={saved}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 21s-7.5-4.6-10-9.3C0.3 8 1.8 4.5 5.2 3.7 7.6 3.1 10 4.2 12 6.4c2-2.2 4.4-3.3 6.8-2.7 3.4 0.8 4.9 4.3 3.2 8-2.5 4.7-10 9.3-10 9.3Z" />
                  </svg>
                </button>
                {p.discount > 0 && <span className="badge badge-gold pkg-card-badge">{p.discount}% off</span>}
              </div>
              <div className="pkg-card-body">
                <span className="pkg-card-agency">{agency?.agencyName}</span>
                <h3>{p.title}</h3>
                <span className="pkg-card-meta">
                  {destination?.name} &middot; {p.duration} day{p.duration > 1 ? 's' : ''}
                </span>
                {rating !== null && (
                  <div className="pkg-card-rating">
                    <svg viewBox="0 0 20 20" width="14" height="14" fill="#c9a15a" aria-hidden="true">
                      <path d="M10 1.5l2.55 5.4 5.95.62-4.45 4.05 1.24 5.93L10 14.7l-5.29 2.8 1.24-5.93L1.5 7.52l5.95-.62L10 1.5z" />
                    </svg>
                    <span>{rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="pkg-card-footer">
                  <span className="pkg-card-price">
                    ৳{finalPrice.toLocaleString()}
                    <small> / person</small>
                  </span>
                  <span className="btn btn-outline btn-sm">View</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}