import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAgency, getDestination } from '../../data/mockData'
import { getPackageById, listSchedulesForPackage } from '../../data/store'
import { useAuth } from '../../context/AuthContext'
import './Booking.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const STEPS = ['Schedule', 'Review', 'Payment', 'Receipt']
const PAYMENT_METHODS = ['bKash', 'Nagad', 'Card']

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
  const [transactionId, setTransactionId] = useState('')
  const [processing, setProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentReceipt, setPaymentReceipt] = useState(null)

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

  function generateMockTrxId() {
    const random = `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    setTransactionId(`TRX-${random}`)
  }

  async function handlePayment(e) {
    e.preventDefault()

    if (!account?.token) {
      setPaymentError('Please sign in to complete the demo payment.')
      return
    }

    setProcessing(true)
    setPaymentError('')

    try {
      const payload = {
        package_id: Number(pkg.packageID),
        schedule_id: Number(scheduleID),
        group_size: Number(groupSize),
        amount: Number(total),
        payment_method: method,
        transaction_id: transactionId.trim() || undefined,
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
          <div key={s} className={'booking-step' + (i === step ? ' active' : i < step ? ' done' : '')}>
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
              <h3 style={{ marginTop: 0 }}>Demo Payment</h3>
              <p className="detail-body-text">
                Complete the payment step to confirm your tour package. This form uses the project backend and stores a mock payment record.
              </p>

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
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    id="transactionId"
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="TRX-..."
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn btn-ghost" onClick={generateMockTrxId}>
                    Generate Mock TRX ID
                  </button>
                </div>
                <span className="hint">Use a mock ID for demo checkout during evaluation.</span>
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
            <div className="card card-pad">
              <div className="booking-status-banner form-success-banner" style={{ marginBottom: 20 }}>
                <strong>Payment successful</strong>
              </div>

              <h3 style={{ marginTop: 0 }}>Booking receipt</h3>
              <div className="summary-row">
                <span>Booking status</span>
                <span>{paymentReceipt.booking?.payment_status === 'paid' ? 'CONFIRMED' : paymentReceipt.booking?.payment_status}</span>
              </div>
              <div className="summary-row">
                <span>Payment method</span>
                <span>{paymentReceipt.payment?.payment_method}</span>
              </div>
              <div className="summary-row">
                <span>Transaction ID</span>
                <span>{paymentReceipt.payment?.transaction_id}</span>
              </div>
              <div className="summary-row">
                <span>Amount paid</span>
                <span>৳{Number(paymentReceipt.payment?.amount || total).toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Booking ID</span>
                <span>{paymentReceipt.booking?.booking_id}</span>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => navigate('/packages')}>
                  Back to packages
                </button>
                <button className="btn btn-ghost" onClick={() => navigate('/')}>
                  Home
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
