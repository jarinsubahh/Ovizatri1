import React, { useCallback, useEffect, useState } from 'react'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import StarRating from '../../components/common/StarRating'
import '../../components/layout/DashboardShell.css'
import './AnalyticsDashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const REPORTS = [
  { id: 'agencies', label: 'Agency Leaderboard', endpoint: '/stats/agencies/leaderboard' },
  { id: 'destinations', label: 'Destination Demand', endpoint: '/stats/destinations/analytics' },
  { id: 'packages', label: 'Package Performance', endpoint: '/stats/packages/performance' },
]

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', exact: true },
  { to: '/admin/agencies', label: 'Agencies' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/audit-log', label: 'Audit Log' },
]

const formatNumber = (value, digits = 0) =>
  (Number(value) || 0).toLocaleString('en-BD', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

const formatCurrency = (value) => `৳${formatNumber(value, 2)}`

function RatingCell({ value }) {
  const rating = Math.min(5, Math.max(0, Number(value) || 0))
  return (
    <span className="analytics-rating">
      <StarRating value={rating} size={14} />
      <span>{rating.toFixed(1)} / 5</span>
    </span>
  )
}

function ReportTable({ report, rows }) {
  if (report.id === 'agencies') {
    return (
      <table className="data-table analytics-table">
        <thead><tr><th>#</th><th>Agency</th><th>Packages</th><th>Completed bookings</th><th>Total revenue</th><th>Average rating</th></tr></thead>
        <tbody>{rows.map((row, index) => (
          <tr key={row.agency_id ?? index}>
            <td><span className="analytics-rank">{index + 1}</span></td>
            <td className="analytics-primary">{row.agency_name || '—'}</td>
            <td>{formatNumber(row.total_packages)}</td>
            <td>{formatNumber(row.completed_bookings)}</td>
            <td className="analytics-currency">{formatCurrency(row.total_revenue)}</td>
            <td><RatingCell value={row.avg_rating} /></td>
          </tr>
        ))}</tbody>
      </table>
    )
  }

  if (report.id === 'destinations') {
    return (
      <table className="data-table analytics-table">
        <thead><tr><th>#</th><th>Destination</th><th>Division</th><th>Packages offered</th><th>Bookings</th><th>Travelers</th><th>Confirmed revenue</th><th>Avg. package price</th></tr></thead>
        <tbody>{rows.map((row, index) => (
          <tr key={row.destination_id ?? index}>
            <td><span className="analytics-rank">{index + 1}</span></td>
            <td className="analytics-primary">{row.destination_name || '—'}</td>
            <td>{row.division || '—'}</td>
            <td>{formatNumber(row.total_packages_offered)}</td>
            <td>{formatNumber(row.total_bookings)}</td>
            <td>{formatNumber(row.total_travelers)}</td>
            <td className="analytics-currency">{formatCurrency(row.confirmed_revenue)}</td>
            <td>{formatCurrency(row.avg_package_price)}</td>
          </tr>
        ))}</tbody>
      </table>
    )
  }

  return (
    <table className="data-table analytics-table">
      <thead><tr><th>#</th><th>Package</th><th>Destination</th><th>Agency</th><th>Capacity</th><th>Price</th><th>Reviews</th><th>Travelers</th><th>Occupancy</th><th>Revenue</th></tr></thead>
      <tbody>{rows.map((row, index) => (
        <tr key={row.package_id ?? index}>
          <td><span className="analytics-rank">{index + 1}</span></td>
          <td className="analytics-primary">{row.title || '—'}</td>
          <td>{row.destination_name || '—'}</td>
          <td>{row.agency_name || '—'}</td>
          <td>{formatNumber(row.max_seat)}</td>
          <td>{formatCurrency(row.price)}</td>
          <td>{formatNumber(row.review_count)}</td>
          <td>{formatNumber(row.booked_travelers)}</td>
          <td><span className="analytics-occupancy">{formatNumber(row.occupancy_rate, 1)}%</span></td>
          <td className="analytics-currency">{formatCurrency(row.revenue_generated)}</td>
        </tr>
      ))}</tbody>
    </table>
  )
}

export default function AnalyticsDashboard() {
  const { account } = useAuth()
  const [activeReport, setActiveReport] = useState(REPORTS[0].id)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const report = REPORTS.find((item) => item.id === activeReport) || REPORTS[0]

  const loadReport = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}${report.endpoint}`, { signal })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || `Failed to load ${report.label.toLowerCase()}.`)

      const reportRows = Array.isArray(result) ? result : result.data
      if (!Array.isArray(reportRows)) throw new Error('The analytics endpoint returned an unexpected response.')
      setRows(reportRows)
    } catch (fetchError) {
      if (fetchError.name !== 'AbortError') {
        setError(fetchError.message || 'Unable to load this report.')
        setRows([])
      }
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [report.endpoint, report.label])

  useEffect(() => {
    const controller = new AbortController()
    loadReport(controller.signal)
    return () => controller.abort()
  }, [loadReport, reloadKey])

  return (
    <DashboardShell title={account?.adminName || 'Admin'} subtitle="Administrator" items={NAV_ITEMS}>
      <div className="dash-section-title">
        <div>
          <p className="eyebrow">Reporting</p>
          <h1>Analytics &amp; Complex Queries</h1>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setReloadKey((key) => key + 1)} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh report'}
        </button>
      </div>

      <div className="analytics-tabs" role="tablist" aria-label="Analytics reports">
        {REPORTS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`analytics-tab-${item.id}`}
            aria-selected={activeReport === item.id}
            aria-controls={`analytics-panel-${item.id}`}
            className={`analytics-tab${activeReport === item.id ? ' active' : ''}`}
            onClick={() => setActiveReport(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section
        id={`analytics-panel-${report.id}`}
        className="card analytics-panel"
        role="tabpanel"
        aria-labelledby={`analytics-tab-${report.id}`}
      >
        <div className="analytics-panel-heading">
          <div>
            <h2>{report.label}</h2>
            <p className="hint">{rows.length ? `${formatNumber(rows.length)} records` : 'Live report from the platform database'}</p>
          </div>
        </div>

        {loading ? (
          <div className="analytics-loading" role="status" aria-live="polite">
            <span className="analytics-spinner" aria-hidden="true" />
            <span>Loading report…</span>
          </div>
        ) : error ? (
          <div className="analytics-error" role="alert">
            <span>{error}</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setReloadKey((key) => key + 1)}>Try again</button>
          </div>
        ) : rows.length === 0 ? (
          <div className="analytics-empty">
            <strong>No report data yet</strong>
            <span>There are no records to display for this report.</span>
          </div>
        ) : (
          <div className="analytics-table-scroll">
            <ReportTable report={report} rows={rows} />
          </div>
        )}
      </section>
    </DashboardShell>
  )
}
