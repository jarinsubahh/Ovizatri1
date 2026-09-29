import React, { useCallback, useEffect, useState } from 'react'
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
  const [packages, setPackages] = useState(() => listPackagesByAgency(agency.agencyID))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPackages = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/packages/agency/my-packages`, {
        headers: { Authorization: `Bearer ${account?.token}` },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || 'Failed to refresh package statistics.')

      const databasePackages = Array.isArray(data.packages) ? data.packages : []
      const localPackages = listPackagesByAgency(agency.agencyID)
      const databaseIds = new Set(databasePackages.map((pkg) => String(pkg.packageID ?? pkg.package_id)))
      const extraLocalPackages = localPackages.filter((pkg) => !databaseIds.has(String(pkg.packageID)))

      setPackages([...databasePackages, ...extraLocalPackages])
      setError('')
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to refresh package statistics.')
      setPackages(listPackagesByAgency(agency.agencyID))
    } finally {
      setLoading(false)
    }
  }, [account?.token, agency.agencyID])

  useEffect(() => {
    loadPackages()

    const refreshTimer = window.setInterval(loadPackages, 15000)
    window.addEventListener('focus', loadPackages)

    return () => {
      window.clearInterval(refreshTimer)
      window.removeEventListener('focus', loadPackages)
    }
  }, [loadPackages])

  function handleDelete(id) {
    if (!window.confirm('Remove this tour package? This also removes it from public listings.')) return
    deletePackage(id)
    setPackages((current) => current.filter((pkg) => String(pkg.packageID ?? pkg.package_id) !== String(id)))
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
      ) : error && packages.length === 0 ? (
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
        <div className="table-responsive card">
          <table className="data-table agency-package-table">
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => {
                const destination = getDestination(p.destinationID)
                const schedules = listSchedulesForPackage(p.packageID)
                return (
                  <tr key={p.packageID}>
                    <td>{p.title}</td>
                    <td>{destination?.name}</td>
                    <td>৳{Number(p.price || 0).toLocaleString('en-BD')}</td>
                    <td>{p.duration} day{p.duration > 1 ? 's' : ''}</td>
                    <td>{schedules.length}</td>
                    <td>{Number(p.totalSeatsBooked || 0).toLocaleString('en-BD')}</td>
                    <td>{Number(p.seatsRemaining ?? p.maxSeat ?? 0).toLocaleString('en-BD')}</td>
                    <td>৳{Number(p.totalRevenueEarned || 0).toLocaleString('en-BD')}</td>
                    <td>{Number(p.pendingRequests || 0).toLocaleString('en-BD')}</td>
                    <td>
                      <div className="agency-package-actions">
                      <Link to={`/packages/${p.packageID}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                      <Link to={`/agency/packages/${p.packageID}/edit`} className="btn btn-ghost btn-sm">
                        Edit
                      </Link>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.packageID)}>
                        Delete
                      </button>
                      </div>
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
