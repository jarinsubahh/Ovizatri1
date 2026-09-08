import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import '../../components/layout/DashboardShell.css'

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', exact: true },
  { to: '/admin/agencies', label: 'Agencies' },
  { to: '/admin/audit-log', label: 'Audit Log' },
]

export default function AdminDashboard() {
  const { account } = useAuth()
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalTravelers: 0,
    totalAgencies: 0,
    totalAdmins: 0,
    totalPackages: 0,
    totalBookings: 0,
    totalRevenue: 0,
  })
  const [pendingAgencies, setPendingAgencies] = useState([])
  const [loading, setLoading] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true)
        // 1. Fetch live admin stats
        const statsRes = await fetch(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${account?.token}` }
        })
        const statsData = await statsRes.json()

        if (statsRes.ok && statsData.stats) {
          const u = statsData.stats.users || {}
          const p = statsData.stats.packages || {}
          const b = statsData.stats.bookings || {}

          setStats({
            totalAccounts: Number(u.total_accounts || 0),
            totalTravelers: Number(u.total_travelers || 0),
            totalAgencies: Number(u.total_agencies || 0),
            totalAdmins: Number(u.total_admins || 0),
            totalPackages: Number(p.total_packages || 0),
            totalBookings: Number(b.total_bookings || 0),
            totalRevenue: Number(b.total_revenue || 0),
          })
        }

        // 2. Fetch agencies pending review
        const agenciesRes = await fetch(`${API_URL}/admin/agencies?status=pending_review`, {
          headers: { Authorization: `Bearer ${account?.token}` }
        })
        const agenciesData = await agenciesRes.json()
        if (agenciesRes.ok) {
          setPendingAgencies(agenciesData.agencies || [])
        }
      } catch (err) {
        console.error('Error loading admin dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    if (account?.token) {
      loadAdminData()
    } else {
      setLoading(false)
    }
  }, [account, API_URL])

  return (
    <DashboardShell title={account?.adminName || 'Admin'} subtitle="Administrator" items={NAV_ITEMS}>
      <div className="dash-section-title">
        <h1>Platform Overview</h1>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalAgencies}</div>
          <div className="stat-label">Registered Agencies</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: pendingAgencies.length > 0 ? 'var(--gold-dark)' : undefined }}>
            {pendingAgencies.length}
          </div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalPackages}</div>
          <div className="stat-label">Tour Packages</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalBookings}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
      </div>

      {pendingAgencies.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Agencies Awaiting Review ({pendingAgencies.length})</h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingAgencies.map((a) => (
              <li
                key={a.agency_id || a.agencyID}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.9rem',
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: 8,
                }}
              >
                <div>
                  <strong>{a.agency_name || a.agencyName}</strong>
                  <div className="hint">{a.phone || a.email}</div>
                </div>
                <Link to="/admin/agencies" className="btn btn-outline btn-sm">
                  Review &rarr;
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card card-pad">
        <h3 style={{ marginTop: 0 }}>Platform Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/admin/agencies" className="btn btn-primary btn-sm">
            Manage All Agencies
          </Link>
          <Link to="/admin/audit-log" className="btn btn-outline btn-sm">
            View Audit Log
          </Link>
        </div>
      </div>
    </DashboardShell>
  )
}