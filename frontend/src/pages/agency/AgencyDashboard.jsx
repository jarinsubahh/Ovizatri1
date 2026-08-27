import React from 'react'
import { Link } from 'react-router-dom'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import { listPackagesByAgency, listBookings, listSchedulesForPackage, listAuditLogForAgency } from '../../data/store'
import '../../components/layout/DashboardShell.css'

const NAV_ITEMS = [
  { to: '/agency/dashboard', label: 'Overview', exact: true },
  { to: '/agency/packages', label: 'Tour Packages' },
  { to: '/agency/profile', label: 'Agency Profile' },
]

export default function AgencyDashboard() {
  const { account } = useAuth()
  const agency = account.agency
  const packages = listPackagesByAgency(agency.agencyID)
  const bookingsForAgency = listBookings().filter((b) => packages.some((p) => p.packageID === b.packageID))
  const auditEntries = listAuditLogForAgency(agency.agencyID)
  const totalScheduled = packages.reduce((sum, p) => sum + listSchedulesForPackage(p.packageID).length, 0)

  return (
    <DashboardShell title={agency.agencyName} subtitle="Agency" items={NAV_ITEMS}>
      <div className="dash-section-title">
        <h1>Welcome back, {agency.agencyName}</h1>
        <span className={'badge ' + (agency.status === 'verified' ? 'badge-success' : 'badge-gold')}>{agency.status.replace('_', ' ')}</span>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{packages.length}</div>
          <div className="stat-label">Tour Packages</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalScheduled}</div>
          <div className="stat-label">Scheduled Departures</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookingsForAgency.length}</div>
          <div className="stat-label">Bookings Received</div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Quick actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/agency/packages/new" className="btn btn-primary btn-sm">
            Add a Tour Package
          </Link>
          <Link to="/agency/packages" className="btn btn-outline btn-sm">
            Manage Packages
          </Link>
          <Link to="/agency/profile" className="btn btn-outline btn-sm">
            Edit Agency Profile
          </Link>
        </div>
      </div>

      <div className="card card-pad">
        <h3 style={{ marginTop: 0 }}>Recent audit activity</h3>
        {auditEntries.length === 0 ? (
          <p className="hint">No verification activity recorded yet.</p>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {auditEntries.slice(0, 4).map((a) => (
              <li key={a.id} style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                <strong style={{ color: 'var(--ink)' }}>{a.status_changed_to.replace('_', ' ')}</strong> &mdash; {a.notes}
                <div className="hint">{new Date(a.timeStamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  )
}
