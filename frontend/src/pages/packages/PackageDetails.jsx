import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAgency, getAmenitiesByIds, getDestination, getReviewsForPackage } from '../../data/mockData'
import { getPackageById, isSaved, listSchedulesForPackage, toggleSaved } from '../../data/store'
import { useAuth } from '../../context/AuthContext'
import StarRating from '../../components/common/StarRating'
import '../../styles/Details.css'

export default function PackageDetails() {
  const { packageId } = useParams()
  const navigate = useNavigate()
  const { account } = useAuth()
  const pkg = getPackageById(packageId)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (account && pkg) setSaved(isSaved(account.userID || account.accountID, 'package', pkg.packageID))
  }, [account, pkg])

  if (!pkg) {
    return (
      <div className="page container">
        <div className="empty-state">
          <h3>Tour package not found</h3>
          <Link to="/packages" className="btn btn-primary">
            Back to Packages
          </Link>
        </div>
      </div>
    )
  }

  const destination = getDestination(pkg.destinationID)
  const agency = getAgency(pkg.agencyID)
  const amenities = getAmenitiesByIds(pkg.amenityIDs || [])
  const schedules = listSchedulesForPackage(pkg.packageID)
  const reviews = getReviewsForPackage(pkg.packageID)
  const finalPrice = pkg.discount ? Math.round(pkg.price * (1 - pkg.discount / 100)) : pkg.price

  function handleSave() {
    if (!account) {
      navigate('/signin', { state: { from: { pathname: `/packages/${pkg.packageID}` } } })
      return
    }
    setSaved(toggleSaved(account.userID || account.accountID, 'package', pkg.packageID))
  }

  function handleBook() {
    if (!account) {
      navigate('/signin', { state: { from: { pathname: `/booking/${pkg.packageID}` } } })
      return
    }
    navigate(`/booking/${pkg.packageID}`)
  }

  return (
    <div>
      <div className="detail-hero" style={{ backgroundImage: destination ? `url(${destination.image})` : 'none', background: destination ? undefined : 'var(--forest-dark)' }}>
        <div className="detail-hero-scrim" />
        <div className="container detail-hero-content">
          {destination && (
            <Link to={`/destinations/${destination.destinationID}`} className="badge badge-gold">
              {destination.name}
            </Link>
          )}
          <h1>{pkg.title}</h1>
          <div className="detail-hero-meta">
            <span>{pkg.duration} day{pkg.duration > 1 ? 's' : ''}</span>
            <span>&middot;</span>
            <span>Up to {pkg.maxSeat} travelers</span>
            {agency && (
              <>
                <span>&middot;</span>
                <span>Operated by {agency.agencyName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="page container">
        <div className="detail-layout">
          <div className="detail-main">
            <h2>Overview</h2>
            <p className="detail-body-text">{pkg.description}</p>

            <h2>What's included</h2>
            <div className="amenity-list">
              {amenities.length === 0 && <p className="detail-body-text">Amenities not listed by the agency yet.</p>}
              {amenities.map((a) => (
                <span key={a.amenityID} className="amenity-chip">
                  {a.name}
                </span>
              ))}
            </div>

            <h2>Upcoming schedules</h2>
            {schedules.length === 0 ? (
              <p className="detail-body-text">No upcoming departures have been scheduled yet.</p>
            ) : (
              <div className="schedule-list">
                {schedules.map((s) => (
                  <div key={s.scheduleID} className="schedule-row">
                    <span>Departs {new Date(s.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>Returns {new Date(s.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            )}

            {agency && (
              <>
                <h2>About the agency</h2>
                <div className="card card-pad" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--forest)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    {agency.agencyName.charAt(0)}
                  </div>
                  <div>
                    <strong>{agency.agencyName}</strong>{' '}
                    {agency.status === 'verified' && <span className="badge badge-success">Verified</span>}
                    <p className="detail-body-text" style={{ margin: '6px 0 0' }}>
                      {agency.overview} &middot; {agency.experience_years} years operating.
                    </p>
                  </div>
                </div>
              </>
            )}

            <h2>Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="detail-body-text">No reviews yet for this package.</p>
            ) : (
              <div>
                {reviews.map((r) => (
                  <div key={r.reviewID} className="review-item">
                    <div className="review-item-head">
                      <span className="review-author">{r.reviewerName}</span>
                      <span className="review-date">{new Date(r.reviewDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <StarRating value={r.rating} size={13} />
                    <p className="review-comment" style={{ marginTop: 6 }}>
                      {r.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="detail-sidebar">
            <div className="card card-pad">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="item-card-price" style={{ fontSize: '1.5rem' }}>
                  ৳{finalPrice.toLocaleString()}
                </span>
                {pkg.discount > 0 && (
                  <span style={{ textDecoration: 'line-through', color: 'var(--ink-faint)', fontSize: '0.9rem' }}>৳{pkg.price.toLocaleString()}</span>
                )}
              </div>
              <p className="hint" style={{ marginBottom: 16 }}>per person</p>

              <button className="btn btn-primary btn-block" onClick={handleBook}>
                Book This Package
              </button>
              <button
                className="btn btn-outline btn-block"
                style={{ marginTop: 10 }}
                onClick={handleSave}
              >
                {saved ? 'Saved to Dashboard' : 'Save Package'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
