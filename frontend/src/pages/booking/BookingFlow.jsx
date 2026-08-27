import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAgency, getDestination } from '../../data/mockData'
import { createBooking, getPackageById, listSchedulesForPackage, recordPayment } from '../../data/store'
import { useAuth } from '../../context/AuthContext'
import './Booking.css'

const STEPS = ['Schedule', 'Review', 'Payment']
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
  const [booking, setBooking] = useState(null)
  const [method, setMethod] = useState('bKash')
  const [processing, setProcessing] = useState(false)

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
    const record = createBooking({
      userID: account.userID,
      packageID: pkg.packageID,
      scheduleID,
      bookingDate: new Date().toISOString().slice(0, 10),
      groupSize,
      totalAmount: total,
    })
    setBooking(record)
    setStep(2)
  }

  function handlePayment(e) {
    e.preventDefault()
    setProcessing(true)
    // Simulated gateway round-trip — no real payment provider is connected yet.
    setTimeout(() => {
      recordPayment(booking.bookingID, {
        amountPaid: total,
        paymentGateway: method,
        transactionID: `TXN-${Math.floor(Math.random() * 90000) + 10000}`,
      })
      setProcessing(false)
      navigate(`/bookings/${booking.bookingID}`)
    }, 700)
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

          {step === 2 && booking && (
            <form className="card card-pad" onSubmit={handlePayment}>
              <h3 style={{ marginTop: 0 }}>Payment</h3>
              <p className="detail-body-text">
                This is a placeholder payment step for the frontend prototype — no real payment gateway is connected yet.
              </p>
              <div className="payment-methods">
                {PAYMENT_METHODS.map((m) => (
                  <div key={m} className={'payment-method' + (method === m ? ' selected' : '')} onClick={() => setMethod(m)}>
                    {m}
                  </div>
                ))}
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="cardNo">Account / card number</label>
                  <input id="cardNo" placeholder="XXXX-XXXX-XXXX" required />
                </div>
                <div className="field">
                  <label htmlFor="pin">PIN</label>
                  <input id="pin" type="password" placeholder="****" required />
                </div>
              </div>
              <div className="summary-total" style={{ marginBottom: 16 }}>
                <span>Amount payable</span>
                <span>৳{total.toLocaleString()}</span>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={processing}>
                {processing ? 'Processing...' : `Pay with ${method}`}
              </button>
            </form>
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
