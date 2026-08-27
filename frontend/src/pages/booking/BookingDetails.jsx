import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAgency, getDestination } from '../../data/mockData'
import { getBooking, getPackageById, listSchedules } from '../../data/store'
import './Booking.css'

export default function BookingDetails() {
  const { bookingId } = useParams()
  const booking = getBooking(bookingId)

  if (!booking) {
    return (
      <div className="page container">
        <div className="empty-state">
          <h3>Booking not found</h3>
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const pkg = getPackageById(booking.packageID)
  const destination = pkg && getDestination(pkg.destinationID)
  const agency = pkg && getAgency(pkg.agencyID)
  const schedule = listSchedules().find((s) => s.scheduleID === booking.scheduleID)
  const paid = booking.paymentStatus === 'paid'

  return (
    <div className="page container" style={{ maxWidth: 720 }}>
      <div className={'booking-status-banner ' + (paid ? 'form-success-banner' : 'form-error-banner')} style={{ margin: '0 0 28px' }}>
        <div>
          <strong>{paid ? 'Booking confirmed' : 'Payment pending'}</strong>
          <p style={{ margin: '4px 0 0' }}>
            Booking reference <strong>{booking.bookingID}</strong>
            {paid && booking.payment ? ` \u00b7 Transaction ${booking.payment.transactionID}` : ''}
          </p>
        </div>
      </div>

      <div className="card card-pad">
        <h2 style={{ marginTop: 0 }}>{pkg?.title}</h2>
        <p className="hint" style={{ marginBottom: 20 }}>
          {destination?.name} &middot; Operated by {agency?.agencyName}
        </p>

        <div className="summary-row">
          <span>Booking date</span>
          <span>{new Date(booking.bookingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        {schedule && (
          <>
            <div className="summary-row">
              <span>Departure</span>
              <span>{new Date(schedule.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="summary-row">
              <span>Return</span>
              <span>{new Date(schedule.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </>
        )}
        <div className="summary-row">
          <span>Group size</span>
          <span>{booking.groupSize} traveler{booking.groupSize > 1 ? 's' : ''}</span>
        </div>
        <div className="summary-row">
          <span>Payment status</span>
          <span className={'badge ' + (paid ? 'badge-success' : 'badge-error')}>{booking.paymentStatus}</span>
        </div>
        {paid && booking.payment && (
          <div className="summary-row">
            <span>Paid via</span>
            <span>{booking.payment.paymentGateway}</span>
          </div>
        )}
        <div className="summary-total">
          <span>Total amount</span>
          <span>৳{booking.totalAmount.toLocaleString()}</span>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <Link to="/dashboard" className="btn btn-outline">
            Back to Dashboard
          </Link>
          {pkg && (
            <Link to={`/packages/${pkg.packageID}`} className="btn btn-ghost">
              View Package
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
