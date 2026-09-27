import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAgency, getDestination } from '../../data/mockData'
import { getPackageById, listSchedulesForPackage } from '../../data/store'
import { useAuth } from '../../context/AuthContext'
import './Booking.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const STEPS = ['Schedule', 'Review', 'Payment', 'Receipt']
const PAYMENT_METHODS = ['bKash', 'Nagad', 'Card']

function createMockTransactionId() {
  const stamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `TRX-${stamp}-${random}`
}

export default function BookingFlow() {
  const { packageId } = useParams()
  const navigate = useNavigate()
  const { account } = useAuth()
  const pkg = getPackageById(packageId)
  const schedules = pkg ? listSchedulesForPackage(pkg.packageID) : []

  const [step, setStep] = useState(0)
  const [scheduleID, setScheduleID] = useState(schedules[0]?.scheduleID || '')
  const [groupSize, setGroupSize] = useState(1)
  const [method, setMethod] = useState('bKash')
  const [transactionId, setTransactionId] = useState(() => createMockTransactionId())
  const [processing, setProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentReceipt, setPaymentReceipt] = useState(null)

  useEffect(() => {
    if (!transactionId) {
      setTransactionId(createMockTransactionId())
    }
  }, [transactionId])

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
  const unitPrice = pkg.discount ? Math.round(pkg.price * (1 - pkg.discount / 100)) : pkg.price
  const total = unitPrice * groupSize
  const selectedSchedule = schedules.find((s) => s.scheduleID === scheduleID)

  function goToReview(e) {
    e.preventDefault()
    setStep(1)
  }

  function confirmBooking() {
    setStep(2)
  }

  const handleStepClick = (targetStep) => {
    setStep(targetStep)
  }

  async function handlePayment(e) {
    e.preventDefault()

    if (!account?.token) {
      setPaymentError('Please sign in to complete the demo payment.')
      return
    }

    setProcessing(true)
    setPaymentError('')

    const safePackageId = Number(pkg?.packageID ?? packageId ?? 1)
    const safeScheduleId = Number(scheduleID || schedules?.[0]?.scheduleID || 1)
    const safeGroupSize = Number(groupSize || 1)

    try {
      const payload = {
        package_id: safePackageId,
        schedule_id: safeScheduleId,
        group_size: safeGroupSize,
        amount: Number(total),
        payment_method: method,
        transaction_id: transactionId.trim() || createMockTransactionId(),
      }

      const response = await fetch(`${API_URL}/bookings/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account.token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Demo payment failed.')
      }

      setPaymentReceipt(data)
      setStep(3)
    } catch (error) {
      setPaymentError(error.message || 'Could not complete the demo payment.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="page container">
      <div className="page-header">
        <p className="eyebrow">Booking</p>
        <h1>{pkg.title}</h1>
        <p className="section-lead">
          {destination?.name} &middot; Operated by {agency?.agencyName}
        </p>
      </div>

      <div className="booking-steps">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={'booking-step' + (i === step ? ' active' : i < step ? ' done' : '')}
            onClick={() => handleStepClick(i)}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleStepClick(i)
              }
            }}
          >
            {i + 1}. {s}
          </div>
        ))}
      </div>

      <div className="booking-layout">
        <div>
          {step === 0 && (
            <form onSubmit={goToReview} className="card card-pad">
              <h3 style={{ marginTop: 0 }}>Choose a departure</h3>
              {schedules.length === 0 ? (
                <p className="detail-body-text">This agency hasn't published a schedule yet — check back soon.</p>
              ) : (
                schedules.map((s) => (
                  <label key={s.scheduleID} className={'schedule-option' + (scheduleID === s.scheduleID ? ' selected' : '')}>
                    <span>
                      <input
                        type="radio"
                        name="schedule"
                        value={s.scheduleID}
                        checked={scheduleID === s.scheduleID}
                        onChange={() => setScheduleID(s.scheduleID)}
                      />
                      Departs {new Date(s.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="hint">Returns {new Date(s.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </label>
                ))
              )}

              <div className="field" style={{ maxWidth: 200, marginTop: 18 }}>
                <label htmlFor="groupSize">Group size</label>
                <input
                  id="groupSize"
                  type="number"
                  min={1}
                  max={pkg.maxSeat}
                  value={groupSize}
                  onChange={(e) => setGroupSize(Math.max(1, Math.min(pkg.maxSeat, Number(e.target.value))))}
                />
                <span className="hint">Max {pkg.maxSeat} per departure</span>
              </div>

              <button type="submit" className="btn btn-primary" disabled={!scheduleID}>
                Continue to Review
              </button>
            </form>
          )}

          {step === 1 && (
            <div className="card card-pad">
              <h3 style={{ marginTop: 0 }}>Review your booking</h3>
              <div className="summary-row">
                <span>Package</span>
                <span>{pkg.title}</span>
              </div>
              <div className="summary-row">
                <span>Departure</span>
                <span>{selectedSchedule && new Date(selectedSchedule.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="summary-row">
                <span>Return</span>
                <span>{selectedSchedule && new Date(selectedSchedule.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="summary-row">
                <span>Group size</span>
                <span>{groupSize} traveler{groupSize > 1 ? 's' : ''}</span>
              </div>
              <div className="summary-row">
                <span>Price per person</span>
                <span>৳{unitPrice.toLocaleString()}</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>৳{total.toLocaleString()}</span>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn btn-ghost" onClick={() => setStep(0)}>
                  Back
                </button>
                <button className="btn btn-primary" onClick={confirmBooking}>
                  Confirm Booking
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <form className="card card-pad" onSubmit={handlePayment}>
              <h3 style={{ marginTop: 0 }}>Payment</h3>

              <div className="payment-methods" role="radiogroup" aria-label="Payment method selector">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={'payment-method' + (method === m ? ' selected' : '')}
                    onClick={() => setMethod(m)}
                    aria-pressed={method === m}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="field" style={{ marginBottom: 16 }}>
                <label htmlFor="transactionId">Transaction ID</label>
                <input
                  id="transactionId"
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="TRX-..."
                />
              </div>

              <div className="summary-total" style={{ marginBottom: 16 }}>
                <span>Amount payable</span>
                <span>৳{total.toLocaleString()}</span>
              </div>

              {paymentError && (
                <div className="form-error-banner" style={{ marginBottom: 16 }}>
                  {paymentError}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={processing}>
                {processing ? 'Processing...' : 'Confirm & Pay'}
              </button>
            </form>
          )}

          {step === 3 && paymentReceipt && (
            <div className="card card-pad ticket-slip-card">
              <div className="ticket-success-banner">
                <div className="ticket-checkmark">✓</div>
                <div>
                  <div className="ticket-success-title">Payment Completed &amp; Tour Package Booked!</div>
                  <div className="ticket-status-badge">Confirmed</div>
                </div>
              </div>

              <div className="ticket-slip">
                <div className="ticket-slip-header">
                  <div>
                    <span className="ticket-brand">OVIZATRI</span>
                    <p>Travel Booking Voucher</p>
                  </div>
                  <div className="ticket-slip-code">E-TICKET</div>
                </div>

                <div className="ticket-divider" aria-hidden="true" />

                <div className="ticket-slip-body">
                  <div className="ticket-row">
                    <span>Booking / Ticket No.</span>
                    <strong>{paymentReceipt.booking?.booking_id || 'BKG-NEW'}</strong>
                  </div>
                  <div className="ticket-row">
                    <span>Transaction ID</span>
                    <strong>{paymentReceipt.payment?.transaction_id || transactionId}</strong>
                  </div>

                  <div className="ticket-grid">
                    <div className="ticket-metric">
                      <span>Package</span>
                      <strong>{pkg.title}</strong>
                    </div>
                    <div className="ticket-metric">
                      <span>Destination</span>
                      <strong>{destination?.name || 'Tour Destination'}</strong>
                    </div>
                    <div className="ticket-metric">
                      <span>Duration</span>
                      <strong>{pkg.duration} day{pkg.duration > 1 ? 's' : ''}</strong>
                    </div>
                    <div className="ticket-metric">
                      <span>Customer</span>
                      <strong>{account?.fullname || account?.username || account?.email || 'Guest Traveller'}</strong>
                    </div>
                    <div className="ticket-metric">
                      <span>Payment Method</span>
                      <strong>{paymentReceipt.payment?.payment_method || method}</strong>
                    </div>
                    <div className="ticket-metric">
                      <span>Status</span>
                      <strong>Paid</strong>
                    </div>
                    <div className="ticket-metric">
                      <span>Travelers</span>
                      <strong>{groupSize}</strong>
                    </div>
                    <div className="ticket-metric ticket-price-box">
                      <span>Amount Paid</span>
                      <strong>৳{Number(paymentReceipt.payment?.amount || total).toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="ticket-meta-row">
                    <span>Date &amp; Time of Booking</span>
                    <strong>
                      {new Date(paymentReceipt.payment?.payment_date || Date.now()).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </strong>
                  </div>
                </div>

                <div className="ticket-barcode" aria-hidden="true">
                  <span>||||||||||||||||||||||||||||||||||||||||||||||||</span>
                </div>
              </div>

              <div className="ticket-actions">
                <button className="btn btn-primary" onClick={() => window.print()}>
                  Download / Print Ticket Slip
                </button>
                <button className="btn btn-ghost" onClick={() => navigate('/dashboard/bookings')}>
                  View All Bookings
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="card card-pad">
          <h4 style={{ marginTop: 0 }}>{pkg.title}</h4>
          <p className="hint">{destination?.name}</p>
          <div className="summary-row">
            <span>Duration</span>
            <span>{pkg.duration} day{pkg.duration > 1 ? 's' : ''}</span>
          </div>
          <div className="summary-row">
            <span>Group size</span>
            <span>{groupSize}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>৳{total.toLocaleString()}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
