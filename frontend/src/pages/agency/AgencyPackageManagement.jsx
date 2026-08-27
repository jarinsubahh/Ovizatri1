import React from 'react'
import { Link } from 'react-router-dom'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import { getDestination } from '../../data/mockData'
import { deletePackage, listPackagesByAgency, listSchedulesForPackage } from '../../data/store'
import '../../components/layout/DashboardShell.css'

const NAV_ITEMS = [
  { to: '/agency/dashboard', label: 'Overview', exact: true },
  { to: '/agency/packages', label: 'Tour Packages' },
  { to: '/agency/profile', label: 'Agency Profile' },
]

export default function AgencyPackageManagement() {
  const { account } = useAuth()
  const agency = account.agency
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)
  const packages = listPackagesByAgency(agency.agencyID)

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

      {packages.length === 0 ? (
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
                <th></th>
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
                    <td>৳{p.price.toLocaleString()}</td>
                    <td>{p.duration} day{p.duration > 1 ? 's' : ''}</td>
                    <td>{schedules.length}</td>
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
