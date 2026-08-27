import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import { amenities, destinations } from '../../data/mockData'
import { createPackage, createSchedule, getPackageById, listSchedulesForPackage, updatePackage } from '../../data/store'
import '../../components/layout/DashboardShell.css'

const NAV_ITEMS = [
  { to: '/agency/dashboard', label: 'Overview', exact: true },
  { to: '/agency/packages', label: 'Tour Packages' },
  { to: '/agency/profile', label: 'Agency Profile' },
]

const emptyForm = {
  title: '',
  destinationID: destinations[0]?.destinationID || '',
  price: '',
  duration: 1,
  maxSeat: 10,
  discount: 0,
  description: '',
  amenityIDs: [],
}

export default function AgencyPackageForm() {
  const { packageId } = useParams()
  const navigate = useNavigate()
  const { account } = useAuth()
  const agency = account.agency
  const isEdit = Boolean(packageId)
  const existing = isEdit ? getPackageById(packageId) : null

  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [schedules, setSchedules] = useState([])
  const [newSchedule, setNewSchedule] = useState({ departureDate: '', returnDate: '' })

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        destinationID: existing.destinationID,
        price: existing.price,
        duration: existing.duration,
        maxSeat: existing.maxSeat,
        discount: existing.discount || 0,
        description: existing.description,
        amenityIDs: existing.amenityIDs || [],
      })
      setSchedules(listSchedulesForPackage(existing.packageID))
    }
  }, [existing]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isEdit && !existing) {
    return (
      <DashboardShell title={agency.agencyName} subtitle="Agency" items={NAV_ITEMS}>
        <div className="empty-state card">
          <h3>Tour package not found</h3>
        </div>
      </DashboardShell>
    )
  }

  if (isEdit && existing.agencyID !== agency.agencyID) {
    return (
      <DashboardShell title={agency.agencyName} subtitle="Agency" items={NAV_ITEMS}>
        <div className="empty-state card">
          <h3>You can only edit your own packages</h3>
        </div>
      </DashboardShell>
    )
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function toggleAmenity(id) {
    setForm((f) => ({
      ...f,
      amenityIDs: f.amenityIDs.includes(id) ? f.amenityIDs.filter((a) => a !== id) : [...f.amenityIDs, id],
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.price || !form.destinationID) {
      setError('Title, destination and price are required.')
      return
    }
    setError('')

    const payload = {
      ...form,
      price: Number(form.price),
      duration: Number(form.duration),
      maxSeat: Number(form.maxSeat),
      discount: Number(form.discount) || 0,
      agencyID: agency.agencyID,
    }

    if (isEdit) {
      updatePackage(existing.packageID, payload)
      navigate('/agency/packages')
    } else {
      const record = createPackage(payload)
      navigate(`/agency/packages/${record.packageID}/edit`)
    }
  }

  function handleAddSchedule(e) {
    e.preventDefault()
    if (!newSchedule.departureDate || !newSchedule.returnDate) return
    const record = createSchedule({ packageID: existing.packageID, ...newSchedule })
    setSchedules((s) => [...s, record])
    setNewSchedule({ departureDate: '', returnDate: '' })
  }

  return (
    <DashboardShell title={agency.agencyName} subtitle="Agency" items={NAV_ITEMS}>
      <div className="dash-section-title">
        <h1>{isEdit ? 'Edit Tour Package' : 'Add Tour Package'}</h1>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Package title</label>
            <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="Sajek Valley Cloud Retreat" />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="destinationID">Destination</label>
              <select id="destinationID" name="destinationID" value={form.destinationID} onChange={handleChange}>
                {destinations.map((d) => (
                  <option key={d.destinationID} value={d.destinationID}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="duration">Duration (days)</label>
              <input id="duration" name="duration" type="number" min="1" value={form.duration} onChange={handleChange} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="price">Price per person (৳)</label>
              <input id="price" name="price" type="number" min="0" value={form.price} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="maxSeat">Max seats per departure</label>
              <input id="maxSeat" name="maxSeat" type="number" min="1" value={form.maxSeat} onChange={handleChange} />
            </div>
          </div>

          <div className="field" style={{ maxWidth: 200 }}>
            <label htmlFor="discount">Discount (%)</label>
            <input id="discount" name="discount" type="number" min="0" max="100" value={form.discount} onChange={handleChange} />
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={4} value={form.description} onChange={handleChange} placeholder="Describe the itinerary highlights..." />
          </div>

          <div className="field">
            <label>Amenities included</label>
            <div className="amenity-list">
              {amenities.map((a) => (
                <label key={a.amenityID} className="amenity-chip" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, background: form.amenityIDs.includes(a.amenityID) ? 'var(--forest)' : undefined, color: form.amenityIDs.includes(a.amenityID) ? 'var(--paper)' : undefined, borderColor: form.amenityIDs.includes(a.amenityID) ? 'var(--forest)' : undefined }}>
                  <input
                    type="checkbox"
                    checked={form.amenityIDs.includes(a.amenityID)}
                    onChange={() => toggleAmenity(a.amenityID)}
                    style={{ width: 'auto' }}
                  />
                  {a.name}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Save Changes' : 'Create Package'}
          </button>
        </form>
      </div>

      {isEdit && (
        <div className="card card-pad">
          <h3 style={{ marginTop: 0 }}>Tour Schedules</h3>
          {schedules.length === 0 ? (
            <p className="hint">No departures scheduled yet.</p>
          ) : (
            <div className="schedule-list" style={{ marginBottom: 18 }}>
              {schedules.map((s) => (
                <div key={s.scheduleID} className="schedule-row">
                  <span>Departs {new Date(s.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>Returns {new Date(s.returnDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddSchedule} className="field-row" style={{ alignItems: 'end' }}>
            <div className="field">
              <label htmlFor="departureDate">Departure date</label>
              <input
                id="departureDate"
                type="date"
                value={newSchedule.departureDate}
                onChange={(e) => setNewSchedule((s) => ({ ...s, departureDate: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="returnDate">Return date</label>
              <input
                id="returnDate"
                type="date"
                value={newSchedule.returnDate}
                onChange={(e) => setNewSchedule((s) => ({ ...s, returnDate: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn btn-outline" style={{ marginBottom: 18 }}>
              Add Schedule
            </button>
          </form>
        </div>
      )}
    </DashboardShell>
  )
}
