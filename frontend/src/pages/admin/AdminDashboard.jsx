import React from 'react'
import { Link } from 'react-router-dom'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import { agencies } from '../../data/mockData'
import { listAuditLog, listBookings, listPackages } from '../../data/store'
import '../../components/layout/DashboardShell.css'

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', exact: true },
  { to: '/admin/agencies', label: 'Agencies' },
  { to: '/admin/audit-log', label: 'Audit Log' },
]

export default function AdminDashboard() {
  const { account } = useAuth()
  const pendingAgencies = agencies.filter((a) => a.status === 'pending_review')
  const packages = listPackages()
  const bookings = listBookings()
  const auditEntries = listAuditLog()

  return (
    <DashboardShell title={account.adminName} subtitle="Administrator" items={NAV_ITEMS}>
      <div className="dash-section-title">
        <h1>Platform Overview</h1>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{agencies.length}</div>
          <div className="stat-label">Registered Agencies</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pendingAgencies.length}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{packages.length}</div>
          <div className="stat-label">Tour Packages</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookings.length}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
      </div>

      {pendingAgencies.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Agencies awaiting review</h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingAgencies.map((a) => (
              <li key={a.agencyID} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                <span>{a.agencyName}</span>
                <Link to="/admin/agencies" className="hint">
                  Review &rarr;
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card card-pad">
        <h3 style={{ marginTop: 0 }}>Recent audit log entries</h3>
        {auditEntries.slice(0, 5).map((a) => {
          const agency = agencies.find((ag) => ag.agencyID === a.agencyID)
          return (
            <div key={a.id} style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
              <strong style={{ color: 'var(--ink)' }}>{agency?.agencyName}</strong> &rarr; {a.status_changed_to.replace('_', ' ')}
              <div className="hint">{new Date(a.timeStamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          )
        })}
        <Link to="/admin/audit-log" className="hint" style={{ display: 'inline-block', marginTop: 10 }}>
          View full audit log &rarr;
        </Link>
      </div>
    </DashboardShell>
  )
}
