import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { destinations as mockDestinations, getAgency, getAmenitiesByIds, getDestination } from '../../data/mockData'
import { getPackageById, isSaved, listSchedulesForPackage, toggleSaved } from '../../data/store'
import { useAuth } from '../../context/AuthContext'
import StarRating from '../../components/common/StarRating'
import '../../styles/Details.css'

const DEFAULT_BG = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80'

export default function PackageDetails() {
  const { packageId } = useParams()
  const navigate = useNavigate()
  const { account, role } = useAuth()
  const pkg = getPackageById(packageId)

  const [saved, setSaved] = useState(false)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  // Review Form States
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const numericPackageId = Number(String(packageId).replace(/[^0-9]/g, '')) || 1

  useEffect(() => {
    if (account && pkg) {
      setSaved(isSaved(account.userID || account.accountID, 'package', pkg.packageID))
    }
  }, [account, pkg])

  // Fetch reviews from live database
  const fetchReviews = async () => {
    try {
      setLoadingReviews(true)
      const res = await fetch(`${API_URL}/reviews/package/${numericPackageId}`, {
        headers: account?.token ? { Authorization: `Bearer ${account.token}` } : {},
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.data)) {
        setReviews(data.data)
      }
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setLoadingReviews(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [packageId, account?.token])

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

  // Robust destination & cover image resolution
  const matchedDest =
    getDestination(pkg.destinationID) ||
    mockDestinations.find(
      (d) =>
        String(d.destinationID) === String(pkg.destinationID) ||
        String(d.destinationID).replace(/\D/g, '') === String(pkg.destinationID).replace(/\D/g, '') ||
        (pkg.destinationName && d.name.toLowerCase() === pkg.destinationName.toLowerCase())
    )

  const destination = matchedDest || (pkg.destinationID ? { destinationID: pkg.destinationID, name: pkg.destinationName || 'Destination' } : null)
  const heroImage = destination?.image || pkg.image || pkg.image_url || DEFAULT_BG

  const agency = getAgency(pkg.agencyID)
  const amenities = getAmenitiesByIds(pkg.amenityIDs || [])
  const schedules = listSchedulesForPackage(pkg.packageID)
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

  // Handle Review Submission (Traveler only)
  async function handleReviewSubmit(e) {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (!comment.trim()) {
      setReviewError('Please write a brief feedback comment.')
      return
    }

    try {
      setSubmittingReview(true)
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account.token}`,
        },
        body: JSON.stringify({
          package_id: numericPackageId,
          rating,
          comment: comment.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setReviewError(data.message || 'Failed to submit review.')
        return
      }

      setReviewSuccess('Review published successfully!')
      setComment('')
      setRating(5)
      await fetchReviews()
    } catch (err) {
      setReviewError('Network error submitting review.')
    } finally {
      setSubmittingReview(false)
    }
  }

  // Handle Like / Dislike reactions
  async function handleReaction(reviewId, reactionType) {
    if (!account) {
      navigate('/signin', { state: { from: { pathname: `/packages/${pkg.packageID}` } } })
      return
    }

    if (role !== 'user') {
      alert('Only travelers can react to reviews.')
      return
    }

    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account.token}`,
        },
        body: JSON.stringify({ reaction_type: reactionType }),
      })

      const data = await res.json()
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.review_id === reviewId
              ? {
                  ...r,
                  likes: data.likes,
                  dislikes: data.dislikes,
                  user_reaction: data.user_reaction,
                }
              : r
          )
        )
      }
    } catch (err) {
      console.error('Failed to react:', err)
    }
  }

  // Handle Review Delete (Admin or Owner)
  async function handleDeleteReview(reviewId) {
    if (!window.confirm('Are you sure you want to delete this review?')) return

    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${account.token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.review_id !== reviewId))
      } else {
        alert(data.message || 'Failed to delete review.')
      }
    } catch (err) {
      alert('Failed to delete review.')
    }
  }

  const hasReviewed = reviews.some(
    (r) => Number(r.account_id) === Number(account?.accountID || account?.id)
  )

  return (
    <div>
      <div
        className="detail-hero"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundColor: 'var(--forest-dark)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
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

            {/* REVIEWS SECTION */}
            <h2>Reviews ({reviews.length})</h2>

            {/* 1. COMPACT REVIEW WRITING COMPOSER (Travelers Only) */}
            {role === 'user' && !hasReviewed && (
              <div className="review-composer">
                <div className="review-composer-header">
                  <h4>Write a Review</h4>
                  <div className="review-rating-select">
                    <span className="hint" style={{ margin: 0 }}>Rating:</span>
                    <StarRating value={rating} onChange={(val) => setRating(val)} size={18} />
                  </div>
                </div>

                {reviewError && <div className="form-error-banner" style={{ padding: '8px 12px', fontSize: '0.8rem', marginBottom: 10 }}>{reviewError}</div>}
                {reviewSuccess && <div className="form-success-banner" style={{ padding: '8px 12px', fontSize: '0.8rem', marginBottom: 10 }}>{reviewSuccess}</div>}

                <form onSubmit={handleReviewSubmit}>
                  <textarea
                    className="review-composer-input"
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts on the itinerary, transport, or guide..."
                    required
                  />

                  <div className="review-composer-footer">
                    <span className="hint" style={{ fontSize: '0.75rem', margin: 0 }}>
                      Your review will be visible to all travelers.
                    </span>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={submittingReview}>
                      {submittingReview ? 'Posting...' : 'Post Review'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {role === 'user' && hasReviewed && (
              <div className="form-success-banner" style={{ marginBottom: 24, maxWidth: 580 }}>
                ✓ You have submitted a review for this tour package.
              </div>
            )}

            {!account && (
              <div className="card card-pad" style={{ marginBottom: 24, background: 'var(--sand)', textAlign: 'center', maxWidth: 580 }}>
                <p style={{ margin: '0 0 10px', color: 'var(--ink)' }}>
                  Are you a traveler? Sign in to rate this package and share your thoughts.
                </p>
                <Link to="/signin" className="btn btn-outline btn-sm">
                  Sign In to Review
                </Link>
              </div>
            )}

            {account && role !== 'user' && (
              <p className="hint" style={{ marginBottom: 20 }}>
                (Viewing mode: Reviews are authored exclusively by registered travelers).
              </p>
            )}

            {/* 2. REVIEWS FEED */}
            {loadingReviews ? (
              <p className="hint">Loading package reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="detail-body-text">No reviews yet for this package. Be the first traveler to review!</p>
            ) : (
              <div className="review-feed">
                {reviews.map((r) => {
                  const isOwner = Number(r.account_id) === Number(account?.accountID || account?.id)
                  const isAdmin = role === 'admin'

                  return (
                    <div key={r.review_id} className="review-item">
                      <div className="review-item-head">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'var(--forest)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '0.8rem',
                            }}
                          >
                            {(r.fullname || r.reviewerName || 'T').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="review-author">{r.fullname || r.reviewerName || 'Traveler'}</span>
                            <div className="review-date">
                              {new Date(r.review_date || r.reviewDate).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>

                        {(isOwner || isAdmin) && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--error)', padding: '2px 8px' }}
                            onClick={() => handleDeleteReview(r.review_id)}
                            title="Delete this review"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <StarRating value={r.rating} size={14} />
                      </div>

                      <p className="review-comment" style={{ marginTop: 8 }}>
                        {r.comment}
                      </p>

                      <div className="review-actions-bar">
                        <button
                          type="button"
                          className={`btn-reaction ${r.user_reaction === 'like' ? 'active' : ''}`}
                          onClick={() => handleReaction(r.review_id, 'like')}
                          title="Like this review"
                        >
                          👍 <span>{r.likes || 0}</span>
                        </button>

                        <button
                          type="button"
                          className={`btn-reaction ${r.user_reaction === 'dislike' ? 'active' : ''}`}
                          onClick={() => handleReaction(r.review_id, 'dislike')}
                          title="Dislike this review"
                        >
                          👎 <span>{r.dislikes || 0}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
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
                  <span style={{ textDecoration: 'line-through', color: 'var(--ink-faint)', fontSize: '0.9rem' }}>
                    ৳{pkg.price.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="hint" style={{ marginBottom: 16 }}>per person</p>

              <button className="btn btn-primary btn-block" onClick={handleBook}>
                Book This Package
              </button>

              {(!account || account.accountType === 'user') && (
                <button
                  className="btn btn-outline btn-block"
                  style={{ marginTop: 10 }}
                  onClick={handleSave}
                >
                  {saved ? 'Saved to Dashboard' : 'Save Package'}
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}