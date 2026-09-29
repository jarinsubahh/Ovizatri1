import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import { getDestination } from '../../data/mockData'
import { deletePackage, listPackagesByAgency, listSchedulesForPackage } from '../../data/store'
import '../../components/layout/DashboardShell.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const NAV_ITEMS = [
  { to: '/agency/dashboard', label: 'Overview', exact: true },
  { to: '/agency/packages', label: 'Tour Packages' },
  { to: '/agency/profile', label: 'Agency Profile' },
]

export default function AgencyPackageManagement() {
  const { account } = useAuth()
  const agency = account.agency
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadPackages() {
      try {
        const response = await fetch(`${API_URL}/packages/agency/my-packages`, {
          headers: { Authorization: `Bearer ${account?.token}` },
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Failed to load agency packages.')

        const packageRows = Array.isArray(data)
          ? data
          : Array.isArray(data.packages)
            ? data.packages
            : Array.isArray(data.data)
              ? data.data
              : Array.isArray(data.data?.packages)
                ? data.data.packages
                : []

        if (active) {
          setPackages(packageRows.map((p) => ({
            ...p,
            packageID: p.packageID ?? p.package_id,
            destinationID: p.destinationID ?? p.destination_id,
            maxSeat: p.maxSeat ?? p.max_seat,
            destinationName: p.destinationName ?? p.destination_name,
            totalSeatsBooked: p.totalSeatsBooked ?? p.total_seats_booked ?? 0,
            seatsRemaining: p.seatsRemaining ?? p.seats_remaining,
            totalRevenueEarned: p.totalRevenueEarned ?? p.total_revenue_earned ?? 0,
            pendingRequests: p.pendingRequests ?? p.pending_requests ?? 0,
          })))
        }
      } catch (fetchError) {
        if (active) setError(fetchError.message || 'Failed to load agency packages.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPackages()
    return () => { active = false }
  }, [account?.token])

  function handleDelete(id) {
    if (!window.confirm('Remove this tour package? This also removes it from public listings.')) return
    deletePackage(id)
    forceUpdate()
  }

  return (
    <DashboardShell title={agency.agencyName} subtitle="Agency" items={NAV_ITEMS}>
      <div className="dash-section-title">
        <h1>Tour Packages</h1>
        <Link to="/agency/packages/new" className="btn btn-primary btn-sm">
          Add Tour Package
        </Link>
      </div>

      {loading ? (
        <div className="card card-pad">Loading packages...</div>
      ) : error ? (
        <div className="form-error-banner">{error}</div>
      ) : packages.length === 0 ? (
        <div className="empty-state card">
          <h3>No tour packages yet</h3>
          <p>Create your first package so travelers can discover and book it.</p>
          <Link to="/agency/packages/new" className="btn btn-primary">
            Add Tour Package
          </Link>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Destination</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Schedules</th>
                <th>Booked</th>
                <th>Remaining</th>
                <th>Revenue</th>
                <th>Pending</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => {
                const destination = p.destinationName || getDestination(p.destinationID)?.name
                const schedules = listSchedulesForPackage(p.packageID)
                return (
                  <tr key={p.packageID}>
                    <td>{p.title}</td>
                    <td>{destination}</td>
                    <td>৳{Number(p.price || 0).toLocaleString('en-BD')}</td>
                    <td>{p.duration} day{p.duration > 1 ? 's' : ''}</td>
                    <td>{schedules.length}</td>
                    <td>{Number(p.totalSeatsBooked || 0).toLocaleString('en-BD')}</td>
                    <td>{Number(p.seatsRemaining ?? p.maxSeat ?? 0).toLocaleString('en-BD')}</td>
                    <td>৳{Number(p.totalRevenueEarned || 0).toLocaleString('en-BD')}</td>
                    <td>{Number(p.pendingRequests || 0).toLocaleString('en-BD')}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/packages/${p.packageID}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                      <Link to={`/agency/packages/${p.packageID}/edit`} className="btn btn-ghost btn-sm">
                        Edit
                      </Link>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.packageID)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  )
}
