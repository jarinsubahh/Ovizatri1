import React from 'react'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import { agencies } from '../../data/mockData'
import { listAuditLog } from '../../data/store'
import '../../components/layout/DashboardShell.css'

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', exact: true },
  { to: '/admin/agencies', label: 'Agencies' },
  { to: '/admin/audit-log', label: 'Audit Log' },
]

export default function AgencyAuditLog() {
  const { account } = useAuth()
  const entries = listAuditLog()

  return (
    <DashboardShell title={account.adminName} subtitle="Administrator" items={NAV_ITEMS}>
      <div className="dash-section-title">
        <h1>Agency Audit Log</h1>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state card">
          <h3>No audit entries yet</h3>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Agency</th>
                <th>Status changed to</th>
                <th>Notes</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const agency = agencies.find((a) => a.agencyID === e.agencyID)
                return (
                  <tr key={e.id}>
                    <td>{agency?.agencyName || e.agencyID}</td>
                    <td>
                      <span className={'badge ' + (e.status_changed_to === 'verified' ? 'badge-success' : e.status_changed_to === 'suspended' ? 'badge-error' : 'badge-gold')}>
                        {e.status_changed_to.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ maxWidth: 320 }}>{e.notes}</td>
                    <td>{new Date(e.timeStamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
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
