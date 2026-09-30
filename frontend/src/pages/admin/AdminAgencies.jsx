import React, { useEffect, useState } from 'react'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import '../../components/layout/DashboardShell.css'

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', exact: true },
  { to: '/admin/agencies', label: 'Agencies' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/audit-log', label: 'Audit Log' },
]

export default function AdminAgencies() {
  const { account } = useAuth()
  const [agencies, setAgencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAgency, setSelectedAgency] = useState(null)
  const [filter, setFilter] = useState('all')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  const fetchAgencies = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/admin/agencies`, {
        headers: {
          Authorization: `Bearer ${account?.token}`
        }
      })
      const data = await res.json()
      if (res.ok) {
        setAgencies(data.agencies || [])
      } else {
        setError(data.message || 'Failed to fetch agencies.')
      }
    } catch (err) {
      setError('Network error loading agencies.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (account?.token) {
      fetchAgencies()
    }
  }, [account])

  const handleStatusChange = async (agencyId, newStatus, notes) => {
    try {
      const res = await fetch(`${API_URL}/admin/agencies/${agencyId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account?.token}`
        },
        body: JSON.stringify({ status: newStatus, notes })
      })
      const data = await res.json()
      if (res.ok) {
        setAgencies((prev) =>
          prev.map((a) => (a.agency_id === agencyId ? { ...a, status: newStatus } : a))
        )
        if (selectedAgency?.agency_id === agencyId) {
          setSelectedAgency((prev) => ({ ...prev, status: newStatus }))
        }
      } else {
        alert(data.message || 'Action failed.')
      }
    } catch (err) {
      alert('Network error updating agency.')
    }
  }

  const filteredAgencies = agencies.filter((a) => {
    if (filter === 'all') return true
    return a.status === filter
  })

  return (
    <DashboardShell title={account?.adminName || 'Admin'} subtitle="Administrator" items={NAV_ITEMS}>
      <div className="dash-section-title">
        <h1>Agency Management & Verification</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'pending_review', 'verified', 'rejected', 'suspended'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="btn btn-sm"
              style={{
                background: filter === f ? 'var(--forest)' : 'var(--paper)',
                color: filter === f ? 'var(--paper)' : 'var(--ink)',
                border: '1px solid var(--line-strong)',
                textTransform: 'capitalize'
              }}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      {loading ? (
        <p className="hint">Loading agency records...</p>
      ) : filteredAgencies.length === 0 ? (
        <div className="card empty-state">
          <h3>No agencies found</h3>
          <p>No agencies currently match the selected filter.</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Agency</th>
                <th>Owner</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgencies.map((a) => (
                <tr key={a.agency_id}>
                  <td>
                    <strong>{a.agency_name}</strong>
                    <div className="hint">{a.email}</div>
                  </td>
                  <td>{a.owner_name}</td>
                  <td>{a.phone}</td>
                  <td>
                    <span
                      className={
                        'badge ' +
                        (a.status === 'verified'
                          ? 'badge-success'
                          : a.status === 'suspended' || a.status === 'rejected'
                          ? 'badge-error'
                          : 'badge-gold')
                      }
                    >
                      {a.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedAgency(a)}
                    >
                      View Details
                    </button>

                    {a.status !== 'verified' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          handleStatusChange(a.agency_id, 'verified', 'Approved by administrator.')
                        }
                      >
                        Approve
                      </button>
                    )}

                    {a.status !== 'rejected' && a.status === 'pending_review' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          handleStatusChange(a.agency_id, 'rejected', 'Rejected by administrator.')
                        }
                      >
                        Reject
                      </button>
                    )}

                    {a.status === 'verified' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          handleStatusChange(a.agency_id, 'suspended', 'Suspended by administrator.')
                        }
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Inspection Modal styled consistently with your theme */}
      {selectedAgency && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 20, 15, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setSelectedAgency(null)}
        >
          <div
            className="card card-pad"
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--paper)',
              boxShadow: 'var(--shadow-pop)',
              border: '1px solid var(--line-strong)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2>{selectedAgency.agency_name}</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedAgency(null)}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <span className="hint">Owner / Representative</span>
                <div><strong>{selectedAgency.owner_name}</strong></div>
              </div>
              <div>
                <span className="hint">Email Address</span>
                <div>{selectedAgency.email}</div>
              </div>
              <div>
                <span className="hint">Phone Number</span>
                <div>{selectedAgency.phone}</div>
              </div>
              <div>
                <span className="hint">Experience</span>
                <div>{selectedAgency.experience_years} years operating</div>
              </div>
              <div>
                <span className="hint">Website</span>
                <div>
                  {selectedAgency.website_url ? (
                    <a href={selectedAgency.website_url} target="_blank" rel="noreferrer" style={{ color: 'var(--river)' }}>
                      {selectedAgency.website_url}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </div>
              </div>
              <div>
                <span className="hint">Current Status</span>
                <div>
                  <span
                    className={
                      'badge ' +
                      (selectedAgency.status === 'verified'
                        ? 'badge-success'
                        : selectedAgency.status === 'rejected'
                        ? 'badge-error'
                        : 'badge-gold')
                    }
                  >
                    {selectedAgency.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span className="hint">Registered Address</span>
              <div>
                {[
                  selectedAgency.street_address,
                  selectedAgency.thana,
                  selectedAgency.district,
                  selectedAgency.division,
                  selectedAgency.postal_code
                ]
                  .filter(Boolean)
                  .join(', ') || 'No address on file'}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span className="hint">Agency Overview</span>
              <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)' }}>
                {selectedAgency.overview || 'No description provided.'}
              </p>
            </div>

            <div style={{ marginBottom: '24px', padding: '12px', background: 'var(--sand)', borderRadius: 'var(--radius-s)' }}>
              <span className="hint">Trade License Document</span>
              <div>
                {selectedAgency.trade_license_doc_url ? (
                  <a
                    href={selectedAgency.trade_license_doc_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontWeight: 600, color: 'var(--forest)' }}
                  >
                    📄 View Uploaded License Document &rarr;
                  </a>
                ) : (
                  <span style={{ color: 'var(--ink-faint)' }}>No license file attached</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {selectedAgency.status !== 'verified' && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleStatusChange(selectedAgency.agency_id, 'verified', 'Approved by admin.')}
                >
                  Approve Agency
                </button>
              )}
              {selectedAgency.status === 'pending_review' && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleStatusChange(selectedAgency.agency_id, 'rejected', 'Rejected by admin.')}
                >
                  Reject Agency
                </button>
              )}
              {selectedAgency.status === 'verified' && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleStatusChange(selectedAgency.agency_id, 'suspended', 'Suspended by admin.')}
                >
                  Suspend Agency
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}